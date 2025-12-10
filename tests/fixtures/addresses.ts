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

export type LeverageTokenSource = 'prod'
export type LeverageTokenKey =
  | 'weeth-weth-17x'
  | 'cbbtc-usdc-2x'
  | 'wsteth-eth-2x'
  | 'wsteth-eth-25x'
  | 'rlp-usdc-6.75x'
  | 'pt-rlp-4dec2025-usdc-2x'

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
    type?: 'lifi' | 'velora' | 'pendle' | 'uniswapV2' | 'uniswapV3' | 'balmy'
    uniswapV3?: {
      pool?: Address
      poolKey?: UniswapV3PoolKey
      fee?: number
      quoter?: Address
      router?: Address
    }
  }
}

const PROD_LEVERAGE_TOKENS: Record<LeverageTokenKey, LeverageTokenDefinition> = {
  'weeth-weth-17x': {
    key: 'weeth-weth-17x',
    address: '0xA2fceEAe99d2cAeEe978DA27bE2d95b0381dBB8c' as Address,
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
  'wsteth-eth-2x': {
    key: 'wsteth-eth-2x',
    address: '0x10041DFFBE8fB54Ca4Dfa56F2286680EC98A37c3' as Address,
    label: 'wstETH / ETH 2x Leverage Token',
    chainId: mainnet.id,
    collateralSymbol: 'wstETH',
    debtSymbol: 'WETH',
  },
  'wsteth-eth-25x': {
    key: 'wsteth-eth-25x',
    address: '0x98c4E43e3Bde7B649E5aa2F88DE1658E8d3eD1bF' as Address,
    label: 'wstETH / ETH 25x Leverage Token',
    chainId: mainnet.id,
    collateralSymbol: 'wstETH',
    debtSymbol: 'WETH',
  },
  'rlp-usdc-6.75x': {
    key: 'rlp-usdc-6.75x',
    address: '0x6426811fF283Fa7c78F0BC5D71858c2f79c0Fc3d' as Address,
    label: 'RLP / USDC 6.75x Leverage Token',
    chainId: mainnet.id,
    collateralSymbol: 'RLP',
    debtSymbol: 'USDC',
  },
  'pt-rlp-4dec2025-usdc-2x': {
    key: 'pt-rlp-4dec2025-usdc-2x',
    address: '0x0E5eB844bc0A29c9B949137bbb13327f86809779' as Address,
    label: 'PT-RLP (Dec 2025) / USDC 2x Leverage Token',
    chainId: mainnet.id,
    collateralSymbol: 'PT-RLP',
    debtSymbol: 'USDC',
  },
}

const LEVERAGE_TOKEN_REGISTRY: Record<
  LeverageTokenSource,
  Record<LeverageTokenKey, LeverageTokenDefinition>
> = {
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

export const DEFAULT_PROD_LEVERAGE_TOKEN_KEY: LeverageTokenKey = 'weeth-weth-17x'

export function getDefaultLeverageTokenDefinition(
  source: LeverageTokenSource,
): LeverageTokenDefinition {
  return getLeverageTokenDefinition(source, DEFAULT_PROD_LEVERAGE_TOKEN_KEY)
}

export function isLeverageTokenKey(value: unknown): value is LeverageTokenKey {
  return (
    value === 'weeth-weth-17x' ||
    value === 'cbbtc-usdc-2x' ||
    value === 'wsteth-eth-2x' ||
    value === 'wsteth-eth-25x' ||
    value === 'rlp-usdc-6.75x' ||
    value === 'pt-rlp-4dec2025-usdc-2x'
  )
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
