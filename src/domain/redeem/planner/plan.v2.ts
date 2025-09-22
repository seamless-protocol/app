/**
 * Planner for V2 redeem operations.
 *
 * Builds the collateral->debt swap needed to repay debt during redemption, then
 * calculates the remaining collateral to return to the user with slippage protection.
 */
import type { Address } from 'viem'
import { encodeFunctionData, erc20Abi, getAddress, parseAbi } from 'viem'
import type { Config } from 'wagmi'
import { BASE_WETH, ETH_SENTINEL } from '@/lib/contracts/addresses'
import {
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2GetLeverageTokenDebtAsset,
  readLeverageManagerV2PreviewRedeem,
} from '@/lib/contracts/generated'
import { calculateMinCollateralForSender } from '../utils/slippage'
import type { QuoteFn } from './types'

// Local structural types (avoid brittle codegen coupling)
type TokenArg = Address
type SharesToRedeemArg = bigint
type RouterV2Call = { target: Address; data: `0x${string}`; value: bigint }
type V2Calls = Array<RouterV2Call>

const WETH_WITHDRAW_ABI = parseAbi(['function withdraw(uint256 wad)'])

/**
 * Structured plan for executing a single-transaction redeem via the V2 router.
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
  /** Collateral expected to be returned to user after debt repayment. */
  expectedCollateral: bigint
  /** Debt expected to be repaid during redemption. */
  expectedDebt: bigint
  /** Total collateral available before debt repayment. */
  expectedTotalCollateral: bigint
  /** Excess collateral (if more collateral is available than needed for debt repayment). */
  expectedExcessCollateral: bigint
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
}): Promise<RedeemPlanV2> {
  const { config, token, sharesToRedeem, slippageBps, quoteCollateralToDebt, managerAddress } =
    params

  const { collateralAsset, debtAsset } = await getManagerAssets({
    config,
    token,
    ...(managerAddress ? { managerAddress } : {}),
  })

  // Initial preview to understand the redemption
  const initialPreview = await readLeverageManagerV2PreviewRedeem(config, {
    ...(managerAddress ? { address: managerAddress } : {}),
    args: [token, sharesToRedeem],
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
      calls: [], // No swaps needed
    }
  }

  // Calculate how much collateral we need to swap to repay the debt
  const useNativeCollateralPath = getAddress(collateralAsset) === getAddress(BASE_WETH)
  const inTokenForQuote = useNativeCollateralPath ? ETH_SENTINEL : collateralAsset

  const collateralNeededForDebt = await calculateCollateralNeededForDebt({
    debtAsset,
    debtToRepay,
    quoteCollateralToDebt,
    maxCollateralAvailable: totalCollateralAvailable,
    inTokenForQuote,
  })

  // For underwater positions, we may not be able to fully repay the debt
  // but we should still allow the redeem to proceed with partial debt repayment
  const isUnderwater = debtToRepay > totalCollateralAvailable
  if (isUnderwater) {
    console.warn(`[REDEEM] Underwater position: debt (${debtToRepay}) > collateral (${totalCollateralAvailable}). Redeem will use all available collateral.`)
  }

  // For underwater positions, we use all available collateral and don't check if it's enough
  // For healthy positions, ensure we have enough collateral to repay the debt
  if (!isUnderwater && collateralNeededForDebt > totalCollateralAvailable) {
    throw new Error('Insufficient collateral to repay debt')
  }

  const remainingCollateral = totalCollateralAvailable - collateralNeededForDebt
  const minCollateralForSender = calculateMinCollateralForSender(remainingCollateral, slippageBps)

  // Build the collateral->debt swap calls
  const calls = await buildCollateralToDebtSwapCalls({
    collateralAsset,
    debtAsset,
    collateralAmount: collateralNeededForDebt,
    quoteCollateralToDebt,
    inTokenForQuote,
    useNativeCollateralPath,
  })

  return {
    token,
    sharesToRedeem,
    collateralAsset,
    debtAsset,
    slippageBps,
    minCollateralForSender,
    expectedCollateral: remainingCollateral,
    expectedDebt: debtToRepay,
    expectedTotalCollateral: totalCollateralAvailable,
    expectedExcessCollateral: remainingCollateral,
    calls,
  }
}

