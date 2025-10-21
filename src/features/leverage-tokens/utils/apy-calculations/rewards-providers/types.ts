import type { Address } from 'viem'

/**
 * Individual reward token APR data
 */
export interface RewardTokenApr {
  /** Token address */
  tokenAddress: Address
  /** Token symbol (e.g., 'SEAM', 'MORPHO') */
  tokenSymbol: string
  /** Token decimals */
  tokenDecimals: number
  /** APR for this specific reward token (as decimal, e.g., 0.055 for 5.5%) */
  apr: number
}

/**
 * Base interface for rewards APR data
 */
export interface BaseRewardsAprData {
  /** Total rewards APR (sum of all individual rewards, as decimal, e.g., 0.055 for 5.5%) */
  rewardsAPR: number
  /** Breakdown by individual reward tokens */
  rewardTokens?: Array<RewardTokenApr>
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
