import { BPS_DENOMINATOR } from './constants'

/**
 * Apply slippage protection to a redemption amount.
 *
 * For redemption, we calculate the minimum collateral amount the user will accept
 * based on their slippage tolerance. This protects them from receiving less than expected
 * due to market movements during transaction execution.
 *
 * @param expectedCollateral - The expected collateral amount from redemption
 * @param slippageBps - Slippage tolerance in basis points (e.g., 50 = 0.5%)
 * @returns The minimum collateral amount the user will accept
 */
export function calculateMinCollateralForSender(
  expectedCollateral: bigint,
  slippageBps: number,
): bigint {
  if (slippageBps <= 0) return expectedCollateral
  if (slippageBps >= 10000) return 0n // 100% slippage = accept anything

  const slippageBpsBigInt = BigInt(slippageBps)
  return (expectedCollateral * (BPS_DENOMINATOR - slippageBpsBigInt)) / BPS_DENOMINATOR
}

/**
 * Calculate the maximum slippage that occurred during redemption.
 *
 * @param expectedCollateral - The expected collateral amount
 * @param actualCollateral - The actual collateral received
 * @returns Slippage percentage in basis points (e.g., 25 = 0.25%)
 */
export function calculateActualSlippage(
  expectedCollateral: bigint,
  actualCollateral: bigint,
): number {
  if (expectedCollateral === 0n) return 0
  if (actualCollateral >= expectedCollateral) return 0

  const slippageAmount = expectedCollateral - actualCollateral
  return Number((slippageAmount * BPS_DENOMINATOR) / expectedCollateral)
}
