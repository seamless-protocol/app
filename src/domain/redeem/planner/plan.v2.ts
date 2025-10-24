/**
 * Planner for V2 redeem operations.
 *
 * Builds the collateral->debt swap needed to repay debt during redemption, then
 * calculates the remaining collateral to return to the user with slippage protection.
 */
import type { Address } from 'viem'
import { encodeFunctionData, erc20Abi, getAddress, parseAbi } from 'viem'
import type { Config } from 'wagmi'
import { BASE_WETH, ETH_SENTINEL, type SupportedChainId } from '@/lib/contracts/addresses'
import {
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
  readLeverageManagerV2PreviewRedeem,
} from '@/lib/contracts/generated'
import { calculateMinCollateralForSender } from '../utils/slippage'
import type { Quote, QuoteFn } from './types'

// Local structural types (avoid brittle codegen coupling)
type TokenArg = Address
type SharesToRedeemArg = bigint
type RouterV2Call = { target: Address; data: `0x${string}`; value: bigint }
type V2Calls = Array<RouterV2Call>

const WETH_WITHDRAW_ABI = parseAbi(['function withdraw(uint256 wad)'])

/**
 * Structured plan for executing a single-transaction redeem.
 *
 * Fields prefixed with "expected" are derived from LeverageManager.previewRedeem and
 * are used to size swaps and to provide UI expectations. "minCollateralForSender" is a
 * slippage-adjusted floor used for the on-chain redeem call.
 */
export type RedeemPlanV2 = {
  /** Leverage token being redeemed. */
  token: Address
  /** Number of leverage token shares to redeem. */
  sharesToRedeem: SharesToRedeemArg
  /** Token's collateral asset as reported by the manager. */
  collateralAsset: Address
  /** Token's debt asset as reported by the manager. */
  debtAsset: Address
  /** Slippage tolerance in basis points used for this plan. */
  slippageBps: number
  /** Minimum acceptable collateral after applying `slippageBps` against expected collateral. */
  minCollateralForSender: bigint
  /** Collateral expected to be returned to user after debt repayment (before optional conversions). */
  expectedCollateral: bigint
  /** Debt expected to be repaid during redemption. */
  expectedDebt: bigint
  /** Total collateral available before debt repayment. */
  expectedTotalCollateral: bigint
  /** Excess collateral (if more collateral is available than needed for debt repayment). */
  expectedExcessCollateral: bigint
  /**
   * Excess debt returned to user when the collateral→debt swap produces more
   * debt than needed to repay the position. Can occur in both exact-in and
   * exact-out quote paths due to padding, buffers, and market price movements.
   *
   * NOTE: Does not currently support outputAsset = debtAsset (converting remaining
   * collateral to debt). That path exists in code but needs fixes in a separate PR.
   */
  expectedDebtPayout: bigint
  /** Asset address the user will receive after all swaps (collateral or alternate). */
  payoutAsset: Address
  /** Final expected amount of `payoutAsset` returned to the user. */
  payoutAmount: bigint
  /**
   * Encoded router calls (approve + swap) to be submitted to V2 `redeem`.
   * The sequence includes the collateral->debt swap needed for debt repayment.
   */
  calls: V2Calls
}

