import type { Address } from 'viem'
import type { BaseRewardsAprData, RewardsAprProvider, RewardsAprProviderConfig } from './types'

/**
 * Generic function to fetch rewards APR using the appropriate provider
 */
export async function fetchGenericRewardsApr(
  config: RewardsAprProviderConfig,
): Promise<BaseRewardsAprData> {
  // Inline provider selection
  let provider: RewardsAprProvider
  switch (config.chainId) {
    case 8453: // Base
      provider = new BaseRewardsAprProvider()
      console.log('Fetching rewards APR for Base chain, token:', config.tokenAddress)
      break
    // Add more chains as needed
    // case 1: // Ethereum
    //   provider = new EthereumRewardsAprProvider()
    //   break
    default:
      throw new Error(`No rewards APR provider found for chain ID: ${config.chainId}`)
  }

  return await provider.fetchRewardsApr(config.tokenAddress)
}

/**
 * Base rewards APR provider - returns 0 for now
 */
class BaseRewardsAprProvider implements RewardsAprProvider {
  async fetchRewardsApr(_tokenAddress: Address): Promise<BaseRewardsAprData> {
    console.log('Returning 0% rewards APR (placeholder)')
    return {
      rewardsAPR: 0,
    }
  }
}

// Export types
export type { BaseRewardsAprData, RewardsAprProvider, RewardsAprProviderConfig }
