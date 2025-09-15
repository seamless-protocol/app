import type { Address } from 'viem'
import type { Config } from 'wagmi'
import { LeverageTokenKey, leverageTokenConfigs } from '../../../leverageTokens.config'
import { MorphoBorrowApyProvider } from './morpho'
import type { BaseBorrowApyData } from './types'

/**
 * Borrow APY fetcher that routes to the appropriate provider based on token address and chain ID
 */
export async function fetchBorrowApyForToken(
  tokenAddress: Address,
  chainId: number,
  config: Config,
): Promise<BaseBorrowApyData> {
  // Inline provider selection
  let provider: MorphoBorrowApyProvider
  const lowerTokenAddress = tokenAddress.toLowerCase()

  switch (chainId) {
    case 8453: // Base
      switch (lowerTokenAddress) {
        case leverageTokenConfigs[LeverageTokenKey.WEETH_WETH_17X]?.address.toLowerCase():
          provider = new MorphoBorrowApyProvider()
          console.log(`Fetching borrow APY for ${tokenAddress} on chain ${chainId} using Morpho`)
          break
        default:
          throw new Error(`Unsupported token address for borrow APY: ${tokenAddress}`)
      }
      break
    default:
      throw new Error(`Unsupported chain ID for borrow APY: ${chainId}`)
  }

  return await provider.fetchBorrowApy(tokenAddress, chainId, config)
}
