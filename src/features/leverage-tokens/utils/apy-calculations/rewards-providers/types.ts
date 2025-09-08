import type { Address } from 'viem'

/**
 * Base interface for rewards APR data
 */
export interface BaseRewardsAprData {
  rewardsAPR: number
}

/**
 * Interface for rewards APR providers
 */
export interface RewardsAprProvider {
  /**
   * Fetch rewards APR for a given token address
   */
  fetchRewardsApr(tokenAddress: Address): Promise<BaseRewardsAprData>
}

/**
 * Configuration for rewards APR providers
 */
export interface RewardsAprProviderConfig {
  chainId: number
  tokenAddress: Address
}
