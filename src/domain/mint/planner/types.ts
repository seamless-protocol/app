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

// Re-export shared quote types used by mint planners
export type {
  Quote,
  QuoteFn,
  QuoteIntent,
  QuoteRequest,
} from '../../shared/adapters/types'

export enum RouterVersion {
  V1 = 'v1',
  V2 = 'v2',
}
