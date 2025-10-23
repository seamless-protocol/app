import { createLogger } from '@/lib/logger'
import { getLeverageTokenConfig } from '../../../leverageTokens.config'
import { DefiLlamaAprProvider } from './defillama'
import { EtherFiAprProvider } from './etherfi'
import { LidoAprProvider } from './lido'
import type { BaseAprData } from './types'

const logger = createLogger('apr-provider')

/**
 * Available APY providers
 */
export enum APY_PROVIDERS {
  ETHERFI = 'etherfi',
  LIDO = 'lido',
  DEFI_LLAMA = 'defillama',
}

/**
 * APY fetcher that routes to the appropriate APY provider based on config
 */
export async function fetchAprForToken(
  tokenAddress: string,
  chainId: number,
): Promise<BaseAprData> {
  // Get the leverage token config to determine APY provider
  const config = getLeverageTokenConfig(tokenAddress as `0x${string}`, chainId)
  const apyProvider = config?.apyConfig?.apyProvider?.type

  // Route to appropriate provider based on config
  switch (apyProvider) {
    case APY_PROVIDERS.LIDO: {
      logger.info('Fetching APY using Lido', { chainId, tokenAddress })
      const lidoProvider = new LidoAprProvider()
      return await lidoProvider.fetchApr()
    }
    case APY_PROVIDERS.DEFI_LLAMA: {
      const id = config?.apyConfig?.apyProvider?.id
      if (!id) {
        throw new Error('DeFi Llama provider requires protocol ID')
      }
      logger.info('Fetching APY using DeFi Llama', { chainId, tokenAddress, id })
      const defillamaProvider = new DefiLlamaAprProvider(id)
      return await defillamaProvider.fetchApr()
    }
    default: {
      logger.info('Fetching APY using Ether.fi', { chainId, tokenAddress })
      const etherfiProvider = new EtherFiAprProvider()
      return await etherfiProvider.fetchApr()
    }
  }
}
