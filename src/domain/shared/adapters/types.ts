/**
 * Shared types for quote adapters used by both mint and redeem operations.
 */
import type { Address, Hex } from 'viem'

// Quote for external swaps (if needed during operations)
export type Quote = {
  // Amount the router is guaranteed to receive (minOut semantics)
  out: bigint
  // Explicit minOut field for PRD clarity (alias of out)
  minOut?: bigint
  // Optional deadline (if provided by the aggregator/DEX)
  deadline?: bigint
  // Target to approve before submitting calldata
  approvalTarget: Address
  // Calldata to execute the swap on the aggregator/DEX
  calldata: Hex
}

export type QuoteFn = (args: {
  inToken: Address
  outToken: Address
  amountIn: bigint
}) => Promise<Quote>
