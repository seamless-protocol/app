export function ceilDiv(a: bigint, b: bigint): bigint {
  if (b === 0n) throw new RangeError('ceilDiv: division by zero')
  if (a === 0n) return 0n
  return (a + b - 1n) / b
}
