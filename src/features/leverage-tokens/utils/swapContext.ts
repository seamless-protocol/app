import type { Address, ContractFunctionArgs } from 'viem'
import { base } from 'viem/chains'
import type { leverageRouterAbi } from '@/lib/contracts/generated'

/**
 * Extract SwapContext type from wagmi-generated ABI
 * This ensures perfect type compatibility
 */
export type SwapContext = ContractFunctionArgs<typeof leverageRouterAbi, 'nonpayable', 'mint'>[4]

/**
 * Exchange enum values for ISwapAdapter.Exchange
 * Based on V1 implementation
 */
export const Exchange = {
  AERODROME: 0,
  AERODROME_SLIPSTREAM: 1,
  ETHERFI: 2,
  UNISWAP_V2: 3,
  UNISWAP_V3: 4,
} as const

/**
 * DEX addresses by chain ID
 */
const DEX_ADDRESSES: Record<number, SwapContext['exchangeAddresses']> = {
  [base.id]: {
    aerodromeRouter: '0x420DD381b31aEf6683db6B902084cB0FFECe40Da' as Address,
    aerodromePoolFactory: '0x420DD381b31aEf6683db6B902084cB0FFECe40Da' as Address,
    aerodromeSlipstreamRouter: '0x420DD381b31aEf6683db6B902084cB0FFECe40Da' as Address,
    uniswapSwapRouter02: '0x2626664c2603336E57B271c5C0b26F421741e481' as Address,
    uniswapV2Router02: '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24' as Address,
  },
} as const

/**
 * Get the primary exchange for a chain
 */
function getPrimaryExchange(chainId: number): number {
  switch (chainId) {
    case base.id: // Base
      return Exchange.AERODROME_V2 // Best liquidity on Base
    default:
      throw new Error(
        `Chain ${chainId} not supported yet. Currently only Base (${base.id}) is supported.`,
      )
  }
}

/**
 * Get tick spacing for Uniswap V3 fee tiers
 */
function getTickSpacing(fee: number): number {
  switch (fee) {
    case 500:
      return 10 // 0.05%
    case 3000:
      return 60 // 0.3%
    case 10000:
      return 200 // 1%
    default:
      return 60 // Default to 0.3%
  }
}

/**
 * Encode Uniswap V3 path for single-hop swaps
 */
function encodeV3Path(tokens: Array<Address>, fees: Array<number>): `0x${string}` {
  if (tokens.length !== fees.length + 1) {
    throw new Error('Invalid path: tokens length must be fees length + 1')
  }

  // For single hop, concatenate token0 + fee + token1
  if (tokens.length === 2) {
    const token0 = tokens[0]?.slice(2) // Remove 0x
    const token1 = tokens[1]?.slice(2) // Remove 0x
    const fee = fees[0]?.toString(16).padStart(6, '0') // 3 bytes for fee
    return `0x${token0}${fee}${token1}` as `0x${string}`
  }

  // Multi-hop encoding would go here if needed
  throw new Error('Multi-hop paths not implemented yet')
}

/**
 * Create SwapContext for token swaps
 * Automatically selects the best DEX for each supported chain
 * Handles V2 vs V3 differences (path encoding, fees, tick spacing)
 */
export function createSwapContext(
  fromToken: Address,
  toToken: Address,
  chainId: number,
): SwapContext {
  const addresses = DEX_ADDRESSES[chainId]
  if (!addresses) {
    throw new Error(`Chain ${chainId} not supported yet.`)
  }

  const exchange = getPrimaryExchange(chainId)

  // Branch based on exchange type (V2 vs V3)
  if (exchange === Exchange.UNISWAP_V3) {
    // V3-style context with path encoding and fee tiers
    const fee = 3000 // 0.3% fee tier (most common)
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
  // V2-style context (Aerodrome V2, Uniswap V2)
  return {
    path: [fromToken, toToken],
    encodedPath: '0x', // V2 doesn't need encoded paths
    fees: [0], // V2 doesn't use fees in the same way
    tickSpacing: [0], // V2 doesn't use tick spacing
    exchange,
    exchangeAddresses: addresses,
    additionalData: '0x',
  }
}

/**
 * Create EtherFi swap context for weETH → WETH
 * This is a specialized swap context that uses EtherFi's native weETH liquidity
 * Based on V1 implementation that was hardcoded for this specific pair
 */
export function createEtherFiSwapContext(): SwapContext {
  // Zero addresses since EtherFi doesn't use traditional AMM routers
  const zeroExchangeAddresses = {
    aerodromeRouter: '0x0000000000000000000000000000000000000000' as Address,
    aerodromePoolFactory: '0x0000000000000000000000000000000000000000' as Address,
    aerodromeSlipstreamRouter: '0x0000000000000000000000000000000000000000' as Address,
    uniswapSwapRouter02: '0x0000000000000000000000000000000000000000' as Address,
    uniswapV2Router02: '0x0000000000000000000000000000000000000000' as Address,
  }

  return {
    path: [],
    encodedPath: '0x',
    fees: [],
    tickSpacing: [],
    exchange: Exchange.ETHERFI,
    exchangeAddresses: zeroExchangeAddresses,
    // Empty additional data for now - would need EtherFi L2ModeSyncPool params in production
    additionalData: '0x',
  }
}

/**
 * Base token addresses for common operations
 */
export const BASE_TOKEN_ADDRESSES = {
  weETH: '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150a' as Address,
  WETH: '0x4200000000000000000000000000000000000006' as Address,
} as const

/**
 * Create special weETH swap context optimized for EtherFi on Base
 * This follows the V1 pattern for weETH -> WETH swaps using Aerodrome
 */
export function createWeETHSwapContext(): SwapContext {
  const addresses = DEX_ADDRESSES[base.id]
  if (!addresses) {
    throw new Error(`Base chain not supported for weETH swap context`)
  }

  return {
    path: [BASE_TOKEN_ADDRESSES.weETH, BASE_TOKEN_ADDRESSES.WETH],
    encodedPath: '0x', // V2 doesn't need encoded paths
    fees: [0], // V2 doesn't use fees in the same way
    tickSpacing: [0], // V2 doesn't use tick spacing
    exchange: Exchange.AERODROME_V2, // Aerodrome has the best weETH liquidity on Base
    exchangeAddresses: addresses,
    additionalData: '0x',
  }
}
