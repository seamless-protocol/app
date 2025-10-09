/**
 * Planner for V2 single-tx mint.
 *
 * Builds optional user-input->collateral conversion and the debt->collateral swap, then
 * re-previews the manager state with total collateral to ensure repayability.
 */
import type { Address } from 'viem'
import { encodeFunctionData, erc20Abi, getAddress, parseAbi } from 'viem'
import type { Config } from 'wagmi'
import {
  BASE_WETH,
  ETH_SENTINEL,
  getContractAddresses,
  type SupportedChainId,
} from '@/lib/contracts/addresses'
import {
  // V2 reads
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
  readLeverageManagerV2PreviewDeposit,
  readLeverageRouterV2PreviewDeposit,
} from '@/lib/contracts/generated'
import { applySlippageFloor, mulDivFloor } from './math'
import type { Quote, QuoteFn } from './types'

// Basis points and convergence controls
const BPS = 10_000n
const DEFAULT_MAX_ADJUST_PASSES = 3
// Keep margin at 0 bps initially to preserve strict unit expectations; can be tuned (50–100 bps)
const DEFAULT_MARGIN_BPS = 0n

// Local structural types (avoid brittle codegen coupling in tests/VNet)
type TokenArg = Address
type EquityInInputAssetArg = bigint
type RouterV2Call = { target: Address; data: `0x${string}`; value: bigint }
type V2Calls = Array<RouterV2Call>
type V2Call = RouterV2Call

// Base WETH native path support
const WETH_WITHDRAW_ABI = parseAbi(['function withdraw(uint256 wad)'])

/**
 * Structured plan for executing a single-transaction mint.
 *
 * Fields prefixed with "expected" are derived from LeverageManager.previewMint and
 * are used to size swaps and to provide UI expectations. "minShares" is a
 * slippage-adjusted floor used for the on-chain mint call.
 */
export type MintPlanV2 = {
  /** User-selected input asset (can differ from collateral). */
  inputAsset: Address
  /** Equity amount denominated in the input asset. */
  equityInInputAsset: EquityInInputAssetArg
  /** Token's collateral asset as reported by the manager. */
  collateralAsset: Address
  /** Token's debt asset as reported by the manager. */
  debtAsset: Address
  /** Minimum acceptable shares after applying `slippageBps` against expected shares. */
  minShares: bigint
  /** Shares expected from preview with total collateral (user + swap output). */
  expectedShares: bigint
  /** Debt expected from preview with total collateral (prior to flash loan payback). */
  expectedDebt: bigint
  /** Total collateral expected (user out + debt->collateral swap out). */
  expectedTotalCollateral: bigint
  /** Excess debt (if previewed debt exceeds the flash loan amount sized by the quote). */
  expectedExcessDebt: bigint
  /**
   * Encoded router calls (approve + swap) to be submitted to V2 `mintWithCalls`.
   * The sequence always includes the debt->collateral swap plus an ERC-20 approve
   * when the debt asset is not the wrapped native token; if `inputAsset` differs
   * from `collateralAsset`, it also includes an input->collateral approval and swap.
   */
  calls: V2Calls
}

