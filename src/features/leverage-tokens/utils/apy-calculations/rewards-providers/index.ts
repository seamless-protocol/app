import type { Address } from 'viem'
import { MerklRewardsAprProvider } from './merkl'
import type { BaseRewardsAprData, RewardsAprFetcher } from './types'

/**
 * Function to fetch rewards APR using the appropriate provider
 * Returns default data (0% APR) when provider fails
 */
export async function fetchRewardsAprForToken(
  tokenAddress: Address,
  chainId: number,
): Promise<BaseRewardsAprData> {
  // Inline provider selection
  let provider: RewardsAprFetcher

  switch (chainId) {
    case 8453: // Base
      provider = new MerklRewardsAprProvider()
      console.log('Fetching rewards APR for Base chain using Merkl, token:', tokenAddress)
      break
    default:
      throw new Error(`No rewards APR provider found for chain ID: ${chainId}`)
  }

  try {
    // note: use 0x616a4E1db48e22028f6bbf20444Cd3b8e3273738 for testing
    return await provider.fetchRewardsApr(tokenAddress)
  } catch (error) {
    console.error('[Rewards Provider] Provider failed, returning default data:', error)
    // Return default data when provider fails
    return {
      rewardsAPR: 0,
    }
  }
}
