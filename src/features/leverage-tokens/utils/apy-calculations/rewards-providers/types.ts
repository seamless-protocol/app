import type { Address } from 'viem'

/**
 * Base interface for rewards APR data
 */
export interface BaseRewardsAprData {
  rewardsAPR: number
}

/**
 * Protocol-specific rewards APR fetcher interface
 */
export interface RewardsAprFetcher {
  /** Unique identifier for this protocol */
  protocolId: string
  /** Human-readable name */
  protocolName: string
  /** Fetch rewards APR data for this protocol */
  fetchRewardsApr(tokenAddress: Address, chainId?: number): Promise<BaseRewardsAprData>
}

/**
 * Configuration for rewards APR providers
 */
export interface RewardsAprProviderConfig {
  chainId: number
  tokenAddress: Address
}
