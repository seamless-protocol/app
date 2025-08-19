import type { Address } from 'viem'

/**
 * SwapContext type based on Router ABI
 * Matches ISwapAdapter.SwapContext struct
 */
export interface SwapContext {
  path: Array<Address>
  encodedPath: `0x${string}`
  fees: Array<number>
  tickSpacing: Array<number>
  exchange: number // enum ISwapAdapter.Exchange as uint8
  exchangeAddresses: {
    aerodromeRouter: Address
    aerodromePoolFactory: Address
    aerodromeSlipstreamRouter: Address
    uniswapSwapRouter02: Address
    uniswapV2Router02: Address
  }
  additionalData: `0x${string}`
}

/**
 * Exchange enum values for ISwapAdapter.Exchange
 */
export const Exchange = {
  UNISWAP_V2: 0,
  UNISWAP_V3: 1,
  AERODROME_V2: 2,
  AERODROME_SLIPSTREAM: 3,
} as const

/**
 * Base exchange addresses (to be filled with actual deployed addresses)
 */
const BASE_EXCHANGE_ADDRESSES = {
  aerodromeRouter: '0x0000000000000000000000000000000000000000' as Address,
  aerodromePoolFactory: '0x0000000000000000000000000000000000000000' as Address,
  aerodromeSlipstreamRouter: '0x0000000000000000000000000000000000000000' as Address,
  uniswapSwapRouter02: '0x0000000000000000000000000000000000000000' as Address,
  uniswapV2Router02: '0x0000000000000000000000000000000000000000' as Address,
}

/**
 * Creates a noop SwapContext for testing/simulation that should cause reverts
 * Useful for preflight testing and ensuring Router properly validates SwapContext
 */
export function makeNoopSwapContext(): SwapContext {
  return {
    path: [],
    encodedPath: '0x',
    fees: [],
    tickSpacing: [],
    exchange: Exchange.UNISWAP_V2,
    exchangeAddresses: BASE_EXCHANGE_ADDRESSES,
    additionalData: '0x',
  }
}

/**
 * Creates a single-hop V2 SwapContext for token swaps
 * TODO: Replace with actual DEX addresses and proper path encoding
 *
 * @param tokenA - Input token address
 * @param tokenB - Output token address
 * @param fee - Pool fee (for V3) or 0 for V2
 */
export function makeSingleHopV2Context(
  tokenA: Address,
  tokenB: Address,
  fee: number = 3000,
): SwapContext {
  return {
    path: [tokenA, tokenB],
    encodedPath: '0x', // TODO: Encode path for V3 if needed
    fees: [fee],
    tickSpacing: [60], // Standard tick spacing for 0.3% fee tier
    exchange: Exchange.UNISWAP_V2,
    exchangeAddresses: BASE_EXCHANGE_ADDRESSES, // TODO: Fill with real addresses
    additionalData: '0x',
  }
}

/**
 * TODO: Add proper exchange address discovery
 * For production, these should be fetched from a config or discovered dynamically
 */
export function getExchangeAddresses(): SwapContext['exchangeAddresses'] {
  // TODO: Implement proper address resolution for Base network
  return BASE_EXCHANGE_ADDRESSES
}

/**
 * TODO: Add path encoding utilities for different DEX types
 * Each exchange has different path encoding requirements
 */
export function encodeSwapPath(
  _tokens: Array<Address>,
  _fees: Array<number>,
  _exchange: number,
): `0x${string}` {
  // TODO: Implement proper path encoding based on exchange type
  return '0x'
}