export async function planRedeemV2(params: {
  config: Config
  token: TokenArg
  sharesToRedeem: SharesToRedeemArg
  slippageBps: number
  quoteCollateralToDebt: QuoteFn
  /** Optional explicit LeverageManagerV2 address (for VNet/custom) */
  managerAddress?: Address
  /** Optional explicit output asset for user payout (defaults to collateral). */
  outputAsset?: Address
  /** Chain ID to execute the transaction on */
  chainId: number
}): Promise<RedeemPlanV2> {
  const {
    config,
    token,
    sharesToRedeem,
    slippageBps,
    quoteCollateralToDebt,
    managerAddress,
    chainId,
  } = params

  const { collateralAsset, debtAsset } = await getManagerAssets({
    config,
    token,
    chainId,
    ...(managerAddress ? { managerAddress } : {}),
  })

  // Amount of collateral the sender would receive if there is 0 slippage
  const initialPreview = await readLeverageManagerV2PreviewRedeem(config, {
    args: [token, sharesToRedeem],
    chainId: chainId as SupportedChainId,
  })

  const totalCollateralAvailable = initialPreview.collateral
  const debtToRepay = initialPreview.debt

  // If no debt to repay, return all collateral directly
  if (debtToRepay <= 0n) {
    const minCollateralForSender = calculateMinCollateralForSender(
      totalCollateralAvailable,
      slippageBps,
    )
    return {
      token,
      sharesToRedeem,
      collateralAsset,
      debtAsset,
      slippageBps,
      minCollateralForSender,
      expectedCollateral: totalCollateralAvailable,
      expectedDebt: 0n,
      expectedTotalCollateral: totalCollateralAvailable,
      expectedExcessCollateral: totalCollateralAvailable,
      expectedDebtPayout: 0n,
      payoutAsset: collateralAsset,
      payoutAmount: totalCollateralAvailable,
      calls: [], // No swaps needed
    }
  }

  // Calculate how much collateral we need to swap to repay the debt
  const useNativeCollateralPath = getAddress(collateralAsset) === getAddress(BASE_WETH)
  const inTokenForQuote = useNativeCollateralPath ? ETH_SENTINEL : collateralAsset

  const sizing = await calculateCollateralNeededForDebt({
    debtAsset,
    debtToRepay,
    quoteCollateralToDebt,
    maxCollateralAvailable: totalCollateralAvailable,
    inTokenForQuote,
  })

  const requiredForDebt = sizing.required
  if (requiredForDebt > totalCollateralAvailable) {
    throw new Error('Required for debt is greater than total collateral available')
  }

  const padding = sizing.exactOut
    ? 0n
    : requiredForDebt > 0n && totalCollateralAvailable > requiredForDebt
      ? 1n
      : 0n
  const paddedCollateralForDebt = requiredForDebt + padding
  const remainingCollateral = totalCollateralAvailable - paddedCollateralForDebt

  // Minimum amount of collateral the sender expects to receive
  const minCollateralForSender = calculateMinCollateralForSender(remainingCollateral, slippageBps)

  const { calls: swapCalls, expectedDebtOut } = await buildCollateralToDebtSwapCalls({
    collateralAsset,
    debtAsset,
    collateralAmount: paddedCollateralForDebt,
    quoteCollateralToDebt,
    inTokenForQuote,
    useNativeCollateralPath,
    ...(sizing.preQuote ? { preQuote: sizing.preQuote } : {}),
  })

  // Calculate excess debt from actual swap output (works for both exact-in and exact-out)
  const excessDebt = expectedDebtOut > debtToRepay ? expectedDebtOut - debtToRepay : 0n

  const collateralAddr = getAddress(collateralAsset)
  const debtAddr = getAddress(debtAsset)
  const payoutOverride = params.outputAsset ? getAddress(params.outputAsset) : undefined
  const wantsDebtOutput = payoutOverride ? payoutOverride === debtAddr : false

  const planDraft = {
    minCollateralForSender,
    expectedCollateral: remainingCollateral,
    expectedDebtPayout: 0n,
    payoutAsset: wantsDebtOutput ? debtAddr : collateralAddr,
    payoutAmount: remainingCollateral,
    calls: [...swapCalls] as V2Calls,
  }

  if (wantsDebtOutput) {
    planDraft.minCollateralForSender = 0n
    planDraft.expectedCollateral = 0n

    if (remainingCollateral > 0n) {
      const { calls: payoutCalls, expectedDebtOut } = await buildCollateralToDebtSwapCalls({
        collateralAsset,
        debtAsset,
        collateralAmount: remainingCollateral,
        quoteCollateralToDebt,
        inTokenForQuote,
        useNativeCollateralPath,
      })
      planDraft.calls.push(...payoutCalls)
      planDraft.expectedDebtPayout = expectedDebtOut
      planDraft.payoutAmount = expectedDebtOut
    } else {
      planDraft.payoutAmount = 0n
    }
  }

  return {
    token,
    sharesToRedeem,
    collateralAsset,
    debtAsset,
    slippageBps,
    minCollateralForSender: planDraft.minCollateralForSender,
    expectedCollateral: planDraft.expectedCollateral,
    expectedDebt: debtToRepay,
    expectedTotalCollateral: totalCollateralAvailable,
    expectedExcessCollateral: remainingCollateral,
    expectedDebtPayout: excessDebt,
    payoutAsset: planDraft.payoutAsset,
    payoutAmount: planDraft.payoutAmount,
    calls: planDraft.calls,
  }
}

