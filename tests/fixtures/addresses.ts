import type { Address } from 'viem'
import { base, mainnet } from 'viem/chains'
import type { UniswapV3PoolKey } from '../../src/lib/config/uniswapV3.js'
import type { ContractAddresses } from '../../src/lib/contracts/addresses.js'
import { BASE_WETH, contractAddresses } from '../../src/lib/contracts/addresses.js'

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

export const BASE_TENDERLY_VNET_PRIMARY_RPC =
  'https://virtual.base.us-east.rpc.tenderly.co/3433d25e-64a4-4ea1-96c1-fbc9e6022e30' as const
export const BASE_TENDERLY_VNET_ADMIN_RPC =
  'https://virtual.base.us-east.rpc.tenderly.co/a606fc5c-d9c5-4fdc-89d0-8cce505aaf81' as const

export const MAINNET_TENDERLY_VNET_PRIMARY_RPC =
  'https://virtual.mainnet.us-west.rpc.tenderly.co/60fe0601-dc59-4d58-a97c-e5618290e912' as const
export const MAINNET_TENDERLY_VNET_ADMIN_RPC =
  'https://virtual.mainnet.us-west.rpc.tenderly.co/da333276-fa7b-4f3b-a6b9-319102e4ec5d' as const

export type LeverageTokenSource = 'tenderly' | 'prod'
export type LeverageTokenKey = 'weeth-weth-17x' | 'cbbtc-usdc-2x' | 'wsteth-weth-2x'

