import { createLogger } from '@/lib/logger'
import { getLeverageTokenConfig } from '../../../leverageTokens.config'
import { EtherFiAprProvider } from './etherfi'
import { LidoAprProvider } from './lido'
import type { BaseAprData } from './types'

const logger = createLogger('apr-provider')

/**
 * Available APR providers
 */
export enum APR_PROVIDERS {
  ETHERFI = 'etherfi',
  LIDO = 'lido',
}

/**
 * APR fetcher that routes to the appropriate APR provider based on config
 */
export async function fetchAprForToken(
  tokenAddress: string,
  chainId: number,
): Promise<BaseAprData> {
  // Get the leverage token config to determine APR provider
  const config = getLeverageTokenConfig(tokenAddress as `0x${string}`, chainId)
  const aprProvider = config?.apyConfig?.aprProvider?.type

  // Route to appropriate provider based on config
  switch (aprProvider) {
    case APR_PROVIDERS.LIDO: {
      logger.info('Fetching APR using Lido', { chainId, tokenAddress })
      const lidoProvider = new LidoAprProvider(tokenAddress, chainId)
      return await lidoProvider.fetchApr()
    }

    case APR_PROVIDERS.ETHERFI:
    default: {
      logger.info('Fetching APR using Ether.fi', { chainId, tokenAddress })
      const etherfiProvider = new EtherFiAprProvider()
      return await etherfiProvider.fetchApr()
    }
  }
}