// Helper functions

async function getManagerAssets(args: {
  config: Config
  token: TokenArg
  managerAddress?: Address
  chainId: number
}) {
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

async function calculateCollateralNeededForDebt(args: {
  debtAsset: Address
  debtToRepay: bigint
  quoteCollateralToDebt: QuoteFn
  maxCollateralAvailable: bigint
  inTokenForQuote: Address
}): Promise<{ required: bigint; preQuote?: Quote; exactOut?: boolean }> {
  const { debtAsset, debtToRepay, quoteCollateralToDebt, maxCollateralAvailable, inTokenForQuote } =
    args

  if (debtToRepay <= 0n) return { required: 0n }
  if (maxCollateralAvailable <= 0n) {
    throw new Error('No collateral available to repay debt')
  }

  // Try a single exact-out quote first; fall back to iterative exact-in sizing if unavailable.
  try {
    const qo = await quoteCollateralToDebt({
      inToken: inTokenForQuote,
      outToken: debtAsset,
      amountIn: 0n,
      amountOut: debtToRepay,
      intent: 'exactOut',
    })
    if (typeof qo.maxIn === 'bigint' && qo.maxIn > 0n) {
      // Only take the exact-out path when the quoted max input fits within
      // available collateral. Otherwise, fall back to iterative exact-in sizing.
      if (qo.maxIn <= maxCollateralAvailable) {
        return { required: qo.maxIn, preQuote: qo, exactOut: true }
      }
      // If exact-out would require more than available collateral, continue to
      // iterative sizing so we can either size an exact-in swap or throw with a
      // clear error if even the upper bound can't cover the debt under slippage.
    }
  } catch {
    // ignore and fallback to iterative sizing below
  }

  const upperBound = maxCollateralAvailable
  let attempt = debtToRepay > upperBound ? upperBound : debtToRepay
  if (attempt <= 0n) {
    attempt = upperBound
  }

  let previous: bigint | undefined
  let lastRequired: bigint | undefined
  // Reduce iteration cap and tolerate tiny oscillations to speed up sizing.
  const MAX_ITERATIONS = 4
  const CONVERGENCE_BPS = 1n // stop when change <= 1 bp
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    if (attempt <= 0n) {
      attempt = 1n
    }

    const quote = await quoteCollateralToDebt({
      inToken: inTokenForQuote,
      outToken: debtAsset,
      amountIn: attempt,
    })

    if (quote.out <= 0n) {
      throw new Error('Quote returned zero output while sizing collateral swap')
    }

    if (quote.out < debtToRepay && attempt === upperBound) {
      throw new Error('Collateral swap output is less than debt to repay; increase slippage')
    }

    const required = mulDivCeil(debtToRepay, attempt, quote.out)
    lastRequired = required
    if (required > upperBound) {
      throw new Error(
        'Required collateral is greater than max collateral available; increase slippage',
      )
    }

    // Stop if converged or oscillating between two adjacent values,
    // or if relative delta is within 1 bp (buffer applied below).
    const converged = required === attempt
    const oscillating = typeof previous !== 'undefined' && required === previous
    const relDeltaBps =
      required === 0n
        ? 0n
        : ((required > attempt ? required - attempt : attempt - required) * 10_000n) / required
    if (converged || oscillating || relDeltaBps <= CONVERGENCE_BPS) {
      return { required: applyRequiredBuffer({ required, maxCollateralAvailable: upperBound }) }
    }

    previous = attempt
    attempt = required
  }

  if (typeof lastRequired === 'bigint') {
    return {
      required: applyRequiredBuffer({ required: lastRequired, maxCollateralAvailable: upperBound }),
    }
  }
  throw new Error('Collateral sizing did not converge within iteration limit')
}