export async function planMintV2(params: {
  config: Config
  token: TokenArg
  inputAsset: Address
  equityInInputAsset: EquityInInputAssetArg
  slippageBps: number
  quoteDebtToCollateral: QuoteFn
  /** Chain ID to execute the transaction on */
  chainId: number
}): Promise<MintPlanV2> {
  const {
    config,
    token,
    inputAsset,
    equityInInputAsset,
    slippageBps,
    quoteDebtToCollateral,
    chainId,
  } = params

  // 1) Resolve manager assets and enforce collateral-only input in initial scope
  const { collateralAsset, debtAsset } = await getManagerAssets({
    config,
    token,
    chainId,
  })
  if (getAddress(inputAsset) !== getAddress(collateralAsset)) {
    throw new Error('Router v2 initial scope requires collateral-only input')
  }
  const userCollateralOut = equityInInputAsset

  // 2) Preview ideal targets using only user collateral (router semantics)
  const ideal = await previewIdeal({ config, token, userCollateralOut, chainId })
  debugMintPlan('ideal', {
    userCollateralOut,
    idealDebt: ideal.idealDebt,
    targetCollateral: ideal.targetCollateral,
  })
  const neededFromDebtSwap = ideal.targetCollateral - userCollateralOut
  if (neededFromDebtSwap <= 0n) throw new Error('Preview indicates no debt swap needed')

  // 3) Quote debt->collateral for the missing collateral
  const chainWeth = getContractAddresses(chainId).tokens?.weth ?? BASE_WETH
  const useNativeDebtPath = getAddress(debtAsset) === getAddress(chainWeth)
  const inTokenForQuote = useNativeDebtPath ? ETH_SENTINEL : debtAsset
  // Default to exact-in path for robustness across venues
  const r = await quoteDebtForMissingCollateral({
    idealDebt: ideal.idealDebt,
    neededOut: neededFromDebtSwap,
    inToken: inTokenForQuote,
    outToken: collateralAsset,
    quote: quoteDebtToCollateral,
  })
  const debtIn = r.debtIn
  const debtQuote = r.debtQuote
  debugMintPlan('quote.initial', { debtIn, out: debtQuote.out })

  // 4) Final preview with total collateral to derive requiredDebt and shares
  const totalCollateral = userCollateralOut + debtQuote.out
  let final = await previewFinal({ config, token, totalCollateral, chainId })
  debugMintPlan('final.initial', {
    totalCollateral,
    requiredDebt: final.requiredDebt,
    shares: final.shares,
  })

  // 5) Iterative clamp + collateral guard (bounded, monotone, exact-in)
  const refined = await finalizeDebtQuote({
    config,
    token,
    chainId,
    userCollateralOut,
    targetCollateral: ideal.targetCollateral,
    inTokenForQuote,
    collateralAsset,
    quoteDebtToCollateral,
    initialDebtIn: debtIn,
    initialQuote: debtQuote,
    maxPasses: DEFAULT_MAX_ADJUST_PASSES,
    marginBps: DEFAULT_MARGIN_BPS,
  })
  const effectiveDebtIn = refined.effectiveDebtIn
  const effectiveQuote = refined.effectiveQuote
  final = refined.final

  // Build calls based on the amount actually used for the swap
  const calls: V2Calls = [
    ...buildDebtSwapCalls({
      debtAsset,
      debtQuote: effectiveQuote,
      debtIn: effectiveDebtIn,
      useNative: useNativeDebtPath,
    }),
  ]

  const minShares = applySlippageFloor(final.shares, slippageBps)
  // Excess debt means we plan to borrow above what the manager requires; shortfall is the opposite
  const debtExcess =
    effectiveDebtIn > final.requiredDebt ? effectiveDebtIn - final.requiredDebt : 0n

  return {
    inputAsset,
    equityInInputAsset,
    collateralAsset,
    debtAsset,
    minShares,
    expectedShares: final.shares,
    expectedDebt: final.requiredDebt,
    expectedTotalCollateral: userCollateralOut + effectiveQuote.out,
    expectedExcessDebt: debtExcess,
    calls,
  }
}

// Helpers — defined below the main function for clarity

/**
 * Size the debt flash loan and quote the debt->collateral swap.
 *
 * Default: exact-in (fast) — start from manager-sized idealDebt and refine.
 * If the adapter supports exact-out and we ever need a fallback, add it explicitly
 * in the caller, but keep default path as exact-in for responsiveness.
 */
export async function quoteDebtForMissingCollateral(args: {
  idealDebt: bigint
  neededOut: bigint
  inToken: Address
  outToken: Address
  quote: QuoteFn
}): Promise<{ debtIn: bigint; debtQuote: Quote }> {
  const { idealDebt, neededOut, inToken, outToken, quote } = args
  let debtIn = idealDebt

  // Exact-in quote with manager-sized idealDebt
  let debtQuote = await quote({ inToken, outToken, amountIn: debtIn, intent: 'exactIn' })

  // If the quote out is below the target, proportionally reduce the flash loan input once,
  // then re-quote. This mirrors the integration test behavior (reduce input to match pathing).
  if (debtQuote.out < neededOut) {
    const adjusted = mulDivFloor(idealDebt, debtQuote.out, neededOut)
    if (adjusted > 0n && adjusted < debtIn) {
      debtIn = adjusted
      debtQuote = await quote({ inToken, outToken, amountIn: debtIn, intent: 'exactIn' })
    }
  }

  return { debtIn, debtQuote }
}

