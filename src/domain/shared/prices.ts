/**
 * USD Precision Utilities
 *
 * Provides precision-safe operations for USD values in DeFi calculations.
 *
 * **Why BigInt?**
 * JavaScript's Number type uses floating-point arithmetic which loses precision
 * with large values or many decimals. We use BigInt to avoid rounding errors.
 *
 * **Why 8 decimals?**
 * USD prices are scaled to 8 decimals (100_000_000 = $1.00), matching common
 * price feed standards. This provides sub-cent precision without excess gas costs.
 *
 * **Usage:**
 * 1. Parse prices: `parseUsdPrice(1500)` → 150_000_000_000n ($1500)
 * 2. Convert amounts: `toScaledUsd(tokenAmount, decimals, price)`
 * 3. Arithmetic: `usdAdd()`, `usdDiffFloor()`
 * 4. Display: `usdToFixedString(value, 2)` → "$1,234.56"
 */
import { formatUnits, parseUnits } from 'viem'

/**
 * Number of decimal places for USD values (100_000_000 = $1.00)
 */
export const USD_DECIMALS = 8

/**
 * Parses a USD price into scaled BigInt format.
 *
 * @param value - Price as number or string (e.g., 1500 or "1500.50")
 * @returns Scaled USD value with 8 decimals (e.g., 150_000_000_000n for $1500)
 *
 * @example
 * parseUsdPrice(2000)      // 200_000_000_000n ($2000)
 * parseUsdPrice("1.50")    // 150_000_000n ($1.50)
 * parseUsdPrice(0.01)      // 1_000_000n ($0.01)
 */
export function parseUsdPrice(value: number | string): bigint {
  return parseUnits(String(value ?? 0), USD_DECIMALS)
}

/**
 * Converts a token amount to USD value.
 *
 * @param amountBase - Token amount in base units (e.g., wei for 18-decimal tokens)
 * @param tokenDecimals - Number of decimals for the token (e.g., 18 for ETH, 6 for USDC)
 * @param priceScaledUsd - USD price scaled to 8 decimals from parseUsdPrice()
 * @returns USD value scaled to 8 decimals, or 0 if amount or price is invalid
 *
 * @example
 * // 1 ETH @ $2000
 * toScaledUsd(1_000_000_000_000_000_000n, 18, 200_000_000_000n)
 * // → 200_000_000_000n ($2000)
 *
 * // 500 USDC @ $1
 * toScaledUsd(500_000_000n, 6, 100_000_000n)
 * // → 50_000_000_000n ($500)
 */
export function toScaledUsd(
  amountBase: bigint,
  tokenDecimals: number,
  priceScaledUsd: bigint,
): bigint {
  if (amountBase <= 0n || priceScaledUsd <= 0n) return 0n
  const scale = 10n ** BigInt(tokenDecimals)
  return (amountBase * priceScaledUsd) / scale
}

/**
 * Adds two USD values.
 *
 * @param a - First USD value (scaled to 8 decimals)
 * @param b - Second USD value (scaled to 8 decimals)
 * @returns Sum of a and b
 */
export function usdAdd(a: bigint, b: bigint): bigint {
  return a + b
}

/**
 * Subtracts two USD values with floor at zero.
 *
 * @param a - First USD value (scaled to 8 decimals)
 * @param b - Second USD value (scaled to 8 decimals)
 * @returns Difference (a - b), or 0 if result would be negative
 *
 * @example
 * usdDiffFloor(200_000_000_000n, 50_000_000_000n)  // 150_000_000_000n ($1500)
 * usdDiffFloor(50_000_000_000n, 200_000_000_000n)  // 0n (floor at zero)
 */
export function usdDiffFloor(a: bigint, b: bigint): bigint {
  return a > b ? a - b : 0n
}

/**
 * Converts USD value to string with all decimals.
 *
 * @param usdScaled - USD value scaled to 8 decimals
 * @returns String representation with full precision (e.g., "1234.56789")
 *
 * @example
 * usdToString(200_000_000_000n)  // "2000"
 * usdToString(150_000_000n)      // "1.5"
 * usdToString(123_456_789n)      // "1.23456789"
 */
export function usdToString(usdScaled: bigint): string {
  return formatUnits(usdScaled, USD_DECIMALS)
}

/**
 * Converts USD value to fixed-decimal string for display.
 *
 * @param usdScaled - USD value scaled to 8 decimals
 * @param fractionDigits - Number of decimal places (default: 2)
 * @returns Formatted string with exactly fractionDigits decimals, zero-padded
 *
 * @example
 * usdToFixedString(200_000_000_000n, 2)   // "2000.00"
 * usdToFixedString(150_000_000n, 2)       // "1.50"
 * usdToFixedString(123_456_789n, 4)       // "1.2345"
 * usdToFixedString(123_456_789n, 0)       // "1"
 */
export function usdToFixedString(usdScaled: bigint, fractionDigits = 2): string {
  const raw = formatUnits(usdScaled, USD_DECIMALS)
  const [intPartRaw, fracPartRaw] = raw.split('.')
  const intPart = intPartRaw ?? '0'
  const fracPart = fracPartRaw ?? ''
  if (fractionDigits <= 0) return intPart
  const padded = `${fracPart}0000000000`.slice(0, fractionDigits)
  return `${intPart}.${padded}`
}