const BPS_DENOMINATOR_BIGINT = 10_000n
const REPAY_BUFFER_BPS = 1n
const MIN_BUFFER_WEI = 1n

function applyRequiredBuffer(args: { required: bigint; maxCollateralAvailable: bigint }): bigint {
  const { required, maxCollateralAvailable } = args
  if (required >= maxCollateralAvailable) return required

  const proportionalComponent =
    required === 0n
      ? 0n
      : (required * REPAY_BUFFER_BPS + (BPS_DENOMINATOR_BIGINT - 1n)) / BPS_DENOMINATOR_BIGINT
  const buffer = proportionalComponent > MIN_BUFFER_WEI ? proportionalComponent : MIN_BUFFER_WEI
  const buffered = required + buffer

  return buffered > maxCollateralAvailable ? maxCollateralAvailable : buffered
}

async function buildCollateralToDebtSwapCalls(args: {
  collateralAsset: Address
  debtAsset: Address
  collateralAmount: bigint
  quoteCollateralToDebt: QuoteFn
  inTokenForQuote: Address
  useNativeCollateralPath: boolean
  preQuote?: Quote
}): Promise<{ calls: V2Calls; expectedDebtOut: bigint }> {
  const {
    collateralAsset,
    debtAsset,
    collateralAmount,
    quoteCollateralToDebt,
    inTokenForQuote,
    useNativeCollateralPath,
  } = args

  // Exact-out: reuse validated preQuote. Exact-in: quote final padded amount.
  const quote =
    args.preQuote ??
    (await quoteCollateralToDebt({
      inToken: inTokenForQuote,
      outToken: debtAsset,
      amountIn: collateralAmount,
    }))

  const calls: V2Calls = []

  if (useNativeCollateralPath) {
    calls.push({
      target: getAddress(collateralAsset),
      data: encodeFunctionData({
        abi: WETH_WITHDRAW_ABI,
        functionName: 'withdraw',
        args: [collateralAmount],
      }),
      value: 0n,
    })
  } else {
    calls.push({
      target: getAddress(collateralAsset),
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [getAddress(quote.approvalTarget), collateralAmount],
      }),
      value: 0n,
    })
  }

  calls.push({
    target: getAddress(quote.approvalTarget),
    data: quote.calldata,
    value: useNativeCollateralPath ? collateralAmount : 0n,
  })

  return { calls, expectedDebtOut: quote.out }
}

function mulDivCeil(a: bigint, b: bigint, d: bigint): bigint {
  if (d === 0n) throw new Error('Division by zero in mulDivCeil')
  const numerator = a * b
  return numerator === 0n ? 0n : (numerator + (d - 1n)) / d
}

/**
 * Validate a redeem plan to ensure it's safe to execute.
 */
export function validateRedeemPlan(plan: RedeemPlanV2): boolean {
  if (plan.sharesToRedeem <= 0n) return false
  if (plan.expectedCollateral < 0n) return false
  if (plan.minCollateralForSender < 0n) return false
  if (plan.expectedDebtPayout < 0n) return false
  if (plan.payoutAmount < 0n) return false
  if (plan.slippageBps < 0 || plan.slippageBps > 10000) return false
  if (plan.minCollateralForSender > plan.expectedCollateral) return false
  return true
}
