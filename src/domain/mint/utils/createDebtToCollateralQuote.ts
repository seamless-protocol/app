import type { Address, PublicClient } from 'viem'
import { base } from 'viem/chains'
import type { CollateralToDebtSwapConfig } from '@/domain/redeem/utils/createCollateralToDebtQuote'
import {
  createLifiQuoteAdapter,
  createUniswapV3QuoteAdapter,
  createVeloraQuoteAdapter,
} from '@/domain/shared/adapters'
import { createUniswapV2QuoteAdapter } from '@/domain/shared/adapters/uniswapV2'
import { getUniswapV3ChainConfig, getUniswapV3PoolConfig } from '@/lib/config/uniswapV3'
import { BASE_WETH, getContractAddresses } from '@/lib/contracts/addresses'
import type { QuoteFn } from '../planner/types'

export type DebtToCollateralSwapConfig = CollateralToDebtSwapConfig

export interface CreateDebtToCollateralQuoteParams {
  chainId: number
  routerAddress: Address
  swap: DebtToCollateralSwapConfig
  slippageBps: number
  getPublicClient: (chainId: number) => PublicClient | undefined
  fromAddress?: Address
}

export interface CreateDebtToCollateralQuoteResult {
  quote: QuoteFn
  adapterType: DebtToCollateralSwapConfig['type']
}

export function createDebtToCollateralQuote({
  chainId,
  routerAddress,
  swap,
  slippageBps,
  getPublicClient,
  fromAddress,
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
  if (swap.type === 'lifi') {
    const quote = createLifiQuoteAdapter({
      chainId,
      router: routerAddress,
      slippageBps,
      ...(effectiveFrom ? { fromAddress: effectiveFrom } : {}),
      ...(swap.allowBridges ? { allowBridges: swap.allowBridges } : {}),
      ...(swap.order ? { order: swap.order } : {}),
    })
    console.info('[Mint][Quote] Using adapter: lifi')
    return { quote, adapterType: 'lifi' }
  }

  if (swap.type === 'velora') {
    const quote = createVeloraQuoteAdapter({
      chainId,
      router: routerAddress,
      slippageBps,
      ...(effectiveFrom ? { fromAddress: effectiveFrom } : {}),
    })
    return { quote, adapterType: 'velora' }
  }

  const publicClient = getPublicClient(chainId)
  if (!publicClient) {
    throw new Error('Public client unavailable for debt swap quote')
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
      slippageBps,
    })
    console.info('[Mint][Quote] Using adapter: uniswapV2')
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
    slippageBps,
    ...(wrappedNative ? { wrappedNative } : {}),
  })
  console.info('[Mint][Quote] Using adapter: uniswapV3')
  return { quote, adapterType: 'uniswapV3' }
}

function resolveWrappedNative(chainId: number): Address | undefined {
  const contracts = getContractAddresses(chainId)
  const weth = contracts?.tokens?.weth
  if (weth) return weth

  if (chainId === base.id) return BASE_WETH

  return undefined
}
