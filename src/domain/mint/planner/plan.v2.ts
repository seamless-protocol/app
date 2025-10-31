/**
 * Planner for V2 single-tx mint.
 *
 * Builds the debt->collateral swap sized from router/manager previews, then
 * re-previews the manager state with total collateral to ensure repayability.
 * Note: input-asset->collateral conversions are not handled here; the current
 * V2 planner assumes `inputAsset === collateralAsset`.
 */
import type { Address } from 'viem'
import { encodeFunctionData, erc20Abi, getAddress, zeroAddress } from 'viem'
import type { Config } from 'wagmi'
import { getPublicClient } from 'wagmi/actions'
import type { SupportedChainId } from '@/lib/contracts/addresses'
import {
  // V2 reads
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
  readLeverageManagerV2PreviewDeposit,
  readLeverageRouterV2PreviewDeposit,
} from '@/lib/contracts/generated'
import { fetchCoingeckoTokenUsdPrices } from '@/lib/prices/coingecko'
import { applySlippageFloor, mulDivFloor } from './math'
import type { Quote, QuoteFn } from './types'

// Local structural types (avoid brittle codegen coupling in tests/VNet)
type TokenArg = Address
type EquityInInputAssetArg = bigint
type RouterV2Call = { target: Address; data: `0x${string}`; value: bigint }
type V2Calls = Array<RouterV2Call>
type V2Call = RouterV2Call

// No additional normalizers; use viem's getAddress where needed

