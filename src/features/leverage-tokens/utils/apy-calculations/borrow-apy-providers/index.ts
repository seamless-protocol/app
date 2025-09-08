import type { Address } from 'viem'
import type { Config } from 'wagmi'
import { LeverageTokenKey, leverageTokenConfigs } from '../../../leverageTokens.config'
import { MorphoBorrowApyProvider } from './morpho'
import type { BaseBorrowApyData } from './types'

/**
 * Generic borrow APY fetcher that routes to the appropriate provider based on token address and chain ID
 */
export async function fetchGenericBorrowApy(
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
          break
        default:
          throw new Error(`Unsupported token address for borrow APY: ${tokenAddress}`)
      }
      break
    default:
      throw new Error(`Unsupported chain ID for borrow APY: ${chainId}`)
  }

  console.log(
    `Fetching borrow APY for ${tokenAddress} on chain ${chainId} using ${provider.protocolName}`,
  )

  return await provider.fetchBorrowApy(tokenAddress, chainId, config)
}

/**
 * Hook-friendly wrapper for the generic borrow APY fetcher
 */
export async function fetchBorrowApyForToken(
  tokenAddress: Address,
  chainId: number,
  config: Config,
): Promise<BaseBorrowApyData> {
  return fetchGenericBorrowApy(tokenAddress, chainId, config)
}
