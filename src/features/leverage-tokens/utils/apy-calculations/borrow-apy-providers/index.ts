import type { Address } from 'viem'
import type { Config } from 'wagmi'
import { createLogger } from '@/lib/logger'
import { getLeverageTokenConfig } from '../../../leverageTokens.config'
import { MorphoBorrowApyProvider } from './morpho'
import type { BaseBorrowApyData } from './types'

const logger = createLogger('borrow-apy-provider')

/**
 * Available Borrow APR providers
 */
export enum BORROW_APR_PROVIDERS {
  MORPHO = 'morpho',
}

/**
 * Borrow APR fetcher that routes to the appropriate provider based on config
 */
export async function fetchBorrowApyForToken(
  tokenAddress: Address,
  chainId: number,
  config: Config,
): Promise<BaseBorrowApyData> {
  // Get the leverage token config to determine borrow APR provider
  const leverageTokenConfig = getLeverageTokenConfig(tokenAddress, chainId)
  const borrowAprProvider = leverageTokenConfig?.apyConfig?.borrowAprProvider

  // Route to appropriate provider based on config
  switch (borrowAprProvider?.type) {
    case BORROW_APR_PROVIDERS.MORPHO:
    default: {
      logger.info('Fetching borrow APR using Morpho', { chainId, tokenAddress })
      const morphoProvider = new MorphoBorrowApyProvider()
      return await morphoProvider.fetchBorrowApy(tokenAddress, chainId, config)
    }
  }
}