/**
 * Structured plan for executing a single-transaction mint.
 *
 * Fields prefixed with "expected" are derived from LeverageManager.previewDeposit and
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
  /** Amount of debt we plan to flash-borrow and swap (sized once). */
  flashLoanAmount: bigint
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
  /** Worst-case preview debt if the swap only returns minOut. */
  worstCaseRequiredDebt: bigint
  /** Worst-case preview shares if the swap only returns minOut. */
  worstCaseShares: bigint
  /** Swap outputs for transparency. */
  swapExpectedOut: bigint
  swapMinOut: bigint
  /**
   * Encoded router calls (approve + swap) to be submitted to V2 `mintWithCalls`.
   * The sequence includes the debt->collateral swap plus an ERC-20 approve when
   * the debt asset is not the wrapped native token. Input->collateral conversions
   * are out of scope for this planner.
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
  chainId: SupportedChainId
  /** Optional per-pair epsilon (bps) for single-pass clamp */
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

  // Basic input validation
  if (slippageBps < 0 || slippageBps > 5_000) {
    throw new Error('slippageBps out of range (0-5000)')
  }
  if (typeof epsilonBps === 'number' && (epsilonBps < 0 || epsilonBps > 100)) {
    throw new Error('epsilonBps out of range (0-100)')
  }

  // 1) Resolve manager assets first, enforce collateral-only input, then preview ideal
  const userCollateralOut = equityInInputAsset
  const { collateralAsset, debtAsset } = await getManagerAssets({ config, token, chainId })
  const normalizedInputAsset = getAddress(inputAsset)
  const normalizedCollateralAsset = getAddress(collateralAsset)
  debugMintPlan('assets', { inputAsset, collateralAsset, debtAsset })
  if (normalizedInputAsset !== normalizedCollateralAsset) {
    throw new Error(
      'Router v2 requires collateral-only input (inputAsset must equal collateralAsset)',
    )
  }

  // 2) Ideal targets (router semantics)
  const ideal = await previewIdeal({ config, token, userCollateralOut, chainId })
  debugMintPlan('ideal', {
    userCollateralOut,
    idealDebt: ideal.idealDebt,
    targetCollateral: ideal.targetCollateral,
  })
  const neededFromDebtSwap = ideal.targetCollateral - userCollateralOut
  debugMintPlan('need.swap.out', { neededFromDebtSwap })
  if (neededFromDebtSwap <= 0n) throw new Error('Preview indicates no debt swap needed')

  // 3) Quote debt->collateral for the missing collateral
  const inTokenForQuote = debtAsset
  // Default to exact-in path for robustness across venues
  const r = await quoteDebtForMissingCollateral({
    idealDebt: ideal.idealDebt,
    neededOut: neededFromDebtSwap,
    inToken: inTokenForQuote,
    outToken: collateralAsset,
    quote: quoteDebtToCollateral,
  })
  let debtIn = r.debtIn
  let effectiveQuote = r.debtQuote
  if (typeof effectiveQuote.minOut !== 'bigint') {
    effectiveQuote = { ...effectiveQuote, minOut: effectiveQuote.out }
  }
  debugMintPlan('quote.initial', {
    debtIn,
    out: effectiveQuote.out,
    minOut: effectiveQuote.minOut ?? 0n,
  })
  assertDebtSwapQuote(effectiveQuote, debtAsset)

  const totalCollateralInitial = userCollateralOut + effectiveQuote.out
  const intermediateQuote = await previewFinal({
    config,
    token,
    totalCollateral: totalCollateralInitial,
    chainId,
  })
  debugMintPlan('quote.intermediateQuote', {
    totalCollateral: totalCollateralInitial,
    requiredDebt: intermediateQuote.requiredDebt,
    shares: intermediateQuote.shares,
  })

  let finalQuote = intermediateQuote

  // If the debt received from the LT deposit is still less than the flash loan, we need to adjust the flash loan amount down further.
  // We adjust it as low as possible wrt the slippage tolerance.
  if (intermediateQuote.requiredDebt < debtIn) {
    const adjustedUserCollateralOut = applySlippageFloor(userCollateralOut, slippageBps)
    const adjustedIdeal = await previewIdeal({
      config,
      token,
      userCollateralOut: adjustedUserCollateralOut,
      chainId,
    })
    const adjustedQuote = await previewFinal({
      config,
      token,
      totalCollateral: adjustedIdeal.targetCollateral,
      chainId,
    })

    debugMintPlan('final.maxSlippage', {
      totalCollateral: adjustedIdeal.targetCollateral,
      requiredDebt: adjustedQuote.requiredDebt,
      shares: adjustedQuote.shares,
    })

    debtIn = adjustedQuote.requiredDebt
    effectiveQuote = await quoteDebtToCollateral({
      inToken: inTokenForQuote,
      outToken: collateralAsset,
      amountIn: debtIn,
      intent: 'exactIn',
    })

    finalQuote = await previewFinal({
      config,
      token,
      totalCollateral: userCollateralOut + effectiveQuote.out,
      chainId,
    })
  }

  const excessDebt = finalQuote.requiredDebt - debtIn

  const publicClient = getPublicClient(config)
  if (!publicClient) {
    throw new Error('Public client unavailable for mint plan')
  }
  // TODO: Multicall these / pass in
  const collateralAssetDecimals = await publicClient.readContract({
    address: collateralAsset,
    abi: erc20Abi,
    functionName: 'decimals',
  })
  const debtAssetDecimals = await publicClient.readContract({
    address: debtAsset,
    abi: erc20Abi,
    functionName: 'decimals',
  })

  const usdPriceMap = await fetchCoingeckoTokenUsdPrices(chainId, [collateralAsset, debtAsset])
  const minEquityDepositedInCollateral = applySlippageFloor(equityInInputAsset, slippageBps)
  const minEquityDepositedInUsd =
    (usdPriceMap?.[inputAsset.toLowerCase()] ?? 0) *
    (Number(minEquityDepositedInCollateral) / 10 ** Number(collateralAssetDecimals))

  const { equityInCollateral: sharesValueInCollateral, equityInUsd: sharesValueInUsd } =
    await calculateEquity({
      collateralAsset,
      debtAsset,
      collateralAssetDecimals,
      debtAssetDecimals,
      collateralAdded: finalQuote.requiredCollateral,
      debtBorrowed: debtIn,
      usdPriceMap,
    })
  const excessDebtInUsd =
    (usdPriceMap?.[debtAsset.toLowerCase()] ?? 0) * (Number(excessDebt) / 10 ** Number(debtAssetDecimals))

  // Slippage is wrt the coingecko usd prices of the LTs and debt received
  if (minEquityDepositedInUsd > sharesValueInUsd + excessDebtInUsd) {
    throw new Error('Try increasing slippage: the transaction will likely revert due to slippage')
  }

  const effectiveAllowedSlippage = Number(
    ((sharesValueInCollateral - minEquityDepositedInCollateral) * 10000n) / sharesValueInCollateral,
  )
  const minShares = applySlippageFloor(finalQuote.shares, effectiveAllowedSlippage)

  // Build calls based on the amount actually used for the swap
  const calls: V2Calls = [
    ...buildDebtSwapCalls({
      debtAsset,
      debtQuote: effectiveQuote,
      debtIn,
    }),
  ]

  return {
    inputAsset,
    equityInInputAsset,
    collateralAsset,
    debtAsset,
    flashLoanAmount: debtIn,
    minShares,
    expectedShares: finalQuote.shares,
    expectedDebt: finalQuote.requiredDebt,
    expectedTotalCollateral: userCollateralOut + effectiveQuote.out,
    expectedExcessDebt: excessDebt,
    worstCaseRequiredDebt: 0n, // TODO: Do we need this?
    worstCaseShares: 0n, // TODO: Do we need this?
    swapExpectedOut: effectiveQuote.out,
    swapMinOut:
      typeof effectiveQuote.minOut === 'bigint' ? effectiveQuote.minOut : effectiveQuote.out,
    calls,
  }
}

