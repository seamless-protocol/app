import type { Address } from 'viem'
import { base, mainnet } from 'viem/chains'
import type { UniswapV3PoolKey } from '../../src/lib/config/uniswapV3.js'
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

export const BASE_TENDERLY_VNET_PRIMARY_RPC =
  'https://virtual.base.us-east.rpc.tenderly.co/3433d25e-64a4-4ea1-96c1-fbc9e6022e30' as const
export const BASE_TENDERLY_VNET_ADMIN_RPC = BASE_TENDERLY_VNET_PRIMARY_RPC

export const MAINNET_TENDERLY_VNET_PRIMARY_RPC =
  'https://virtual.mainnet.us-east.rpc.tenderly.co/bdcd1ab9-21b8-4e3c-8561-4e5aa2e847c9' as const
export const MAINNET_TENDERLY_VNET_ADMIN_RPC =
  'https://virtual.mainnet.us-east.rpc.tenderly.co/46b140d1-7b0a-45b1-badc-46e337bf9c13' as const

export type LeverageTokenSource = 'tenderly' | 'prod'
export type LeverageTokenKey = 'weeth-weth-17x' | 'cbbtc-usdc-2x'

export interface LeverageTokenDefinition {
  key: LeverageTokenKey
  address: Address
  label: string
  chainId: number
  collateralSymbol: string
  debtSymbol: string
  leverageManager?: Address
  leverageRouter?: Address
  multicallExecutor?: Address
  rebalanceAdapter?: Address
  lendingAdapter?: Address
  veloraAdapter?: Address
  rpcUrl?: string
  adminRpcUrl?: string
  swap?: {
    uniswapV2Router?: Address
    useLiFi?: boolean
    uniswapV3?: {
      pool?: Address
      poolKey?: UniswapV3PoolKey
      fee?: number
      quoter?: Address
      router?: Address
    }
  }
}

export const TENDERLY_VNET_STACK = {
  leverageManager: '0x575572D9cF8692d5a8e8EE5312445D0A6856c55f' as Address,
  leverageRouter: '0x71E826cC335DaBac3dAF4703B2119983e1Bc843B' as Address,
  multicallExecutor: '0x8db50770F8346e7D98886410490E9101718869EB' as Address,
  veloraAdapter: '0x153e6be8B331f87a3DC9FE6A574CFAAcd1B0e8BB' as Address,
}

const TENDERLY_LEVERAGE_TOKENS: Record<LeverageTokenKey, LeverageTokenDefinition> = {
  'weeth-weth-17x': {
    key: 'weeth-weth-17x',
    address: '0xa1FFe279BEb08F52f4E507AABa004a512ceb6c37' as Address,
    label: 'weETH / WETH 17x Leverage Token (Tenderly)',
    chainId: mainnet.id,
    collateralSymbol: 'weETH',
    debtSymbol: 'WETH',
    leverageManager: TENDERLY_VNET_STACK.leverageManager,
    leverageRouter: TENDERLY_VNET_STACK.leverageRouter,
    multicallExecutor: TENDERLY_VNET_STACK.multicallExecutor,
    rebalanceAdapter: '0x42B2f80b25EFA106E8Ed2CE675b0CA2a3829eA16' as Address,
    lendingAdapter: '0xfC9414be7746920bc89bB979e112Ff962C013c00' as Address,
    veloraAdapter: TENDERLY_VNET_STACK.veloraAdapter,
    rpcUrl: MAINNET_TENDERLY_VNET_PRIMARY_RPC,
    adminRpcUrl: MAINNET_TENDERLY_VNET_ADMIN_RPC,
    swap: {
      uniswapV2Router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D' as Address,
      uniswapV3: {
        poolKey: 'weeth-weth',
        fee: 100,
      },
    },
  },
  'cbbtc-usdc-2x': {
    key: 'cbbtc-usdc-2x',
    address: '0x662c3f931D4101b7e2923f8493D6b35368a991aD' as Address,
    label: 'cbBTC / USDC 2x Leverage Token (Tenderly)',
    chainId: mainnet.id,
    collateralSymbol: 'cbBTC',
    debtSymbol: 'USDC',
    leverageManager: TENDERLY_VNET_STACK.leverageManager,
    leverageRouter: TENDERLY_VNET_STACK.leverageRouter,
    multicallExecutor: TENDERLY_VNET_STACK.multicallExecutor,
    rebalanceAdapter: '0x21DaC768668cAb4a33f4069B4002bB4B1DA33d32' as Address,
    lendingAdapter: '0x1B1bCfd0b1FB7559407c2b73E0d6e606B2d26b69' as Address,
    veloraAdapter: TENDERLY_VNET_STACK.veloraAdapter,
    rpcUrl: MAINNET_TENDERLY_VNET_PRIMARY_RPC,
    adminRpcUrl: MAINNET_TENDERLY_VNET_ADMIN_RPC,
    swap: {
      uniswapV2Router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D' as Address,
      uniswapV3: {
        poolKey: 'usdc-cbbtc',
        fee: 500,
      },
    },
  },
}

