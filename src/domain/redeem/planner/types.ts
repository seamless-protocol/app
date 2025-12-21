/**
 * Domain types for redeem orchestration (version-agnostic).
 */
import type { Address } from 'viem'

export type { Clients, IoOverrides } from '@/lib/web3/types'

export type Addresses = {
  router: Address
  manager: Address
  token: Address
}

export type RedeemPreview = {
  collateral: bigint
  debt: bigint
  shares: bigint
}

export type { Quote, QuoteFn } from '../../shared/adapters/types'
