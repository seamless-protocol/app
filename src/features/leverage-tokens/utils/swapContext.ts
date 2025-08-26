import type { Address, ContractFunctionArgs } from 'viem'
import { encodeAbiParameters, zeroAddress } from 'viem'
import type { leverageRouterAbi } from '@/lib/contracts/generated'

/**
 * Extract SwapContext type from wagmi-generated ABI
 * This ensures perfect type compatibility
 */
export type SwapContext = ContractFunctionArgs<typeof leverageRouterAbi, 'nonpayable', 'mint'>[4]

/**
 * Exchange enum values for ISwapAdapter.Exchange
 * These values match the V1 interface exactly
 */
export const Exchange = {
  AERODROME: 0,
  AERODROME_SLIPSTREAM: 1,
  ETHERFI: 2,
  UNISWAP_V2: 3,
  UNISWAP_V3: 4,
} as const

/**
 * Known token addresses on Base (matching V1 interface constants)
 */
export const BASE_TOKEN_ADDRESSES = {
  ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' as Address, // ETH address for encoding
  WETH: '0x4200000000000000000000000000000000000006' as Address, // Base WETH
  weETH: '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A' as Address, // EtherFi weETH on Base
} as const

/**
 * EtherFi-specific addresses on Base (matching V1 interface constants)
 */
export const ETHERFI_ADDRESSES = {
  L2_MODE_SYNC_POOL: '0xc38e046dFDAdf15f7F56853674242888301208a5' as Address, // V1's ETHERFI_L2_MODE_SYNC_POOL_ADDRESS
} as const

/**
 * DEX addresses by chain ID (matching V1 SWAP_ADAPTER_EXCHANGE_ADDRESSES)
 */
const DEX_ADDRESSES: Record<number, SwapContext['exchangeAddresses']> = {
  [8453]: {
    // Base chain ID
    aerodromeRouter: '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43' as Address, // V1's address
    aerodromePoolFactory: '0x5e7BB104d84c7CB9B682AaC2F3d509f5F406809A' as Address, // V1's address
    aerodromeSlipstreamRouter: '0xBE6D8f0d05cC4be24d5167a3eF062215bE6D18a5' as Address, // V1's address
    uniswapSwapRouter02: '0x2626664c2603336E57B271c5C0b26F421741e481' as Address, // V1's address
    uniswapV2Router02: '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24' as Address, // From V1's generated addresses
  },
} as const

/**
 * Get the primary exchange for a chain
 */
function getPrimaryExchange(chainId: number): number {
  switch (chainId) {
    case 8453: // Base
      return Exchange.AERODROME // Best liquidity on Base (updated enum value)
    default:
      throw new Error(
        `Chain ${chainId} not supported yet. Currently only Base (8453) is supported.`,
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
 * Create weETH-specific swap context matching V1 interface implementation
 * This mirrors the exact approach used in V1's useFetchPreviewMintWithSwap
 */
export function createWeETHSwapContext(): SwapContext {
  const addresses = DEX_ADDRESSES[8453] // Base chain ID
  if (!addresses) {
    throw new Error(`Base chain addresses not configured`)
  }

  // Match V1's exact swap context for weETH using EtherFi
  return {
    path: [], // V1 uses empty path for EtherFi
    encodedPath: '0x', // V1 uses empty encoded path
    fees: [], // V1 uses empty fees
    tickSpacing: [], // V1 uses empty tick spacing
    exchange: Exchange.ETHERFI,
    exchangeAddresses: addresses, // Use V1's exact DEX addresses
    additionalData: encodeAbiParameters(
      [
        { name: 'etherFiL2ModeSyncPool', type: 'address' },
        { name: 'tokenIn', type: 'address' },
        { name: 'weETH', type: 'address' },
        { name: 'referral', type: 'address' },
      ],
      [
        ETHERFI_ADDRESSES.L2_MODE_SYNC_POOL, // V1's exact address
        BASE_TOKEN_ADDRESSES.ETH, // V1's ETH_ADDRESS
        BASE_TOKEN_ADDRESSES.weETH, // V1's WEETH_ADDRESS
        zeroAddress, // No referral (V1 uses zeroAddress)
      ],
    ),
  }
}
