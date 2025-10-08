import type { Address, PublicClient } from 'viem'
import { base } from 'viem/chains'
import {
  createLifiQuoteAdapter,
  createUniswapV3QuoteAdapter,
  type LifiOrder,
} from '@/domain/shared/adapters'
import { createUniswapV2QuoteAdapter } from '@/domain/shared/adapters/uniswapV2'
import {
  getUniswapV3ChainConfig,
  getUniswapV3PoolConfig,
  type UniswapV3PoolKey,
} from '@/lib/config/uniswapV3'
import { BASE_WETH, getContractAddresses } from '@/lib/contracts/addresses'
import type { QuoteFn } from '../planner/types'

export type CollateralToDebtSwapConfig =
  | {
      type: 'uniswapV3'
      poolKey: UniswapV3PoolKey
    }
  | {
      type: 'uniswapV2'
      router: Address
    }
  | {
      type: 'lifi'
      allowBridges?: string
      order?: LifiOrder
    }

export interface CreateCollateralToDebtQuoteParams {
  chainId: number
  routerAddress: Address
  swap: CollateralToDebtSwapConfig
  slippageBps: number
  getPublicClient: (chainId: number) => PublicClient | undefined
}

export interface CreateCollateralToDebtQuoteResult {
  quote: QuoteFn
  adapterType: CollateralToDebtSwapConfig['type']
}

export function createCollateralToDebtQuote({
  chainId,
  routerAddress,
  swap,
  slippageBps,
  getPublicClient,
}: CreateCollateralToDebtQuoteParams): CreateCollateralToDebtQuoteResult {
  if (swap.type === 'lifi') {
    const quote = createLifiQuoteAdapter({
      chainId,
      router: routerAddress,
      slippageBps,
      ...(swap.allowBridges ? { allowBridges: swap.allowBridges } : {}),
      ...(swap.order ? { order: swap.order } : {}),
    })
    return { quote, adapterType: 'lifi' }
  }

  const publicClient = getPublicClient(chainId)
  if (!publicClient) {
    throw new Error('Public client unavailable for collateral quote')
  }

  if (swap.type === 'uniswapV2') {
    const wrappedNative = resolveWrappedNative(chainId)
    if (!wrappedNative) {
      throw new Error('Missing wrapped native token for Uniswap V2 collateral swap')
    }

    const quote = createUniswapV2QuoteAdapter({
      publicClient: publicClient as unknown as Parameters<
        typeof createUniswapV2QuoteAdapter
      >[0]['publicClient'],
      router: swap.router,
      recipient: routerAddress,
      wrappedNative,
      slippageBps,
    })

    return { quote, adapterType: 'uniswapV2' }
  }

  const chainConfig = getUniswapV3ChainConfig(chainId)
  const poolConfig = getUniswapV3PoolConfig(chainId, swap.poolKey)
  if (!chainConfig || !poolConfig) {
    throw new Error('Missing Uniswap V3 configuration for collateral swap')
  }

  const wrappedNative = resolveWrappedNative(chainId)

  const quote = createUniswapV3QuoteAdapter({
    publicClient,
    ...(chainConfig.quoter ? { quoter: chainConfig.quoter } : {}),
    router: chainConfig.swapRouter,
    fee: poolConfig.fee,
    recipient: routerAddress,
    poolAddress: poolConfig.address,
    slippageBps,
    ...(wrappedNative ? { wrappedNative } : {}),
  })

  return { quote, adapterType: 'uniswapV3' }
}

function resolveWrappedNative(chainId: number): Address | undefined {
  const contracts = getContractAddresses(chainId)
  const weth = contracts?.tokens?.weth
  if (weth) return weth

  if (chainId === base.id) return BASE_WETH

  return undefined
}
