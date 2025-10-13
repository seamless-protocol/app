import {
  type Address,
  decodeEventLog,
  getAddress,
  type TransactionReceipt,
  zeroAddress,
} from 'viem'
import { leverageTokenAbi } from '@/lib/contracts/generated'

export interface MintedSharesParseParams {
  receipt: TransactionReceipt
  leverageTokenAddress: Address
  userAddress: Address
}

// Extract the actual minted leverage token shares from a transaction receipt.
// Looks for ERC-20 Transfer events on the leverage token where from == 0x0 and to == user.
export function parseMintedSharesFromReceipt(params: MintedSharesParseParams): bigint | undefined {
  const { receipt, leverageTokenAddress, userAddress } = params

  for (const log of receipt.logs ?? []) {
    if (!log || getAddress(log.address) !== getAddress(leverageTokenAddress)) continue
    try {
      const decoded = decodeEventLog({
        abi: leverageTokenAbi,
        data: log.data,
        topics: log.topics,
      })

      if (decoded.eventName !== 'Transfer') continue
      const { from, to, value } = decoded.args

      if (getAddress(from) === zeroAddress && getAddress(to) === getAddress(userAddress)) {
        return value
      }
    } catch {
      // Non-matching log; ignore
    }
  }
  // Fallback: if no mint-from-zero event found, sum incoming transfers to user on the leverage token
  return parseErc20ReceivedFromReceipt({
    receipt,
    tokenAddress: leverageTokenAddress,
    userAddress,
  })
}

export interface Erc20ReceivedParseParams {
  receipt: TransactionReceipt
  tokenAddress: Address
  userAddress: Address
}

// Sum all ERC-20 Transfer events to the user for the given token within the receipt.
export function parseErc20ReceivedFromReceipt(
  params: Erc20ReceivedParseParams,
): bigint | undefined {
  const { receipt, tokenAddress, userAddress } = params
  const token = getAddress(tokenAddress)
  const user = getAddress(userAddress)

  let total: bigint = 0n
  let found = false
  for (const log of receipt.logs ?? []) {
    if (!log || getAddress(log.address) !== token) continue
    try {
      const decoded = decodeEventLog({ abi: leverageTokenAbi, data: log.data, topics: log.topics })
      if (decoded.eventName !== 'Transfer') continue
      const { to, value } = decoded.args
      if (getAddress(to) === user) {
        total += value
        found = true
      }
    } catch {
      // ignore
    }
  }
  return found ? total : undefined
}
