import { useMemo } from 'react'
import type { Address, PublicClient } from 'viem'
import { base } from 'viem/chains'
import { usePublicClient } from 'wagmi'
import {
  createLifiQuoteAdapter,
  createUniswapV3QuoteAdapter,
  type LifiOrder,
} from '@/domain/shared/adapters'
import type { QuoteFn } from '@/domain/shared/adapters/types'
import type { CollateralToDebtSwapConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { getUniswapV3ChainConfig, getUniswapV3PoolConfig } from '@/lib/config/uniswapV3'
import { BASE_WETH, getContractAddresses, type SupportedChainId } from '@/lib/contracts/addresses'

export type QuoteStatus =
  | 'not-required'
  | 'missing-config'
  | 'missing-router'
  | 'missing-client'
  | 'missing-chain-config'
  | 'ready'
  | 'error'

interface UseCollateralToDebtQuoteParams {
  chainId: SupportedChainId
  routerAddress?: Address
  swap?: CollateralToDebtSwapConfig
  slippageBps: number
  requiresQuote: boolean
}

interface CreateCollateralToDebtQuoteParams {
  chainId: number
  routerAddress: Address
  swap: CollateralToDebtSwapConfig
  slippageBps: number
  getPublicClient: (chainId: number) => PublicClient | undefined
}

interface CreateCollateralToDebtQuoteResult {
  quote: QuoteFn
  adapterType: CollateralToDebtSwapConfig['type']
}

export function useCollateralToDebtQuote({
  chainId,
  routerAddress,
  swap,
  slippageBps,
  requiresQuote,
}: UseCollateralToDebtQuoteParams): {
  quote: ReturnType<typeof createCollateralToDebtQuote>['quote'] | undefined
  status: QuoteStatus
  error: Error | undefined
} {
  const publicClient = usePublicClient({ chainId })

  return useMemo(() => {
    if (!requiresQuote) {
      return { status: 'not-required' as QuoteStatus, quote: undefined, error: undefined }
    }

    if (!swap) {
      return { status: 'missing-config' as QuoteStatus, quote: undefined, error: undefined }
    }

    if (!routerAddress) {
      return { status: 'missing-router' as QuoteStatus, quote: undefined, error: undefined }
    }

    const getPublicClient = (cid: number): PublicClient | undefined =>
      cid === chainId ? (publicClient as unknown as PublicClient | undefined) : undefined

    try {
      const { quote } = createCollateralToDebtQuote({
        chainId,
        routerAddress,
        swap,
        slippageBps,
        getPublicClient,
      })
      return { status: 'ready' as QuoteStatus, quote, error: undefined }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      const message = error.message
      if (message.includes('Public client')) {
        return { status: 'missing-client' as QuoteStatus, quote: undefined, error }
      }
      if (message.includes('Missing Uniswap V3 configuration')) {
        return { status: 'missing-chain-config' as QuoteStatus, quote: undefined, error }
      }
      return { status: 'error' as QuoteStatus, quote: undefined, error }
    }
  }, [chainId, publicClient, requiresQuote, routerAddress, slippageBps, swap])
}

function createCollateralToDebtQuote({
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
      ...(swap.order ? { order: swap.order as LifiOrder } : {}),
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
