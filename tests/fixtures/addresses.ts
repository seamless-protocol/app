import type { Address } from 'viem'
import { base, mainnet } from 'viem/chains'

import type { ContractAddresses } from '../../src/lib/contracts/addresses.js'
import { contractAddresses } from '../../src/lib/contracts/addresses.js'

export const BASE_CHAIN_ID = base.id
export const MAINNET_CHAIN_ID = mainnet.id

const FALLBACK_CHAIN_ID = BASE_CHAIN_ID

function requireContracts(chainId: number): ContractAddresses {
  const resolved = contractAddresses[chainId]
  if (!resolved) {
    throw new Error(`No contract addresses configured for chain ${chainId}`)
  }
  return resolved
}

const baseContractsMap: ContractAddresses = requireContracts(BASE_CHAIN_ID)
const mainnetContractsMap: ContractAddresses = contractAddresses[MAINNET_CHAIN_ID]
  ? requireContracts(MAINNET_CHAIN_ID)
  : baseContractsMap

export const TEST_CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  [BASE_CHAIN_ID]: baseContractsMap,
  [MAINNET_CHAIN_ID]: mainnetContractsMap,
}

export function getTestContractAddresses(chainId: number): ContractAddresses {
  const resolved = TEST_CONTRACT_ADDRESSES[chainId] ?? TEST_CONTRACT_ADDRESSES[FALLBACK_CHAIN_ID]
  if (!resolved) {
    throw new Error(`Missing contract addresses for chain ${chainId}`)
  }
  return resolved
}

function assertAddress(label: string, chainId: number, value?: Address): Address {
  if (!value) throw new Error(`Missing ${label} for chain ${chainId}`)
  return value
}

const baseContracts = getTestContractAddresses(BASE_CHAIN_ID)

// Tokens
export const STAKED_SEAM_ADDRESS = assertAddress(
  'stakedSeam',
  BASE_CHAIN_ID,
  baseContracts.stakedSeam,
)
export const SEAM_TOKEN_ADDRESS = assertAddress(
  'seamlessToken',
  BASE_CHAIN_ID,
  baseContracts.seamlessToken,
)

// Leverage stack (core)
export const LEVERAGE_FACTORY_ADDRESS = assertAddress(
  'leverageTokenFactory',
  BASE_CHAIN_ID,
  baseContracts.leverageTokenFactory,
)
export const LEVERAGE_MANAGER_ADDRESS = assertAddress(
  'leverageManagerV2/leverageManager',
  BASE_CHAIN_ID,
  (baseContracts.leverageManagerV2 ?? baseContracts.leverageManager) as Address | undefined,
)
export const LEVERAGE_ROUTER_ADDRESS = assertAddress(
  'leverageRouterV2/leverageRouter',
  BASE_CHAIN_ID,
  (baseContracts.leverageRouterV2 ?? baseContracts.leverageRouter) as Address | undefined,
)
export const MULTICALL_EXECUTOR_ADDRESS = assertAddress(
  'multicall',
  BASE_CHAIN_ID,
  baseContracts.multicall,
)

// Default leverage token used in integration tests (weETH/WETH 17x)
// Tenderly VNet deployment used by integration/E2E tests (distinct from Base mainnet token)
export const WEETH_WETH_17X_TOKEN_ADDRESS = '0x17533ef332083aD03417DEe7BC058D10e18b22c5' as const

// Staking/Rewards
export const REWARDS_CONTROLLER_ADDRESS = assertAddress(
  'rewardsController',
  BASE_CHAIN_ID,
  baseContracts.rewardsController,
)

// Governance
export const GOVERNOR_SHORT_ADDRESS = assertAddress(
  'governorShort',
  BASE_CHAIN_ID,
  baseContracts.governorShort,
)
export const TIMELOCK_SHORT_ADDRESS = assertAddress(
  'timelockShort',
  BASE_CHAIN_ID,
  baseContracts.timelockShort,
)
