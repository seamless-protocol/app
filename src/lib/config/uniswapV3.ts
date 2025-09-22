import { type Address, getAddress } from 'viem'
import { base, mainnet } from 'viem/chains'
import { BASE_WETH } from '@/lib/contracts/addresses'

export type UniswapV3PoolKey = 'weeth-weth'

export type UniswapV3PoolConfig = {
  address: Address
  token0: Address
  token1: Address
  fee: number
  tickSpacing: number
}

export type UniswapV3ChainConfig = {
  quoter: Address
  swapRouter: Address
  pools: Record<UniswapV3PoolKey, UniswapV3PoolConfig>
}

const WEETH_BASE = getAddress('0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A')
const BASE_QUOTER = getAddress('0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a')
const BASE_SWAP_ROUTER = getAddress('0x2626664c2603336E57B271c5C0b26F421741e481')
const WEETH_WETH_POOL_BASE = {
  address: getAddress('0xB1419a7F9e8c6E434b1d05377E0dbc4154E3de78'),
  token0: WEETH_BASE,
  token1: BASE_WETH,
  fee: 100,
  tickSpacing: 1,
} satisfies UniswapV3PoolConfig

const CONFIG_BY_CHAIN: Partial<Record<number, UniswapV3ChainConfig>> = {
  [base.id]: {
    quoter: BASE_QUOTER,
    swapRouter: BASE_SWAP_ROUTER,
    pools: {
      'weeth-weth': WEETH_WETH_POOL_BASE,
    },
  },
  [mainnet.id]: {
    quoter: BASE_QUOTER,
    swapRouter: BASE_SWAP_ROUTER,
    pools: {
      'weeth-weth': WEETH_WETH_POOL_BASE,
    },
  },
}

export function getUniswapV3ChainConfig(chainId: number): UniswapV3ChainConfig | undefined {
  return CONFIG_BY_CHAIN[chainId]
}

export function getUniswapV3PoolConfig(
  chainId: number,
  key: UniswapV3PoolKey,
): UniswapV3PoolConfig | undefined {
  const config = getUniswapV3ChainConfig(chainId)
  return config?.pools[key]
}
