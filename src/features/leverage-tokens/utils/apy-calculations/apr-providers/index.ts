import { EtherFiAprProvider } from './etherfi'
import type { BaseAprData } from './types'

/**
 * APR fetcher that routes to the appropriate APR provider based on chain ID
 */
export async function fetchAprForToken(
  tokenAddress: string,
  chainId: number,
): Promise<BaseAprData> {
  if (!chainId || !tokenAddress) {
    throw new Error('Chain ID and token address are required')
  }

  const provider = new EtherFiAprProvider()
  return await provider.fetchApr()
}
