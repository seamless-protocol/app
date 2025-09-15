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

export type QuoteFn = (args: {
  inToken: Address
  outToken: Address
  amountIn: bigint
}) => Promise<Quote>

export enum RouterVersion {
  V1 = 'v1',
  V2 = 'v2',
}

