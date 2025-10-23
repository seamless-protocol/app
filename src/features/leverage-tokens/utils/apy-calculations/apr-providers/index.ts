import { createLogger } from '@/lib/logger'
import { getLeverageTokenConfig } from '../../../leverageTokens.config'
import { DefiLlamaAprProvider } from './defillama'
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
  DEFI_LLAMA = 'defillama',
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
      const lidoProvider = new LidoAprProvider()
      return await lidoProvider.fetchApr()
    }
    case APR_PROVIDERS.DEFI_LLAMA: {
      const id = config?.apyConfig?.aprProvider?.id
      if (!id) {
        throw new Error('DeFi Llama provider requires protocol ID')
      }
      logger.info('Fetching APR using DeFi Llama', { chainId, tokenAddress, id })
      const defillamaProvider = new DefiLlamaAprProvider(id)
      return await defillamaProvider.fetchApr()
    }
    default: {
      logger.info('Fetching APR using Ether.fi', { chainId, tokenAddress })
      const etherfiProvider = new EtherFiAprProvider()
      return await etherfiProvider.fetchApr()
    }
  }
}
