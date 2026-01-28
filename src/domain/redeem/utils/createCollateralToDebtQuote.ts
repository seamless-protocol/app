import type { buildSDK } from '@seamless-defi/defi-sdk'
import type { Address, PublicClient } from 'viem'
import { base } from 'viem/chains'
import {
  createInfinifiQuoteAdapter,
  createLifiQuoteAdapter,
  createPendleQuoteAdapter,
  createUniswapV3QuoteAdapter,
  createVeloraQuoteAdapter,
  type LifiOrder,
} from '@/domain/shared/adapters'
import { createBalmyQuoteAdapter } from '@/domain/shared/adapters/balmy'
import { createUniswapV2QuoteAdapter } from '@/domain/shared/adapters/uniswapV2'
import {
  getUniswapV3ChainConfig,
  getUniswapV3PoolConfig,
  type UniswapV3PoolKey,
} from '@/lib/config/uniswapV3'
import { BASE_WETH, getContractAddresses, type SupportedChainId } from '@/lib/contracts/addresses'
import type { QuoteFn } from '../planner/types'

/** Supported adapter types for collateral-to-debt swaps */
export type SwapAdapterType =
  | 'balmy'
  | 'lifi'
  | 'velora'
  | 'uniswapV3'
  | 'uniswapV2'
  | 'pendle'
  | 'infinifi'
/**
 * Validated ParaSwap methods for Velora exactOut operations.
 * Contract has hardcoded byte offsets that only work with swapExactAmountOut.
 * See: src/domain/shared/adapters/velora.ts for offset validation details.
 */
const VELORA_VALIDATED_EXACT_OUT_METHODS = ['swapExactAmountOut'] as const

export type CollateralToDebtSwapConfig =
  | {
      type: 'balmy'
      excludeAdditionalSources?: Array<string>
    }
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
  | {
      type: 'velora'
    }
  | {
      type: 'pendle'
    }
  | {
      type: 'infinifi'
    }

export interface CreateCollateralToDebtQuoteParams {
  chainId: number
  routerAddress: Address
  swap: CollateralToDebtSwapConfig
  getPublicClient: (chainId: number) => PublicClient | undefined
  /** Optional override for aggregator `fromAddress` (defaults handled by adapter). */
  fromAddress?: Address
  balmySDK: ReturnType<typeof buildSDK>
}

export interface CreateCollateralToDebtQuoteResult {
  quote: QuoteFn
  adapterType: SwapAdapterType
}

export function createCollateralToDebtQuote({
  chainId,
  routerAddress,
  swap,
  getPublicClient,
  fromAddress,
  balmySDK,
}: CreateCollateralToDebtQuoteParams): CreateCollateralToDebtQuoteResult {
  if (swap.type === 'balmy') {
    const quote = createBalmyQuoteAdapter({
      chainId,
      toAddress: routerAddress,
      fromAddress: fromAddress ?? routerAddress,
      balmySDK,
      excludeAdditionalSources: swap.excludeAdditionalSources,
    })
    return { quote, adapterType: 'balmy' }
  }

  if (swap.type === 'lifi') {
    const quote = createLifiQuoteAdapter({
      chainId,
      router: routerAddress,
      ...(fromAddress ? { fromAddress } : {}),
      ...(swap.allowBridges ? { allowBridges: swap.allowBridges } : {}),
      ...(swap.order ? { order: swap.order } : {}),
    })
    return { quote, adapterType: 'lifi' }
  }

  if (swap.type === 'velora') {
    const quote = createVeloraQuoteAdapter({
      chainId: chainId as SupportedChainId,
      router: routerAddress,
      ...(fromAddress ? { fromAddress } : {}),
      // Restrict to validated methods for exactOut operations (redeem)
      includeContractMethods: [...VELORA_VALIDATED_EXACT_OUT_METHODS],
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
    throw new Error('Public client unavailable for collateral quote')
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
      throw new Error('Missing wrapped native token for Uniswap V2 collateral swap')
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
