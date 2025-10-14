import type { Address } from 'viem'
import { base, mainnet } from 'viem/chains'

/**
 * Canonical Uniswap V2-compatible router addresses by chain.
 * - mainnet: Uniswap V2 Router02
 * - base: Aerodrome Router (Uniswap V2 compatible)
 */
const UNISWAP_V2_ROUTER_BY_CHAIN: Partial<Record<number, Address>> = {
  [mainnet.id]: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D' as Address,
  [base.id]: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24' as Address,
}

export function getUniswapV2Router(chainId: number): Address | undefined {
  return UNISWAP_V2_ROUTER_BY_CHAIN[chainId]
}
