import type { Address } from 'viem'
import type { Config } from 'wagmi'
import { createLogger } from '@/lib/logger'
import { MorphoBorrowApyProvider } from './morpho'
import type { BaseBorrowApyData } from './types'

const logger = createLogger('borrow-apy-provider')

/**
 * Borrow APY fetcher that routes to the appropriate provider based on chain ID
 */
export async function fetchBorrowApyForToken(
  tokenAddress: Address,
  chainId: number,
  config: Config,
): Promise<BaseBorrowApyData> {
  logger.info('Fetching borrow APY using Morpho', { tokenAddress, chainId })

  const provider = new MorphoBorrowApyProvider()
  return await provider.fetchBorrowApy(tokenAddress, chainId, config)
}
