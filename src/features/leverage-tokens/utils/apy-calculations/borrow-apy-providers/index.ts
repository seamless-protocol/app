import type { Address } from 'viem'
import type { Config } from 'wagmi'
import { createLogger } from '@/lib/logger'
import { getLeverageTokenConfig } from '../../../leverageTokens.config'
import { MorphoBorrowApyProvider } from './morpho'
import type { BaseBorrowApyData } from './types'

const logger = createLogger('borrow-apy-provider')

/**
 * Available Borrow APY providers
 */
export enum BORROW_APY_PROVIDERS {
  MORPHO = 'morpho',
}

/**
 * Borrow APY fetcher that routes to the appropriate provider based on config
 */
export async function fetchBorrowApyForToken(
  tokenAddress: Address,
  chainId: number,
  config: Config,
): Promise<BaseBorrowApyData> {
  // Get the leverage token config to determine borrow APY provider
  const leverageTokenConfig = getLeverageTokenConfig(tokenAddress, chainId)
  const borrowApyProvider = leverageTokenConfig?.apyConfig?.borrowApyProvider

  // Route to appropriate provider based on config
  switch (borrowApyProvider?.type) {
    default: {
      logger.info('Fetching borrow APY using Morpho', { chainId, tokenAddress })
      const morphoProvider = new MorphoBorrowApyProvider()
      return await morphoProvider.fetchBorrowApy(tokenAddress, chainId, config)
    }
  }
}
