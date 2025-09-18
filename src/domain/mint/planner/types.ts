/**
 * Domain types for mint orchestration (version-agnostic).
 */
import type { Address } from 'viem'

export type { Clients, IoOverrides } from '@/lib/web3/types'

// Mint-specific address bundle for orchestrating a mint
export type Addresses = {
  router: Address
  manager: Address
  token: Address
}

// Re-export shared quote types
export type { Quote, QuoteFn } from '../../shared/adapters/types'

export enum RouterVersion {
  V1 = 'v1',
  V2 = 'v2',
}
