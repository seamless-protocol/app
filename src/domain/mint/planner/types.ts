/**
 * Domain types for mint orchestration (version-agnostic).
 */
import type { Address, Hex } from 'viem'

export type { Clients, IoOverrides } from '@/lib/web3/types'

// Mint-specific address bundle for orchestrating a mint
export type Addresses = {
  router: Address
  manager: Address
  token: Address
}

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

export type QuoteIntent = 'exactIn' | 'exactOut'

export type QuoteRequest = {
  inToken: Address
  outToken: Address
  amountIn: bigint
  /** Optional desired output when requesting an exact-out quote. */
  amountOut?: bigint
  /** Optional intent flag to switch between exact-in and exact-out sizing. */
  intent?: QuoteIntent
}

export type QuoteFn = (args: QuoteRequest) => Promise<Quote>

export enum RouterVersion {
  V1 = 'v1',
  V2 = 'v2',
}
