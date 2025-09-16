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
  leverageTokenImpl?: Address
  // V2 surfaces (distinct addresses when deployed)
  leverageManagerV2?: Address
  leverageRouterV2?: Address
  morphoVaultFactory?: Address
  // Tokens
  stakedSeam?: Address
  governance?: Address
  seamlessToken?: Address
  veSeamless?: Address
  tokens?: {
    usdc?: Address
    weth?: Address
    weeth?: Address
  }

  // Helper Contracts
  multicall?: Address
  priceOracle?: Address

  // Governance (detailed)
  timelockShort?: Address
  governorShort?: Address
  timelockLong?: Address
  governorLong?: Address

  // Ecosystem
  escrowSeam?: Address
  rewardsController?: Address
  vaults?: {
    usdc?: Address
    cbbtc?: Address
    weth?: Address
  }
}

/**
 * Contract addresses by chain ID
 * Currently empty - will be populated after deployment
 */
const baseContracts: ContractAddresses = {
  // Core Protocol
  leverageTokenFactory: '0xE0b2e40EDeb53B96C923381509a25a615c1Abe57' as Address,
  leverageManager: '0x38Ba21C6Bf31dF1b1798FCEd07B4e9b07C5ec3a8' as Address,
  leverageRouter: '0xDbA92fC3dc10a17b96b6E807a908155C389A887C' as Address,
  leverageTokenImpl: '0x057A2a1CC13A9Af430976af912A27A05DE537673' as Address,
  leverageManagerV2: '0x959c574EC9A40b64245A3cF89b150Dc278e9E55C' as Address,
  leverageRouterV2: '0xfd46483b299197c616671b7df295ca5186c805c2' as Address,

  // Tokens
  seamlessToken: '0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85' as Address,
  stakedSeam: '0x73f0849756f6A79C1d536b7abAB1E6955f7172A4' as Address,
  tokens: {
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
    weth: BASE_WETH,
    weeth: '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A' as Address,
  },

  // Governance
  governance: '0x8768c789C6df8AF1a92d96dE823b4F80010Db294' as Address, // governorShort
  timelockShort: '0x639d2dD24304aC2e6A691d8c1cFf4a2665925fee' as Address,
  governorShort: '0x8768c789C6df8AF1a92d96dE823b4F80010Db294' as Address,
  timelockLong: '0xA96448469520666EDC351eff7676af2247b16718' as Address,
  governorLong: '0x04faA2826DbB38a7A4E9a5E3dB26b9E389E761B6' as Address,

  // Helpers
  multicall: '0xbc097fd3c71c8ec436d8d81e13bceac207fd72cd' as Address,

  // Ecosystem
  escrowSeam: '0x998e44232BEF4F8B033e5A5175BDC97F2B10d5e5' as Address,
  rewardsController: '0x2C6dC2CE7747E726A590082ADB3d7d08F52ADB93' as Address,
  vaults: {
    usdc: '0x616a4E1db48e22028f6bbf20444Cd3b8e3273738' as Address,
    cbbtc: '0x5a47C803488FE2BB0A0EAaf346b420e4dF22F3C7' as Address,
    weth: '0x27d8c7273fd3fcc6956a0b370ce5fd4a7fc65c18' as Address,
  },
}

export const contractAddresses: Record<number, ContractAddresses> = {
  // Base (mainnet)
  [base.id]: baseContracts,

  // Ethereum mainnet (Tenderly fork alignment)
  [mainnet.id]: {
    ...baseContracts,
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
