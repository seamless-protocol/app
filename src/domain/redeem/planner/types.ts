/**
 * Domain types for redeem orchestration (version-agnostic).
 */
import type { Address, Hex } from 'viem'

export type { Clients, IoOverrides } from '@/lib/web3/types'

// Redeem-specific address bundle for orchestrating a redeem
export type Addresses = {
  router: Address
  manager: Address
  token: Address
}

// Redeem preview result from router/manager
export type RedeemPreview = {
  collateral: bigint
  debt: bigint
  shares: bigint
}

// Redeem plan result - what the planner calculates
export type RedeemPlan = {
  sharesToRedeem: bigint
  expectedCollateral: bigint
  minCollateralForSender: bigint
  slippageBps: number
  // For v2: any swap calls needed during redemption
  calls?: Hex[]
  // For v1: simple redemption parameters
  maxSwapCost?: bigint
}

// Quote for external swaps (if needed during redemption)
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

// Re-export RouterVersion from mint since they're the same
export { RouterVersion } from '../mint/planner/types'
