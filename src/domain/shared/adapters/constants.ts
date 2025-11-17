/**
 * Shared constants and utilities for quote adapters used by both mint and redeem operations.
 */

export const BPS_DENOMINATOR = 10000n
export const DEFAULT_SLIPPAGE_BPS = 50 // 0.5% - Conservative default (tests set higher for specific tokens as needed)

/**
 * Convert basis points to decimal string (e.g., 50 bps -> "0.005")
 */
export function bpsToDecimalString(bps: number): string {
  return (bps / Number(BPS_DENOMINATOR)).toString()
}
