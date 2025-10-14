/**
 * V2 mint planner (single transaction).
 * Sizes a debt→collateral swap from router/manager previews, then verifies repayability
 * with total collateral. Assumes inputAsset equals collateralAsset.
 */
import type { Address } from 'viem'
import { encodeFunctionData, erc20Abi, getAddress, parseAbi, zeroAddress } from 'viem'
import type { Config } from 'wagmi'
import { debugMintPlan } from '@/domain/shared/utils/debug'
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
import { applySlippageFloor } from './math'
import type { Quote, QuoteFn } from './types'

// Local types
type TokenArg = Address
type EquityInInputAssetArg = bigint
type RouterV2Call = { target: Address; data: `0x${string}`; value: bigint }
type V2Calls = Array<RouterV2Call>
type V2Call = RouterV2Call

// WETH withdraw ABI for native path
const WETH_WITHDRAW_ABI = parseAbi(['function withdraw(uint256 wad)'])

/**
 * Output plan for mintWithCalls.
 * "expected*" values come from previews and drive UI. "minShares" is the on-chain floor.
 */
export type MintPlanV2 = {
  /** Input asset (must equal collateral). */
  inputAsset: Address
  /** Equity in input asset units. */
  equityInInputAsset: EquityInInputAssetArg
  /** Manager-reported collateral asset. */
  collateralAsset: Address
  /** Manager-reported debt asset. */
  debtAsset: Address
  /** Flash-borrowed debt sized for the swap. */
  flashLoanAmount: bigint
  /** Shares floor after slippage. */
  minShares: bigint
  /** Expected shares at total collateral. */
  expectedShares: bigint
  /** Expected manager debt at total collateral. */
  expectedDebt: bigint
  /** Expected total collateral (user + swap). */
  expectedTotalCollateral: bigint
  /** Excess debt (unused; reserved). */
  expectedExcessDebt: bigint
  /** Worst-case manager debt (swap returns minOut). */
  worstCaseRequiredDebt: bigint
  /** Worst-case shares (swap returns minOut). */
  worstCaseShares: bigint
  /** Swap outputs (for display). */
  swapExpectedOut: bigint
  swapMinOut: bigint
  /**
   * Encoded calls for the router: approve+swap (ERC-20) or withdraw+payable swap (WETH/native).
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
  /** Target chain. */
  chainId: SupportedChainId
  /** Optional clamp margin (bps). */
  epsilonBps?: number
}): Promise<MintPlanV2> {
  const {
    config,
    token,
    inputAsset,
    equityInInputAsset,
    slippageBps,
    quoteDebtToCollateral,
    chainId,
    epsilonBps,
  } = params

  // Input validation
  if (slippageBps < 0 || slippageBps > 5_000) {
    throw new Error('slippageBps out of range (0-5000)')
  }
  if (typeof epsilonBps === 'number' && (epsilonBps < 0 || epsilonBps > 100)) {
    throw new Error('epsilonBps out of range (0-100)')
  }

  // 1) Resolve assets and enforce collateral-only input
  const userCollateralOut = equityInInputAsset
  const { collateralAsset, debtAsset } = await getManagerAssets({ config, token, chainId })
  const normalizedInputAsset = getAddress(inputAsset)
  const normalizedCollateralAsset = getAddress(collateralAsset)
  const normalizedDebtAsset = getAddress(debtAsset)
  debugMintPlan('assets', { inputAsset, collateralAsset, debtAsset })
  if (normalizedInputAsset !== normalizedCollateralAsset) {
    throw new Error(
      'Router v2 requires collateral-only input (inputAsset must equal collateralAsset)',
    )
  }

  // 2) Preview ideal targets (router)
  const ideal = await previewIdeal({ config, token, userCollateralOut, chainId })
  debugMintPlan('ideal', {
    userCollateralOut,
    idealDebt: ideal.idealDebt,
    targetCollateral: ideal.targetCollateral,
  })
  const neededFromDebtSwap = ideal.targetCollateral - userCollateralOut
  debugMintPlan('need.swap.out', { neededFromDebtSwap })
  if (neededFromDebtSwap <= 0n) throw new Error('Preview indicates no debt swap needed')

  // 3) Quote debt→collateral for missing collateral
  const chainWeth = getContractAddresses(chainId).tokens?.weth ?? BASE_WETH
  const normalizedWeth = getAddress(chainWeth)
  const useNativeDebtPath = normalizedDebtAsset === normalizedWeth
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
  const debtQuote = ensureQuoteHasMinOut(r.debtQuote)
  debugMintPlan('quote.initial', { debtIn, out: debtQuote.out, minOut: debtQuote.minOut ?? 0n })
  assertDebtSwapQuote(debtQuote, debtAsset, useNativeDebtPath)

  // 4) Final preview (expected) and worst-case (minOut)
  const totalCollateralInitial = userCollateralOut + debtQuote.out
  const guaranteedOut = debtQuote.minOut
  if (guaranteedOut <= 0n) throw new Error('Swap quote minOut must be > 0')
  let [final, worstCase] = await Promise.all([
    previewFinal({ config, token, totalCollateral: totalCollateralInitial, chainId }),
    previewFinal({ config, token, totalCollateral: userCollateralOut + guaranteedOut, chainId }),
  ])
  debugMintPlan('final.initial', {
    totalCollateral: totalCollateralInitial,
    requiredDebt: final.requiredDebt,
    shares: final.shares,
  })
  debugMintPlan('worst.preview', {
    totalCollateral: userCollateralOut + guaranteedOut,
    requiredDebt: worstCase.requiredDebt,
    shares: worstCase.shares,
  })

  // 5) Choose a repay-safe flash size and quote (single clamp if safe)
  const repayableFloor0 = minBigint(final.requiredDebt, worstCase.requiredDebt)
  const swapFloor = debtIn
  const sizing = await chooseRepaySafeFlashAndQuote({
    swapFloor,
    repayableFloor: repayableFloor0,
    neededFromDebtSwap,
    inTokenForQuote,
    collateralAsset,
    debtAsset,
    userCollateralOut,
    quoteDebtToCollateral,
    config,
    token,
    chainId,
    useNativeDebtPath,
  })
  const { effectiveDebtIn, effectiveQuote, finalPass, worstPass } = sizing
  final = finalPass
  debugMintPlan('final.singlepass', {
    flash: effectiveDebtIn,
    out: effectiveQuote.out,
    minOut: typeof effectiveQuote.minOut === 'bigint' ? effectiveQuote.minOut : 0n,
    requiredDebt: final.requiredDebt,
    shares: final.shares,
  })

  // Build calls for the chosen swap path/amount
  const calls: V2Calls = [
    ...buildDebtSwapCalls({
      debtAsset,
      debtQuote: effectiveQuote,
      debtIn: effectiveDebtIn,
      useNative: useNativeDebtPath,
    }),
  ]

  const minShares = applySlippageFloor(final.shares, slippageBps)

  return {
    inputAsset,
    equityInInputAsset,
    collateralAsset,
    debtAsset,
    flashLoanAmount: effectiveDebtIn,
    minShares,
    expectedShares: final.shares,
    expectedDebt: final.requiredDebt,
    expectedTotalCollateral: userCollateralOut + effectiveQuote.out,
    expectedExcessDebt: 0n,
    worstCaseRequiredDebt: worstPass.requiredDebt,
    worstCaseShares: worstPass.shares,
    swapExpectedOut: effectiveQuote.out,
    swapMinOut:
      typeof effectiveQuote.minOut === 'bigint' ? effectiveQuote.minOut : effectiveQuote.out,
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
  // Exact-in quote seeded from manager-sized idealDebt
  let debtIn = idealDebt
  let debtQuote: Quote & { minOut: bigint } = ensureQuoteHasMinOut(
    await quote({ inToken, outToken, amountIn: debtIn, intent: 'exactIn' }),
  )

  // If minOut is below target, scale debtIn upward to meet the missing collateral.
  let attempts = 0
  while (debtQuote.minOut < neededOut && attempts < 3) {
    // scale up assuming quasi-linear behavior; will be corrected by re-quote
    const scaled = mulDivCeil(debtIn, neededOut, debtQuote.minOut)
    if (scaled <= debtIn) break
    debtIn = scaled
    debtQuote = ensureQuoteHasMinOut(
      await quote({ inToken, outToken, amountIn: debtIn, intent: 'exactIn' }),
    )
    attempts += 1
  }
  debugMintPlan('quote.adjusted', {
    debtIn,
    out: debtQuote.out,
    minOut: typeof debtQuote.minOut === 'bigint' ? debtQuote.minOut : 0n,
    neededOut,
  })
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

/**
 * Pick a flash size that is both repayable by the manager and sufficient for the swap to
 * produce the missing collateral under minOut. Performs at most one downward clamp.
 */
async function chooseRepaySafeFlashAndQuote(args: {
  swapFloor: bigint
  repayableFloor: bigint
  neededFromDebtSwap: bigint
  inTokenForQuote: Address
  collateralAsset: Address
  debtAsset: Address
  userCollateralOut: bigint
  quoteDebtToCollateral: QuoteFn
  config: Config
  token: Address
  chainId: number
  useNativeDebtPath: boolean
}): Promise<{
  effectiveDebtIn: bigint
  effectiveQuote: Quote & { minOut: bigint }
  finalPass: { requiredDebt: bigint; shares: bigint }
  worstPass: { requiredDebt: bigint; shares: bigint }
}> {
  const {
    swapFloor,
    repayableFloor,
    neededFromDebtSwap,
    inTokenForQuote,
    collateralAsset,
    debtAsset,
    userCollateralOut,
    quoteDebtToCollateral,
    config,
    token,
    chainId,
    useNativeDebtPath,
  } = args

  // Start at the higher of: swap-coverage floor, repayable floor
  let effectiveDebtIn = maxBigint(swapFloor, repayableFloor)
  const firstQuoteRaw = await quoteDebtToCollateral({
    inToken: inTokenForQuote,
    outToken: collateralAsset,
    amountIn: effectiveDebtIn,
    intent: 'exactIn',
  })
  let effectiveQuote = ensureQuoteHasMinOut(firstQuoteRaw)
  assertDebtSwapQuote(effectiveQuote, debtAsset, useNativeDebtPath)

  // Compute previews at expected and worst (minOut) total collateral
  let finalPass = await previewFinal({
    config,
    token,
    totalCollateral: userCollateralOut + effectiveQuote.out,
    chainId,
  })
  let worstPass = await previewFinal({
    config,
    token,
    totalCollateral: userCollateralOut + effectiveQuote.minOut,
    chainId,
  })

  // Attempt a single clamp if manager requires less debt
  const repayableNext = minBigint(finalPass.requiredDebt, worstPass.requiredDebt)
  if (repayableNext < effectiveDebtIn) {
    const candidateDebtIn = repayableNext > 0n ? repayableNext : 1n
    const candidateQuoteRaw = await quoteDebtToCollateral({
      inToken: inTokenForQuote,
      outToken: collateralAsset,
      amountIn: candidateDebtIn,
      intent: 'exactIn',
    })
    const candidateQuote = ensureQuoteHasMinOut(candidateQuoteRaw)
    // Only clamp if swap still guarantees the missing collateral
    if (candidateQuote.minOut >= neededFromDebtSwap) {
      effectiveDebtIn = candidateDebtIn
      effectiveQuote = candidateQuote
      assertDebtSwapQuote(effectiveQuote, debtAsset, useNativeDebtPath)
      finalPass = await previewFinal({
        config,
        token,
        totalCollateral: userCollateralOut + effectiveQuote.out,
        chainId,
      })
      worstPass = await previewFinal({
        config,
        token,
        totalCollateral: userCollateralOut + effectiveQuote.minOut,
        chainId,
      })
    }
  }

  return { effectiveDebtIn, effectiveQuote, finalPass, worstPass }
}

function minBigint(a: bigint, b: bigint): bigint {
  return a < b ? a : b
}

function maxBigint(a: bigint, b: bigint): bigint {
  return a > b ? a : b
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

// Shared validation for swap quotes used by the planner
function assertDebtSwapQuote(
  quote: Quote,
  debtAsset: Address,
  useNativeDebtPath: boolean,
): asserts quote is Quote & { minOut: bigint } {
  if (typeof quote.minOut !== 'bigint') throw new Error('Swap quote missing minOut')
  if (useNativeDebtPath) {
    // Only error if adapter explicitly indicates non-native input
    if (quote.wantsNativeIn === false) {
      throw new Error(
        'Adapter inconsistency: native path selected but quote does not want native in',
      )
    }
  } else {
    const approval = quote.approvalTarget
    if (!approval) throw new Error('Missing approval target for ERC20 swap')
    const normalizedApproval = getAddress(approval)
    if (normalizedApproval === zeroAddress)
      throw new Error('Missing approval target for ERC20 swap')
    if (normalizedApproval === getAddress(debtAsset)) {
      throw new Error('Approval target cannot equal input token')
    }
  }
}

// Ensure a quote always has a concrete minOut value (fallback to out)
function ensureQuoteHasMinOut(q: Quote): Quote & { minOut: bigint } {
  return typeof q.minOut === 'bigint' ? (q as Quote & { minOut: bigint }) : { ...q, minOut: q.out }
}

// debugMintPlan moved to shared util

// Iterative refinement removed in favor of a single minOut-aware pass.
function mulDivCeil(a: bigint, b: bigint, c: bigint): bigint {
  if (c === 0n) return 0n
  return (a * b + (c - 1n)) / c
}
