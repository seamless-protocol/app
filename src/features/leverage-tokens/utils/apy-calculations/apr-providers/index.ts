import type { Address } from 'viem'
import { LeverageTokenKey, leverageTokenConfigs } from '../../../leverageTokens.config'
import { EtherFiAprProvider } from './etherfi'
import type { BaseAprData } from './types'

/**
 * Generic APR fetcher that routes to the appropriate APR provider based on token address and chain ID
 */
export async function fetchGenericApr(tokenAddress: string, chainId: number): Promise<BaseAprData> {
  // Inline provider selection
  let provider: EtherFiAprProvider
  const lowerTokenAddress = tokenAddress.toLowerCase()

  switch (chainId) {
    case 8453: // Base
      switch (lowerTokenAddress) {
        case leverageTokenConfigs[LeverageTokenKey.WEETH_WETH_17X]?.address.toLowerCase():
          provider = new EtherFiAprProvider()
          break
        default:
          throw new Error(`Unsupported token address: ${tokenAddress}`)
      }
      break
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`)
  }

  return await provider.fetchApr()
}

/**
 * Hook-friendly wrapper for the generic APR fetcher
 */
export async function fetchAprForToken(
  tokenAddress: Address,
  chainId: number,
): Promise<BaseAprData> {
  return fetchGenericApr(tokenAddress, chainId)
}
