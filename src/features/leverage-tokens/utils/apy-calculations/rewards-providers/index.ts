import type { Address } from 'viem'
import { createLogger } from '@/lib/logger'
import { getLeverageTokenConfig } from '../../../leverageTokens.config'
import { MerklRewardsAprProvider } from './merkl'
import type { BaseRewardsAprData } from './types'

const logger = createLogger('rewards-apr-provider')

/**
 * Available Rewards providers
 */
export enum REWARDS_PROVIDERS {
  MERKL = 'merkl',
}

/**
 * Rewards APR fetcher that routes to the appropriate provider based on config
 */
export async function fetchRewardsAprForToken(
  tokenAddress: Address,
  chainId: number,
): Promise<BaseRewardsAprData> {
  // Get the leverage token config to determine rewards provider
  const leverageTokenConfig = getLeverageTokenConfig(tokenAddress, chainId)
  const rewardsProvider = leverageTokenConfig?.apyConfig?.rewardsProvider

  // Route to appropriate provider based on config
  switch (rewardsProvider?.type) {
    case REWARDS_PROVIDERS.MERKL:
    default:
      logger.info('Fetching rewards APR using Merkl', { chainId, tokenAddress })
      const merklProvider = new MerklRewardsAprProvider()
      return await merklProvider.fetchRewardsApr(tokenAddress)
  }
}
