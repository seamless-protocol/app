export function mulDivFloor(a: bigint, b: bigint, d: bigint): bigint {
  return (a * b) / d
}

export function applySlippageFloor(value: bigint, slippageBps: number): bigint {
  const denom = 10_000n
  const bps = BigInt(slippageBps)
  return (value * (denom - bps)) / denom
}
