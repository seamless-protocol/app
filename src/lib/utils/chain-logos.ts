import { BaseLogo, EthereumLogo } from '../../components/icons'

// Chain ID constants
export const CHAIN_IDS = {
  BASE: 8453,
  ETHEREUM: 1,
} as const

export type ChainId = (typeof CHAIN_IDS)[keyof typeof CHAIN_IDS]

/**
 * Get the logo component for a given chain ID
 * @param chainId - The chain ID to get the logo for
 * @returns The logo component or null if not found
 */
export function getChainLogo(chainId: ChainId) {
  switch (chainId) {
    case CHAIN_IDS.BASE:
      return BaseLogo
    case CHAIN_IDS.ETHEREUM:
      return EthereumLogo
    default:
      return null
  }
}
