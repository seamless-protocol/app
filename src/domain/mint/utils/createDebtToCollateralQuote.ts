import type { buildSDK } from '@seamless-defi/defi-sdk'
import type { Address, PublicClient } from 'viem'
import { base } from 'viem/chains'
import type { CollateralToDebtSwapConfig } from '@/domain/redeem/utils/createCollateralToDebtQuote'
import {
  createInfinifiQuoteAdapter,
  createLifiQuoteAdapter,
  createPendleQuoteAdapter,
  createUniswapV3QuoteAdapter,
  createVeloraQuoteAdapter,
} from '@/domain/shared/adapters'
import type { BalmyAdapterOverrideOptions } from '@/domain/shared/adapters/balmy'
import { createBalmyQuoteAdapter } from '@/domain/shared/adapters/balmy'
import { createUniswapV2QuoteAdapter } from '@/domain/shared/adapters/uniswapV2'
import type { trackBestQuoteSource } from '@/lib/config/ga4.config'
import { getUniswapV3ChainConfig, getUniswapV3PoolConfig } from '@/lib/config/uniswapV3'
import { BASE_WETH, getContractAddresses, type SupportedChainId } from '@/lib/contracts/addresses'
import type { QuoteFn } from '../planner/types'

export type DebtToCollateralSwapConfig = CollateralToDebtSwapConfig

export interface CreateDebtToCollateralQuoteParams {
  chainId: number
  routerAddress: Address
  swap: DebtToCollateralSwapConfig
  getPublicClient: (chainId: number) => PublicClient | undefined
  fromAddress?: Address
  balmySDK: ReturnType<typeof buildSDK>
  balmyOverrideOptions?: BalmyAdapterOverrideOptions
  trackBestQuoteSource: typeof trackBestQuoteSource
}

export interface CreateDebtToCollateralQuoteResult {
  quote: QuoteFn
  adapterType: DebtToCollateralSwapConfig['type']
}

export function createDebtToCollateralQuote({
  chainId,
  routerAddress,
  swap,
  getPublicClient,
  fromAddress,
  balmySDK,
  balmyOverrideOptions,
  trackBestQuoteSource,
}: CreateDebtToCollateralQuoteParams): CreateDebtToCollateralQuoteResult {
  // Default fromAddress to the chain's MulticallExecutor when not provided
  const defaultFrom = (() => {
    try {
      const c = getContractAddresses(chainId)
      return c.multicallExecutor as Address | undefined
    } catch {
      return undefined
    }
  })()
  const effectiveFrom = (fromAddress ?? defaultFrom) as Address | undefined

  if (swap.type === 'balmy') {
    const quote = createBalmyQuoteAdapter(
      {
        chainId,
        fromAddress: effectiveFrom ?? routerAddress,
        toAddress: routerAddress,
        balmySDK,
        excludeAdditionalSources: swap.excludeAdditionalSources,
        ...(balmyOverrideOptions ? { balmyOverrideOptions } : {}),
      },
      trackBestQuoteSource,
    )
    return { quote, adapterType: 'balmy' }
  }

  if (swap.type === 'lifi') {
    const quote = createLifiQuoteAdapter({
      chainId,
      router: routerAddress,
      ...(effectiveFrom ? { fromAddress: effectiveFrom } : {}),
      ...(swap.allowBridges ? { allowBridges: swap.allowBridges } : {}),
      ...(swap.order ? { order: swap.order } : {}),
    })
    return { quote, adapterType: 'lifi' }
  }

  if (swap.type === 'velora') {
    const quote = createVeloraQuoteAdapter({
      chainId: chainId as SupportedChainId,
      router: routerAddress,
      ...(effectiveFrom ? { fromAddress: effectiveFrom } : {}),
    })
    return { quote, adapterType: 'velora' }
  }

  if (swap.type === 'pendle') {
    const quote = createPendleQuoteAdapter({
      chainId: chainId as SupportedChainId,
      router: routerAddress,
    })
    return { quote, adapterType: 'pendle' }
  }
  const publicClient = getPublicClient(chainId)
  if (!publicClient) {
    throw new Error('Public client unavailable for debt swap quote')
  }

  if (swap.type === 'infinifi') {
    const quote = createInfinifiQuoteAdapter({
      publicClient,
      chainId,
      router: routerAddress,
    })
    return { quote, adapterType: 'infinifi' }
  }

  if (swap.type === 'uniswapV2') {
    const wrappedNative = resolveWrappedNative(chainId)
    if (!wrappedNative) {
      throw new Error('Missing wrapped native token for debt swap')
    }

    const quote = createUniswapV2QuoteAdapter({
      publicClient: publicClient as unknown as Parameters<
        typeof createUniswapV2QuoteAdapter
      >[0]['publicClient'],
      router: swap.router,
      recipient: routerAddress,
      wrappedNative,
    })
    return { quote, adapterType: 'uniswapV2' }
  }

  const chainConfig = getUniswapV3ChainConfig(chainId)
  const poolConfig = getUniswapV3PoolConfig(chainId, swap.poolKey)
  if (!chainConfig || !poolConfig) {
    throw new Error('Missing Uniswap V3 configuration for debt swap')
  }

  const wrappedNative = resolveWrappedNative(chainId)

  const quote = createUniswapV3QuoteAdapter({
    publicClient,
    ...(chainConfig.quoter ? { quoter: chainConfig.quoter } : {}),
    router: chainConfig.swapRouter,
    fee: poolConfig.fee,
    recipient: routerAddress,
    poolAddress: poolConfig.address,
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
