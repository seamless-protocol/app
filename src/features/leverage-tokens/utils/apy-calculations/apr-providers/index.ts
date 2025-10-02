import { createLogger } from '@/lib/logger'
import { EtherFiAprProvider } from './etherfi'
import type { BaseAprData } from './types'

const logger = createLogger('apr-provider')

/**
 * APR fetcher that routes to the appropriate APR provider based on chain ID
 */
export async function fetchAprForToken(
  tokenAddress: string,
  chainId: number,
): Promise<BaseAprData> {
  logger.info('Fetching APR using Ether.fi', { chainId, tokenAddress })

  const provider = new EtherFiAprProvider()
  return await provider.fetchApr()
}