export interface LeverageTokenDefinition {
  key: LeverageTokenKey
  address: Address
  label: string
  chainId: number
  collateralSymbol: string
  debtSymbol: string
  leverageManagerV2?: Address
  leverageRouterV2?: Address
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

const BASE_TENDERLY_VNET_STACK = {
  leverageManagerV2: '0x959c574EC9A40b64245A3cF89b150Dc278e9E55C' as Address,
  leverageRouterV2: '0xfd46483b299197c616671b7df295ca5186c805c2' as Address,
  multicallExecutor: '0xbc097fd3c71c8ec436d8d81e13bceac207fd72cd' as Address,
}

const MAINNET_TENDERLY_VNET_STACK = {
  // Keep here for reference; overrides provide canonical addresses at runtime.
  leverageManagerV2: '0x5C37EB148D4a261ACD101e2B997A0F163Fb3E351' as Address,
  leverageRouterV2: '0xb0764dE7eeF0aC69855C431334B7BC51A96E6DbA' as Address,
  multicallExecutor: '0x16D02Ebd89988cAd1Ce945807b963aB7A9Fd22E1' as Address,
  veloraAdapter: '0xc4E5812976279cBcec943A6a148C95eAAC7Db6BA' as Address,
}

const TENDERLY_LEVERAGE_TOKENS: Record<LeverageTokenKey, LeverageTokenDefinition> = {
  'weeth-weth-17x': {
    key: 'weeth-weth-17x',
    address: '0x17533ef332083aD03417DEe7BC058D10e18b22c5' as Address,
    label: 'weETH / WETH 17x Leverage Token (Tenderly)',
    chainId: base.id,
    collateralSymbol: 'weETH',
    debtSymbol: 'WETH',
    leverageManagerV2: BASE_TENDERLY_VNET_STACK.leverageManagerV2,
    leverageRouterV2: BASE_TENDERLY_VNET_STACK.leverageRouterV2,
    multicallExecutor: BASE_TENDERLY_VNET_STACK.multicallExecutor,
    rpcUrl: BASE_TENDERLY_VNET_PRIMARY_RPC,
    adminRpcUrl: BASE_TENDERLY_VNET_ADMIN_RPC,
    swap: {
      uniswapV2Router: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24' as Address,
    },
  },
  'cbbtc-usdc-2x': {
    key: 'cbbtc-usdc-2x',
    address: '0x662c3f931D4101b7e2923f8493D6b35368a991aD' as Address,
    label: 'cbBTC / USDC 2x Leverage Token (Tenderly)',
    chainId: mainnet.id,
    collateralSymbol: 'cbBTC',
    debtSymbol: 'USDC',
    leverageManagerV2: MAINNET_TENDERLY_VNET_STACK.leverageManagerV2,
    leverageRouterV2: MAINNET_TENDERLY_VNET_STACK.leverageRouterV2,
    multicallExecutor: MAINNET_TENDERLY_VNET_STACK.multicallExecutor,
    rebalanceAdapter: '0x21DaC768668cAb4a33f4069B4002bB4B1DA33d32' as Address,
    lendingAdapter: '0x1B1bCfd0b1FB7559407c2b73E0d6e606B2d26b69' as Address,
    veloraAdapter: MAINNET_TENDERLY_VNET_STACK.veloraAdapter,
    rpcUrl: MAINNET_TENDERLY_VNET_PRIMARY_RPC,
    adminRpcUrl: MAINNET_TENDERLY_VNET_ADMIN_RPC,
    swap: {
      uniswapV2Router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D' as Address,
      uniswapV3: {
        poolKey: 'usdc-cbbtc',
        fee: 500,
        // Provide pool address for determinism and to enable v3 preference in tests
        pool: '0x54e58c986818903d2D86dafe03F5F5e6C2CA6710' as Address,
        quoter: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e' as Address,
        router: '0xE592427A0AEce92De3Edee1F18E0157C05861564' as Address,
      },
    },
  },
  'wsteth-weth-2x': {
    key: 'wsteth-weth-2x',
    address: '0x10041DFFBE8fB54Ca4Dfa56F2286680EC98A37c3' as Address,
    label: 'wstETH / WETH 2x Leverage Token (Tenderly)',
    chainId: mainnet.id,
    collateralSymbol: 'wstETH',
    debtSymbol: 'WETH',
    multicallExecutor: MAINNET_TENDERLY_VNET_STACK.multicallExecutor,
    rpcUrl: MAINNET_TENDERLY_VNET_PRIMARY_RPC,
    adminRpcUrl: MAINNET_TENDERLY_VNET_ADMIN_RPC,
    swap: {
      // Prefer LiFi for production-like routing policy (bridges disabled)
      useLiFi: true,
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
  'wsteth-weth-2x': {
    key: 'wsteth-weth-2x',
    address: '0x10041DFFBE8fB54Ca4Dfa56F2286680EC98A37c3' as Address,
    label: 'wstETH / WETH 2x Leverage Token',
    chainId: mainnet.id,
    collateralSymbol: 'wstETH',
    debtSymbol: 'WETH',
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
  return value === 'weeth-weth-17x' || value === 'cbbtc-usdc-2x' || value === 'wsteth-weth-2x'
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
    leverageManagerV2: MAINNET_TENDERLY_VNET_STACK.leverageManagerV2,
    leverageRouterV2: MAINNET_TENDERLY_VNET_STACK.leverageRouterV2,
    multicallExecutor: MAINNET_TENDERLY_VNET_STACK.multicallExecutor,
  },
  [base.id]: {
    leverageTokenFactory: '0xA6737ca46336A7714E311597c6C07A18A3aFdCB8' as Address,
    leverageManagerV2: BASE_TENDERLY_VNET_STACK.leverageManagerV2,
    leverageRouterV2: BASE_TENDERLY_VNET_STACK.leverageRouterV2,
    leverageTokenImpl: '0xfFEF572c179AC02F6285B0da7CB27176A725a8A1' as Address,
    multicallExecutor: BASE_TENDERLY_VNET_STACK.multicallExecutor,
    tokens: {
      ...(baseContracts.tokens?.usdc ? { usdc: baseContracts.tokens.usdc } : {}),
      weth: BASE_WETH,
      ...(baseContracts.tokens?.weeth ? { weeth: baseContracts.tokens.weeth } : {}),
    },
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
