import { type Address, getAddress } from 'viem'
import { base, mainnet } from 'viem/chains'
import { BASE_WETH } from '@/lib/contracts/addresses'

export type UniswapV3PoolKey = 'weeth-weth' | 'usdc-cbbtc'

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
  pools: Partial<Record<UniswapV3PoolKey, UniswapV3PoolConfig>>
}

const WEETH_BASE = getAddress('0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A')
const WEETH_MAINNET = getAddress('0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee')
const MAINNET_WETH = getAddress('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')
const MAINNET_USDC = getAddress('0xA0b86991c6218B36C1d19D4a2e9Eb0cE3606eB48')
const MAINNET_CBBTC = getAddress('0xcBb7C0000Ab88B473B1F5AFd9ef808440EEd33BF')

const BASE_QUOTER = getAddress('0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a')
const BASE_SWAP_ROUTER = getAddress('0x2626664c2603336E57B271c5C0b26F421741e481')
const MAINNET_QUOTER = getAddress('0x61fFE014bA17989E743c5F6cB21bF9697530B21e')
const MAINNET_SWAP_ROUTER = getAddress('0xE592427A0AEce92De3Edee1F18E0157C05861564')

const WEETH_WETH_POOL_BASE = {
  address: getAddress('0xB1419a7F9e8c6E434b1d05377E0dbc4154E3de78'),
  token0: WEETH_BASE,
  token1: BASE_WETH,
  fee: 500,
  tickSpacing: 10,
} satisfies UniswapV3PoolConfig

const WEETH_WETH_POOL_MAINNET = {
  address: getAddress('0x202a6012894Ae5C288eA824cBC8A9bFB26A49b93'),
  token0: MAINNET_WETH,
  token1: WEETH_MAINNET,
  fee: 100,
  tickSpacing: 1,
} satisfies UniswapV3PoolConfig

const USDC_CBBTC_POOL_MAINNET = {
  address: getAddress('0x54e58c986818903d2D86dafe03F5F5e6C2CA6710'),
  token0: MAINNET_USDC,
  token1: MAINNET_CBBTC,
  fee: 500,
  tickSpacing: 10,
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
    quoter: MAINNET_QUOTER,
    swapRouter: MAINNET_SWAP_ROUTER,
    pools: {
      'weeth-weth': WEETH_WETH_POOL_MAINNET,
      'usdc-cbbtc': USDC_CBBTC_POOL_MAINNET,
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
