/**
 * Multiplies two bigints and integer-divides by a third (floored).
 */
export function mulDivFloor(a: bigint, b: bigint, d: bigint): bigint {
  if (d === 0n) throw new Error('division by 0')
  return (a * b) / d
}
