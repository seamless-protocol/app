import type { Address } from 'viem'
import { base, mainnet } from 'wagmi/chains'

/**
 * Contract addresses for each supported chain
 * Will be populated as contracts are deployed
 */

export interface ContractAddresses {
  // Core Protocol Contracts
  leverageTokenFactory?: Address
  leverageManager?: Address
  leverageRouter?: Address
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
    // Core Protocol
    leverageTokenFactory: '0xE0b2e40EDeb53B96C923381509a25a615c1Abe57' as Address,
    leverageManager: '0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8' as Address,
    leverageRouter: '0xDbA92fC3dc10a17b96b6E807a908155C389A887C' as Address,

    // Tokens
    seamlessToken: '0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85' as Address,

    // Staking
    stakingRewards: '0x73f0849756f6A79C1d536b7abAB1E6955f7172A4' as Address,

    // Governance
    governance: '0x8768c789C6df8AF1a92d96dE823b4F80010Db294' as Address,
  },

  // Ethereum mainnet (future)
  [mainnet.id]: {
    // To be added when deployed on mainnet
  },
}

// Additional known contract addresses for reference
export const seamlessContracts = {
  [base.id]: {
    // Vaults
    vaults: {
      usdc: '0x616a4E1db48e22028f6bbf20444Cd3b8e3273738' as Address,
      cbbtc: '0x5a47C803488FE2BB0A0EAaf346b420e4dF22F3C7' as Address,
      weth: '0x27d8c7273fd3fcc6956a0b370ce5fd4a7fc65c18' as Address,
    },
    // Leverage
    leverageTokenImpl: '0x057A2a1CC13A9Af430976af912A27A05DE537673' as Address,
    leverageManager: '0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8' as Address,
    leverageRouter: '0xDbA92fC3dc10a17b96b6E807a908155C389A887C' as Address,
    // Governance
    escrowSeam: '0x998e44232BEF4F8B033e5A5175BDC97F2B10d5e5' as Address,
    // Rewards
    rewardsController: '0x2C6dC2CE7747E726A590082ADB3d7d08F52ADB93' as Address,
  },
  // Ethereum mainnet
  [mainnet.id]: {
    // To be added when deployed on mainnet
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

/**
 * Get leverage manager address for a specific chain
 */
export function getLeverageManagerAddress(chainId: number): Address | undefined {
  const addresses = contractAddresses[chainId]
  return addresses?.leverageManager
}
