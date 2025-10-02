import type { Address } from 'viem'
import { createLogger } from '@/lib/logger'
import { MerklRewardsAprProvider } from './merkl'
import type { BaseRewardsAprData } from './types'

const logger = createLogger('rewards-apr-provider')

/**
 * Function to fetch rewards APR using the appropriate provider
 * Returns default data (0% APR) when provider fails
 */
export async function fetchRewardsAprForToken(
  tokenAddress: Address,
  chainId: number,
): Promise<BaseRewardsAprData> {
  logger.info('Fetching rewards APR using Merkl', { tokenAddress, chainId })

  const provider = new MerklRewardsAprProvider()

  try {
    // note: use 0x616a4E1db48e22028f6bbf20444Cd3b8e3273738 for testing
    return await provider.fetchRewardsApr(tokenAddress)
  } catch (error) {
    logger.error('Provider failed, returning default data', { error, tokenAddress, chainId })
    // Return default data when provider fails
    return {
      rewardsAPR: 0,
    }
  }
}
