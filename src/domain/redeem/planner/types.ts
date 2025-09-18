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
  calls?: Array<Hex>
  // For v1: simple redemption parameters
  maxSwapCost?: bigint
}

// Re-export RouterVersion from mint since they're the same
export { RouterVersion } from '../../mint/planner/types'
// Re-export shared quote types
export type { Quote, QuoteFn } from '../../shared/adapters/types'
