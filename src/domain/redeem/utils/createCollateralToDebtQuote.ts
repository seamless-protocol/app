import type { Address, PublicClient } from 'viem'
import { base } from 'viem/chains'
import {
  createLifiQuoteAdapter,
  createUniswapV3QuoteAdapter,
  type LifiOrder,
} from '@/domain/shared/adapters'
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