// No clamping helper: deposit returns excess debt to the user when requiredDebt > flash loan.

/**
 * Router-only preview used to determine the ideal target collateral and ideal debt for user equity.
 */
async function previewIdeal(args: {
  config: Config
  token: Address
  userCollateralOut: bigint
  chainId: number
}): Promise<{ targetCollateral: bigint; idealDebt: bigint; idealShares: bigint }> {
  const { config, token, userCollateralOut, chainId } = args
  const p = await readLeverageRouterV2PreviewDeposit(config, {
    args: [token, userCollateralOut],
    chainId: chainId as SupportedChainId,
  })
  return {
    targetCollateral: p.collateral,
    idealDebt: p.debt,
    idealShares: p.shares,
  }
}

/**
 * Manager preview with total collateral to derive requiredDebt and final shares.
 */
async function previewFinal(args: {
  config: Config
  token: Address
  totalCollateral: bigint
  chainId: number
}): Promise<{ requiredDebt: bigint; shares: bigint }> {
  const { config, token, totalCollateral, chainId } = args
  const m = await readLeverageManagerV2PreviewDeposit(config, {
    args: [token, totalCollateral],
    chainId: chainId as SupportedChainId,
  })
  return { requiredDebt: m.debt, shares: m.shares }
}

async function getManagerAssets(args: { config: Config; token: TokenArg; chainId: number }) {
  const { config, token, chainId } = args
  const collateralAsset = await readLeverageManagerV2GetLeverageTokenCollateralAsset(config, {
    args: [token],
    chainId: chainId as SupportedChainId,
  })
  const debtAsset = await readLeverageManagerV2GetLeverageTokenDebtAsset(config, {
    args: [token],
    chainId: chainId as SupportedChainId,
  })
  return { collateralAsset, debtAsset }
}

function buildDebtSwapCalls(args: {
  debtAsset: Address
  debtQuote: Quote
  debtIn: bigint
  useNative: boolean
}): Array<V2Call> {
  const { debtAsset, debtQuote, debtIn, useNative } = args
  if (useNative) {
    return [
      {
        target: debtAsset,
        data: encodeFunctionData({
          abi: WETH_WITHDRAW_ABI,
          functionName: 'withdraw',
          args: [debtIn],
        }),
        value: 0n,
      },
      {
        target: debtQuote.approvalTarget,
        data: debtQuote.calldata,
        value: debtIn,
      },
    ]
  }
  // ERC20-in path: approve router for debt asset then perform swap
  return [
    {
      target: debtAsset,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [debtQuote.approvalTarget, debtIn],
      }),
      value: 0n,
    },
    { target: debtQuote.approvalTarget, data: debtQuote.calldata, value: 0n },
  ]
}

// Internal test-aware debug logger (no-ops outside test runs)
function debugMintPlan(label: string, data: Record<string, unknown>): void {
  try {
    // Only log during tests (integration/e2e set TEST_MODE)
    const shouldLog = typeof process !== 'undefined' && !!process.env && !!process.env['TEST_MODE']
    if (!shouldLog) return
    // eslint-disable-next-line no-console
    console.info('[Mint][Plan][Debug]', label, sanitizeBigints(data))
  } catch {
    // ignore
  }
}

function sanitizeBigints(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'bigint') out[k] = v.toString()
    else out[k] = v as unknown
  }
  return out
}

