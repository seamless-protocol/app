import type { Address } from 'viem'
import { base, mainnet } from 'wagmi/chains'

/**
 * Standard sentinel address used by partner aggregators (e.g. LiFi/Uniswap)
 * to represent the native token in quote payloads.
 */
export const ETH_SENTINEL = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as Address

/**
 * Canonical WETH address on Base mainnet (chain id 8453).
 */
export const BASE_WETH = '0x4200000000000000000000000000000000000006' as Address

/**
 * Supported chain IDs for the protocol
 */
export type SupportedChainId = typeof mainnet.id | typeof base.id

/**
 * Contract addresses for each supported chain
 * Will be populated as contracts are deployed
 */

export interface ContractAddresses {
  // Core Protocol Contracts
  leverageTokenFactory?: Address
  leverageManager?: Address
  leverageRouter?: Address
  // V2 surfaces (distinct addresses when deployed)
  leverageManagerV2?: Address
  leverageRouterV2?: Address
  morphoVaultFactory?: Address
  // Tokens
  stakedSeam?: Address
  governance?: Address
  seamlessToken?: Address
  veSeamless?: Address

  // Helper Contracts
  multicall?: Address
  priceOracle?: Address

  // Governance (detailed)
  timelockShort?: Address
  governorShort?: Address
  timelockLong?: Address
  governorLong?: Address
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
    stakedSeam: '0x73f0849756f6A79C1d536b7abAB1E6955f7172A4' as Address,

    // Governance
    governance: '0x8768c789C6df8AF1a92d96dE823b4F80010Db294' as Address, // governorShort
    timelockShort: '0x639d2dD24304aC2e6A691d8c1cFf4a2665925fee' as Address,
    governorShort: '0x8768c789C6df8AF1a92d96dE823b4F80010Db294' as Address,
    timelockLong: '0xA96448469520666EDC351eff7676af2247b16718' as Address,
    governorLong: '0x04faA2826DbB38a7A4E9a5E3dB26b9E389E761B6' as Address,
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

/**
 * Convenience export for commonly used token with chain context
 * Mirrors previous CONTRACT_ADDRESSES.STAKED_SEAM shape for minimal churn
 */
export const STAKED_SEAM = {
  address: contractAddresses[base.id]?.stakedSeam as Address,
  chainId: base.id,
} as const

// Governance helpers
export interface GovernanceAddresses {
  timelockShort?: Address
  governorShort?: Address
  timelockLong?: Address
  governorLong?: Address
}

export function getGovernanceAddresses(chainId: number): GovernanceAddresses {
  const c = contractAddresses[chainId] ?? {}
  const result: GovernanceAddresses = {}

  if (c.timelockShort) result.timelockShort = c.timelockShort
  if (c.governorShort) result.governorShort = c.governorShort
  if (c.timelockLong) result.timelockLong = c.timelockLong
  if (c.governorLong) result.governorLong = c.governorLong

  return result
}

export function getRequiredGovernanceAddresses(chainId: number): Required<GovernanceAddresses> {
  const gv = getGovernanceAddresses(chainId)
  const required = ['timelockShort', 'governorShort', 'timelockLong', 'governorLong'] as const
  for (const key of required) {
    if (!gv[key]) throw new Error(`Missing governance address '${key}' for chain ${chainId}`)
  }
  return gv as Required<GovernanceAddresses>
}