async function calculateEquity(args: {
  collateralAsset: Address
  debtAsset: Address
  collateralAssetDecimals: number
  debtAssetDecimals: number
  collateralAdded: bigint
  debtBorrowed: bigint
  usdPriceMap: Record<string, number>
}): Promise<{ equityInCollateral: bigint; equityInUsd: number }> {
  const {
    collateralAsset,
    debtAsset,
    collateralAssetDecimals,
    debtAssetDecimals,
    collateralAdded,
    debtBorrowed,
    usdPriceMap,
  } = args

  const collateralInUsd =
    (usdPriceMap?.[collateralAsset.toLowerCase()] ?? 0) *
    (Number(collateralAdded) / 10 ** Number(collateralAssetDecimals))

  const debtInUsd =
    (usdPriceMap?.[debtAsset.toLowerCase()] ?? 0) * (Number(debtBorrowed) / 10 ** Number(debtAssetDecimals))

  const equityInUsd = collateralInUsd - debtInUsd

  const equityInCollateral = BigInt(
    Math.floor(
      (equityInUsd / (usdPriceMap?.[collateralAsset.toLowerCase()] ?? 0)) *
        10 ** Number(collateralAssetDecimals),
    ),
  )

  return { equityInCollateral, equityInUsd }
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
  // Exact-in quote with manager-sized idealDebt
  let debtIn = idealDebt
  let debtQuote = await quote({ inToken, outToken, amountIn: debtIn, intent: 'exactIn' })

  // If the quote out is below the target, proportionally reduce once and re-quote.
  if (debtQuote.out < neededOut) {
    const adjusted = mulDivFloor(debtIn, debtQuote.out, neededOut)
    if (adjusted > 0n && adjusted < debtIn) {
      debtIn = adjusted
      debtQuote = await quote({ inToken, outToken, amountIn: debtIn, intent: 'exactIn' })
      debugMintPlan('quote.adjusted', { debtIn, out: debtQuote.out, neededOut })
    }
  }
  return { debtIn, debtQuote }
}

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
}): Promise<{ requiredDebt: bigint; shares: bigint; requiredCollateral: bigint }> {
  const { config, token, totalCollateral, chainId } = args
  const m = await readLeverageManagerV2PreviewDeposit(config, {
    args: [token, totalCollateral],
    chainId: chainId as SupportedChainId,
  })
  return { requiredDebt: m.debt, shares: m.shares, requiredCollateral: m.collateral }
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
}): Array<V2Call> {
  const { debtAsset, debtQuote, debtIn } = args
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
): asserts quote is Quote & { minOut: bigint } {
  if (typeof quote.minOut !== 'bigint') throw new Error('Swap quote missing minOut')
  const approval = quote.approvalTarget
  if (!approval) throw new Error('Missing approval target for ERC20 swap')
  const normalizedApproval = getAddress(approval)
  if (normalizedApproval === zeroAddress) throw new Error('Missing approval target for ERC20 swap')
  if (normalizedApproval === getAddress(debtAsset)) {
    throw new Error('Approval target cannot equal input token')
  }
}

// Internal test-aware debug logger (no-ops outside test runs)
function debugMintPlan(label: string, data: Record<string, unknown>): void {
  try {
    const testMode = typeof process !== 'undefined' && !!process.env && !!process.env['TEST_MODE']
    const viteFlag =
      typeof import.meta !== 'undefined' &&
      (import.meta as unknown as { env?: Record<string, unknown> })?.env?.[
        'VITE_MINT_PLAN_DEBUG'
      ] === '1'
    const nodeFlag = typeof process !== 'undefined' && process.env?.['MINT_PLAN_DEBUG'] === '1'
    const lsFlag = (() => {
      try {
        return (
          typeof window !== 'undefined' && window?.localStorage?.getItem('mint-plan-debug') === '1'
        )
      } catch {
        return false
      }
    })()
    const shouldLog = testMode || viteFlag || nodeFlag || lsFlag
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
