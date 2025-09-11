/**
 * Multiplies two bigints and integer-divides by a third (floored).
 */
export function mulDivFloor(a: bigint, b: bigint, d: bigint): bigint {
  if (d === 0n) throw new Error('division by 0')
  return (a * b) / d
}

// Applies a BPS slippage floor to a bigint value
// Example: value=100, slippageBps=50 -> 100 * (10000-50) / 10000 = 99.5 floored to 99
import { BPS_DENOMINATOR } from './constants'
export function applySlippageFloor(value: bigint, slippageBps: number): bigint {
  return (value * (BPS_DENOMINATOR - BigInt(slippageBps))) / BPS_DENOMINATOR
}
