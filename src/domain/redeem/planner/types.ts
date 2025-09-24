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
  // Any swap calls needed during redemption
  calls?: Array<Hex>
}

// Re-export shared quote types
export type { Quote, QuoteFn } from '../../shared/adapters/types'
