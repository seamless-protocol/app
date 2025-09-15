// Re-export swap context helpers to provide a stable import surface
import type { Address, ContractFunctionArgs } from 'viem'
import { base } from 'viem/chains'
import type { leverageRouterAbi } from '@/lib/contracts/generated'

// Extract SwapContext type from wagmi-generated ABI to ensure compatibility
export type SwapContext = ContractFunctionArgs<typeof leverageRouterAbi, 'nonpayable', 'mint'>[4]

// Exchange enum values for ISwapAdapter.Exchange (based on V1 implementation)
export const Exchange = {
  AERODROME: 0,
  AERODROME_SLIPSTREAM: 1,
  ETHERFI: 2,
  UNISWAP_V2: 3,
  UNISWAP_V3: 4,
} as const

// DEX addresses by chain ID
const DEX_ADDRESSES: Record<number, SwapContext['exchangeAddresses']> = {
  [base.id]: {
    aerodromeRouter: '0x420DD381b31aEf6683db6B902084cB0FFECe40Da' as Address,
    aerodromePoolFactory: '0x420DD381b31aEf6683db6B902084cB0FFECe40Da' as Address,
    aerodromeSlipstreamRouter: '0x420DD381b31aEf6683db6B902084cB0FFECe40Da' as Address,
    uniswapSwapRouter02: '0x2626664c2603336E57B271c5C0b26F421741e481' as Address,
    uniswapV2Router02: '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24' as Address,
  },
} as const

function getPrimaryExchange(chainId: number): number {
  switch (chainId) {
    case base.id:
      return Exchange.AERODROME
    default:
      throw new Error(
        `Chain ${chainId} not supported yet. Currently only Base (${base.id}) is supported.`,
      )
  }
}

function getTickSpacing(fee: number): number {
  switch (fee) {
    case 500:
      return 10
    case 3000:
      return 60
    case 10000:
      return 200
    default:
      return 60
  }
}

function encodeV3Path(tokens: Array<Address>, fees: Array<number>): `0x${string}` {
  if (tokens.length !== fees.length + 1) {
    throw new Error('Invalid path: tokens length must be fees length + 1')
  }
  if (tokens.length === 2) {
    const token0 = tokens[0]?.slice(2)
    const token1 = tokens[1]?.slice(2)
    const fee = fees[0]?.toString(16).padStart(6, '0')
    return `0x${token0}${fee}${token1}` as `0x${string}`
  }
  throw new Error('Multi-hop paths not implemented yet')
}

// Create SwapContext that selects a default DEX per chain
export function createSwapContext(
  fromToken: Address,
  toToken: Address,
  chainId: number,
): SwapContext {
  const addresses = DEX_ADDRESSES[chainId]
  if (!addresses) throw new Error(`Chain ${chainId} not supported yet.`)
  const exchange = getPrimaryExchange(chainId)
  if (exchange === Exchange.UNISWAP_V3) {
    const fee = 3000
    return {
      path: [fromToken, toToken],
      encodedPath: encodeV3Path([fromToken, toToken], [fee]),
      fees: [fee],
      tickSpacing: [getTickSpacing(fee)],
      exchange,
      exchangeAddresses: addresses,
      additionalData: '0x',
    }
  }
  return {
    path: [fromToken, toToken],
    encodedPath: '0x',
    fees: [0],
    tickSpacing: [0],
    exchange,
    exchangeAddresses: addresses,
    additionalData: '0x',
  }
}

// Specialized weETH -> WETH swap context for Base via Aerodrome
export const BASE_TOKEN_ADDRESSES = {
  weETH: '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150a' as Address,
  WETH: '0x4200000000000000000000000000000000000006' as Address,
} as const

export function createWeETHSwapContext(): SwapContext {
  const addresses = DEX_ADDRESSES[base.id]
  if (!addresses) throw new Error('Base chain not supported for weETH swap context')
  return {
    path: [BASE_TOKEN_ADDRESSES.weETH, BASE_TOKEN_ADDRESSES.WETH],
    encodedPath: '0x',
    fees: [0],
    tickSpacing: [0],
    exchange: Exchange.AERODROME,
    exchangeAddresses: addresses,
    additionalData: '0x',
  }
}