const PROD_LEVERAGE_TOKENS: Record<LeverageTokenKey, LeverageTokenDefinition> = {
  'weeth-weth-17x': {
    key: 'weeth-weth-17x',
    address: '0x17533ef332083aD03417DEe7BC058D10e18b22c5' as Address,
    label: 'weETH / WETH 17x Leverage Token',
    chainId: base.id,
    collateralSymbol: 'weETH',
    debtSymbol: 'WETH',
  },
  'cbbtc-usdc-2x': {
    key: 'cbbtc-usdc-2x',
    address: '0x0000000000000000000000000000000000000000' as Address,
    label: 'cbBTC / USDC 2x Leverage Token',
    chainId: base.id,
    collateralSymbol: 'cbBTC',
    debtSymbol: 'USDC',
  },
}

const LEVERAGE_TOKEN_REGISTRY: Record<
  LeverageTokenSource,
  Record<LeverageTokenKey, LeverageTokenDefinition>
> = {
  tenderly: TENDERLY_LEVERAGE_TOKENS,
  prod: PROD_LEVERAGE_TOKENS,
}

export function getLeverageTokenDefinition(
  source: LeverageTokenSource,
  key: LeverageTokenKey,
): LeverageTokenDefinition {
  const tokens = LEVERAGE_TOKEN_REGISTRY[source]
  const definition = tokens[key]
  if (!definition || definition.address === '0x0000000000000000000000000000000000000000') {
    throw new Error(`Leverage token '${key}' not configured for source '${source}'`)
  }
  return definition
}

export function listLeverageTokens(source: LeverageTokenSource): Array<LeverageTokenDefinition> {
  return Object.values(LEVERAGE_TOKEN_REGISTRY[source]).filter(
    (token) => token.address !== '0x0000000000000000000000000000000000000000',
  )
}

export const DEFAULT_TENDERLY_LEVERAGE_TOKEN_KEY: LeverageTokenKey = 'weeth-weth-17x'
export const DEFAULT_PROD_LEVERAGE_TOKEN_KEY: LeverageTokenKey = 'weeth-weth-17x'

export function getDefaultLeverageTokenDefinition(
  source: LeverageTokenSource,
): LeverageTokenDefinition {
  const key =
    source === 'tenderly' ? DEFAULT_TENDERLY_LEVERAGE_TOKEN_KEY : DEFAULT_PROD_LEVERAGE_TOKEN_KEY
  return getLeverageTokenDefinition(source, key)
}

export const WEETH_WETH_17X_TENDERLY_TOKEN_ADDRESS =
  TENDERLY_LEVERAGE_TOKENS['weeth-weth-17x'].address

export function isLeverageTokenKey(value: unknown): value is LeverageTokenKey {
  return value === 'weeth-weth-17x' || value === 'cbbtc-usdc-2x'
}

export function getLeverageTokenAddress(
  source: LeverageTokenSource,
  key?: LeverageTokenKey,
): Address {
  const definition = key
    ? getLeverageTokenDefinition(source, key)
    : getDefaultLeverageTokenDefinition(source)
  return definition.address
}

export function getLeverageTokenLabel(source: LeverageTokenSource, key?: LeverageTokenKey): string {
  const definition = key
    ? getLeverageTokenDefinition(source, key)
    : getDefaultLeverageTokenDefinition(source)
  return definition.label
}

export const TENDERLY_VNET_CONTRACT_OVERRIDES: Record<number, Partial<ContractAddresses>> = {
  [mainnet.id]: {
    leverageManager: TENDERLY_VNET_STACK.leverageManager,
    leverageManagerV2: TENDERLY_VNET_STACK.leverageManager,
    leverageRouter: TENDERLY_VNET_STACK.leverageRouter,
    leverageRouterV2: TENDERLY_VNET_STACK.leverageRouter,
    multicall: TENDERLY_VNET_STACK.multicallExecutor,
  },
}

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
