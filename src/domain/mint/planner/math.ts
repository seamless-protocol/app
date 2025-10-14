export function mulDivFloor(a: bigint, b: bigint, d: bigint): bigint {
  return (a * b) / d
}

export function applySlippageFloor(value: bigint, slippageBps: number): bigint {
  if (slippageBps <= 0) return value
  const denom = 10_000n
  const bps = BigInt(slippageBps)
  return (value * (denom - bps)) / denom
}

export function minBigint(a: bigint, b: bigint): bigint {
  return a < b ? a : b
}

export function maxBigint(a: bigint, b: bigint): bigint {
  return a > b ? a : b
}

/**
 * Ceil division for bigints: ceil((a * b) / c).
 * Returns 0 when c == 0 to avoid throw in sizing math.
 */
export function mulDivCeil(a: bigint, b: bigint, c: bigint): bigint {
  if (c === 0n) return 0n
  return (a * b + (c - 1n)) / c
}
