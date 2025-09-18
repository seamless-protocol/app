/**
 * Planner for V2 redeem operations.
 *
 * Builds the collateral->debt swap needed to repay debt during redemption, then
 * calculates the remaining collateral to return to the user with slippage protection.
 */
import type { Address } from 'viem'
import { getAddress } from 'viem'
import type { Config } from 'wagmi'
import { ETH_SENTINEL } from '@/lib/contracts/addresses'
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
  const collateralNeededForDebt = await calculateCollateralNeededForDebt({
    collateralAsset,
    debtAsset,
    debtToRepay,
    quoteCollateralToDebt,
  })

  // Ensure we have enough collateral to repay the debt
  if (collateralNeededForDebt > totalCollateralAvailable) {
    throw new Error('Insufficient collateral to repay debt')
  }

  const remainingCollateral = totalCollateralAvailable - collateralNeededForDebt
  const minCollateralForSender = calculateMinCollateralForSender(remainingCollateral, slippageBps)

  // Build the collateral->debt swap calls
  const calls = await buildCollateralToDebtSwapCalls({
    collateralAsset,
    debtAsset,
    collateralAmount: collateralNeededForDebt,
    debtAmount: debtToRepay,
    quoteCollateralToDebt,
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
  collateralAsset: Address
  debtAsset: Address
  debtToRepay: bigint
  quoteCollateralToDebt: QuoteFn
}): Promise<bigint> {
  const { collateralAsset, debtAsset, debtToRepay, quoteCollateralToDebt } = args

  // Start with an estimate of collateral needed (use debt amount as initial guess)
  let collateralEstimate = debtToRepay

  // Quote how much debt we get for this collateral amount
  const quote = await quoteCollateralToDebt({
    inToken: collateralAsset,
    outToken: debtAsset,
    amountIn: collateralEstimate,
  })

  // If we get exactly the debt we need, we're done
  if (quote.out === debtToRepay) {
    return collateralEstimate
  }

  // If we get more debt than needed, we can use less collateral
  if (quote.out > debtToRepay) {
    // Calculate the exact collateral amount needed using the formula:
    // collateralNeeded = ceil(debtToRepay * collateralQuoted / debtOut)
    return (debtToRepay * collateralEstimate + quote.out - 1n) / quote.out
  }

  // If we get less debt than needed, we need more collateral
  // Use the inverse relationship: collateralNeeded = debtToRepay * collateralEstimate / debtOut
  return (debtToRepay * collateralEstimate) / quote.out
}

async function buildCollateralToDebtSwapCalls(args: {
  collateralAsset: Address
  debtAsset: Address
  collateralAmount: bigint
  debtAmount: bigint
  quoteCollateralToDebt: QuoteFn
}): Promise<V2Calls> {
  const { collateralAsset, debtAsset, collateralAmount, quoteCollateralToDebt } = args

  // Get the quote for the swap
  const quote = await quoteCollateralToDebt({
    inToken: collateralAsset,
    outToken: debtAsset,
    amountIn: collateralAmount,
  })

  const calls: V2Calls = []

  // Handle native ETH path for collateral - if collateral is ETH, pass it as msg.value
  const useNativeCollateralPath = getAddress(collateralAsset) === getAddress(ETH_SENTINEL)
  calls.push({
    target: quote.approvalTarget,
    data: quote.calldata,
    value: useNativeCollateralPath ? collateralAmount : 0n,
  })

  return calls
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
