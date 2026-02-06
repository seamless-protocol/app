/**
 * Shared constants and utilities for quote adapters used by both mint and redeem operations.
 */
export const BPS_DENOMINATOR = 10000n
export const DEFAULT_SHARE_SLIPPAGE_BPS = 50 // 0.5% - Conservative default (tests set higher for specific tokens as needed)

/**
 * Convert basis points to decimal string (e.g., 50 bps -> "0.005")
 */
export function bpsToDecimalString(bps: number): string {
  return (bps / Number(BPS_DENOMINATOR)).toString()
}

export function validateSlippage(slippageBps: number) {
  if (slippageBps < 0 || slippageBps > Number(BPS_DENOMINATOR)) {
    throw new Error('Invalid slippage basis points')
  }
}

export function applySlippageFloor(amount: bigint, slippageBps: number): bigint {
  return (amount * (BPS_DENOMINATOR - BigInt(slippageBps))) / BPS_DENOMINATOR
}

export function applySlippageCeiling(amount: bigint, slippageBps: number): bigint {
  const numerator = amount * (BPS_DENOMINATOR + BigInt(slippageBps))
  return (numerator + (BPS_DENOMINATOR - 1n)) / BPS_DENOMINATOR
}
