import { BaseError, ContractFunctionRevertedError, decodeErrorResult } from 'viem'

/**
 * Attempts to pretty-print a viem error by decoding revert data against
 * a list of candidate ABIs. Safe for tests — does not throw if decoding fails.
 */
export function prettyViemError(e: unknown, abis: Array<ReadonlyArray<any>>) {
  if (!(e instanceof BaseError)) return String(e)
  const reverted = e.walk((err) => err instanceof ContractFunctionRevertedError)
  // viem nests the raw data under data.data
  const data = (reverted as any)?.data?.data ?? (reverted as any)?.data
  if (!data || data === '0x') return e.shortMessage || e.message
  for (const abi of abis) {
    try {
      const decoded = decodeErrorResult({ abi, data })
      const args = Array.isArray(decoded.args) ? decoded.args.map(String).join(', ') : ''
      return `CustomError ${decoded.errorName}(${args})`
    } catch {
      // try next ABI
    }
  }
  return e.shortMessage || e.message
}
