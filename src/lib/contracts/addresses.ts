import type { Address } from 'viem'
import { base, mainnet } from 'wagmi/chains'

/**
 * Contract addresses for each supported chain
 * Will be populated as contracts are deployed
 */

export interface ContractAddresses {
  // Core Protocol Contracts
  leverageTokenFactory?: Address
  morphoVaultFactory?: Address
  stakingRewards?: Address
  governance?: Address

  // Token Contracts
  seamlessToken?: Address
  veSeamless?: Address

  // Helper Contracts
  multicall?: Address
  priceOracle?: Address
}

/**
 * Contract addresses by chain ID
 * Currently empty - will be populated after deployment
 */
export const contractAddresses: Record<number, ContractAddresses> = {
  // Base (mainnet)
  [base.id]: {
    // To be added after deployment
  },

  // Ethereum mainnet (future)
  [mainnet.id]: {
    // To be added after deployment
  },
}

/**
 * Get contract addresses for a specific chain
 */
export function getContractAddresses(chainId: number): ContractAddresses {
  return contractAddresses[chainId] || {}
}

/**
 * Check if a chain has deployed contracts
 */
export function hasDeployedContracts(chainId: number): boolean {
  const addresses = contractAddresses[chainId]
  return addresses ? Object.keys(addresses).length > 0 : false
}
