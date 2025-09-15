import type { Address } from 'viem'
import { MerklRewardsAprProvider } from './merkl'
import type { BaseRewardsAprData, RewardsAprFetcher, RewardsAprProviderConfig } from './types'

/**
 * Generic function to fetch rewards APR using the appropriate provider
 * Returns default data (0% APR) when provider fails
 */
export async function fetchGenericRewardsApr(
  config: RewardsAprProviderConfig,
): Promise<BaseRewardsAprData> {
  // Inline provider selection
  let provider: RewardsAprFetcher

  switch (config.chainId) {
    case 8453: // Base
      provider = new MerklRewardsAprProvider()
      console.log('Fetching rewards APR for Base chain using Merkl, token:', config.tokenAddress)
      break
    default:
      throw new Error(`No rewards APR provider found for chain ID: ${config.chainId}`)
  }

  try {
    return await provider.fetchRewardsApr(config.tokenAddress, config.chainId)
  } catch (error) {
    console.error('[Rewards Provider] Provider failed, returning default data:', error)
    // Return default data when provider fails
    return {
      rewardsAPR: 0,
    }
  }
}

/**
 * Hook-friendly wrapper for the generic rewards APR fetcher
 */
export async function fetchRewardsAprForToken(
  tokenAddress: Address,
  chainId: number,
): Promise<BaseRewardsAprData> {
  return fetchGenericRewardsApr({ tokenAddress, chainId })
}

// Export types
export type { BaseRewardsAprData, RewardsAprFetcher, RewardsAprProviderConfig }