// Helper functions

async function getManagerAssets(args: {
  config: Config
  token: TokenArg
  managerAddress?: Address
}) {
  const { config, token, managerAddress } = args
  const collateralAsset = await readLeverageManagerV2GetLeverageTokenCollateralAsset(config, {
    ...(managerAddress ? { address: managerAddress } : {}),
    args: [token],
  })
  const debtAsset = await readLeverageManagerV2GetLeverageTokenDebtAsset(config, {
    ...(managerAddress ? { address: managerAddress } : {}),
    args: [token],
  })
  return { collateralAsset, debtAsset }
}

async function calculateCollateralNeededForDebt(args: {
  debtAsset: Address
  debtToRepay: bigint
  quoteCollateralToDebt: QuoteFn
  maxCollateralAvailable: bigint
  inTokenForQuote: Address
}): Promise<bigint> {
  const { debtAsset, debtToRepay, quoteCollateralToDebt, maxCollateralAvailable, inTokenForQuote } =
    args

  if (debtToRepay <= 0n) return 0n
  if (maxCollateralAvailable <= 0n) {
    throw new Error('No collateral available to repay debt')
  }

  // For underwater positions (debt > collateral), we can only use all available collateral
  if (debtToRepay > maxCollateralAvailable) {
    console.warn(`[REDEEM] Underwater position detected: debt (${debtToRepay}) > collateral (${maxCollateralAvailable}). Using all available collateral.`)
    return maxCollateralAvailable
  }

  const upperBound = maxCollateralAvailable
  let attempt = debtToRepay > upperBound ? upperBound : debtToRepay
  if (attempt <= 0n) {
    attempt = upperBound
  }

  let previous: bigint | undefined
  for (let i = 0; i < 12; i++) {
    if (attempt <= 0n) {
      attempt = 1n
    }

    const quote = await quoteCollateralToDebt({
      inToken: inTokenForQuote,
      outToken: debtAsset,
      amountIn: attempt,
    })

    console.log(`[REDEEM] Quote attempt ${i}: ${attempt.toString()} weETH -> ${quote.out.toString()} WETH (ratio: ${Number(quote.out) / Number(attempt)})`)

    if (quote.out <= 0n) {
      throw new Error('Quote returned zero output while sizing collateral swap')
    }

    // If we're using all available collateral and still can't get enough debt tokens,
    // this is an underwater position - use all available collateral
    if (quote.out < debtToRepay && attempt === upperBound) {
      console.warn(`[REDEEM] Underwater position: cannot get enough debt tokens (${debtToRepay}) with available collateral (${maxCollateralAvailable}). Using all available collateral.`)
      return maxCollateralAvailable
    }

    const required = mulDivCeil(debtToRepay, attempt, quote.out)
    if (required > upperBound) {
      console.warn(`[REDEEM] Required collateral (${required}) exceeds available (${upperBound}). Using all available collateral.`)
      return maxCollateralAvailable
    }

    if (required === attempt || (typeof previous !== 'undefined' && required === previous)) {
      return required
    }

    previous = attempt
    attempt = required
  }

  throw new Error('Collateral sizing did not converge within iteration limit')
}

async function buildCollateralToDebtSwapCalls(args: {
  collateralAsset: Address
  debtAsset: Address
  collateralAmount: bigint
  quoteCollateralToDebt: QuoteFn
  inTokenForQuote: Address
  useNativeCollateralPath: boolean
}): Promise<V2Calls> {
  const {
    collateralAsset,
    debtAsset,
    collateralAmount,
    quoteCollateralToDebt,
    inTokenForQuote,
    useNativeCollateralPath,
  } = args

  if (collateralAmount <= 0n) return []

  const quote = await quoteCollateralToDebt({
    inToken: inTokenForQuote,
    outToken: debtAsset,
    amountIn: collateralAmount,
  })

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

  return calls
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
  if (plan.slippageBps < 0 || plan.slippageBps > 10000) return false
  if (plan.minCollateralForSender > plan.expectedCollateral) return false
  return true
}