// Helper: bounded, monotone refinement loop to enforce reprice and collateral guards
async function finalizeDebtQuote(args: {
  config: Config
  token: Address
  chainId: number
  userCollateralOut: bigint
  targetCollateral: bigint
  inTokenForQuote: Address
  collateralAsset: Address
  quoteDebtToCollateral: QuoteFn
  initialDebtIn: bigint
  initialQuote: Quote
  maxPasses: number
  marginBps: bigint
}): Promise<{
  effectiveDebtIn: bigint
  effectiveQuote: Quote
  final: { requiredDebt: bigint; shares: bigint }
}> {
  const {
    config,
    token,
    chainId,
    userCollateralOut,
    targetCollateral,
    inTokenForQuote,
    collateralAsset,
    quoteDebtToCollateral,
    initialDebtIn,
    initialQuote,
    maxPasses,
    marginBps,
  } = args

  let effectiveDebtIn = initialDebtIn
  let effectiveQuote = initialQuote
  let final = await previewFinal({
    config,
    token,
    totalCollateral: userCollateralOut + effectiveQuote.out,
    chainId,
  })
  let lastRequired = final.requiredDebt

  for (let pass = 0; pass < maxPasses; pass++) {
    // 1) Reprice guard
    const maxBorrowWithMargin = lastRequired > 0n ? (lastRequired * (BPS - marginBps)) / BPS : 0n
    if (effectiveDebtIn > maxBorrowWithMargin) {
      effectiveDebtIn = maxBorrowWithMargin
      if (effectiveDebtIn <= 0n) {
        debugMintPlan('converged', { pass, reason: 'zero-debt-after-clamp' })
        break
      }
      effectiveQuote = await quoteDebtToCollateral({
        inToken: inTokenForQuote,
        outToken: collateralAsset,
        amountIn: effectiveDebtIn,
        intent: 'exactIn',
      })
      const totalCollateralAfterClamp = userCollateralOut + effectiveQuote.out
      final = await previewFinal({
        config,
        token,
        totalCollateral: totalCollateralAfterClamp,
        chainId,
      })
      lastRequired = final.requiredDebt
      debugMintPlan('clamp.iter', {
        pass,
        effectiveDebtIn,
        out: effectiveQuote.out,
        totalCollateralAfterClamp,
        requiredDebt: final.requiredDebt,
        shares: final.shares,
      })
    }

    // 2) Collateral guard
    const totalNow = userCollateralOut + effectiveQuote.out
    if (totalNow >= targetCollateral) {
      debugMintPlan('converged', { pass, reason: 'collateral-ok & reprice-ok' })
      break
    }

    // Downscale planned debt to improve total/target ratio
    const scaled = mulDivFloor(
      effectiveDebtIn * (BPS - marginBps),
      totalNow,
      (targetCollateral === 0n ? 1n : targetCollateral) * BPS,
    )
    const nextDebtIn =
      scaled > 0n && scaled < effectiveDebtIn
        ? scaled
        : effectiveDebtIn > 0n
          ? effectiveDebtIn - 1n
          : 0n

    if (nextDebtIn === effectiveDebtIn || nextDebtIn === 0n) {
      debugMintPlan('converged', { pass, reason: 'no-further-progress' })
      break
    }

    effectiveDebtIn = nextDebtIn
    effectiveQuote = await quoteDebtToCollateral({
      inToken: inTokenForQuote,
      outToken: collateralAsset,
      amountIn: effectiveDebtIn,
      intent: 'exactIn',
    })
    const totalAfterAdjust = userCollateralOut + effectiveQuote.out
    final = await previewFinal({ config, token, totalCollateral: totalAfterAdjust, chainId })
    lastRequired = final.requiredDebt
    debugMintPlan('repay.adjust.iter', {
      pass,
      adjustedDebtIn: effectiveDebtIn,
      out: effectiveQuote.out,
      totalCollateralAfterAdjust: totalAfterAdjust,
      requiredDebt: final.requiredDebt,
      shares: final.shares,
    })
  }

  // Final safety: tiny shave if still over requiredDebt
  if (effectiveDebtIn > final.requiredDebt) {
    const shaved = (final.requiredDebt * (BPS - 1n)) / BPS
    if (shaved < effectiveDebtIn) {
      effectiveDebtIn = shaved
      effectiveQuote = await quoteDebtToCollateral({
        inToken: inTokenForQuote,
        outToken: collateralAsset,
        amountIn: effectiveDebtIn,
        intent: 'exactIn',
      })
      const totalAfterShave = userCollateralOut + effectiveQuote.out
      final = await previewFinal({ config, token, totalCollateral: totalAfterShave, chainId })
      debugMintPlan('final.shave', {
        effectiveDebtIn,
        out: effectiveQuote.out,
        totalAfterShave,
        requiredDebt: final.requiredDebt,
        shares: final.shares,
      })
    }
  }

  return { effectiveDebtIn, effectiveQuote, final }
}
