import { useMemo } from 'react'
import type { Address, PublicClient } from 'viem'
import { usePublicClient } from 'wagmi'
import { useBalmySDK } from '@/components/BalmySDKProvider'
import {
  type CollateralToDebtSwapConfig,
  createCollateralToDebtQuote,
} from '@/domain/redeem/utils/createCollateralToDebtQuote'
import type { BalmyAdapterOverrideOptions } from '@/domain/shared/adapters/balmy'
import { useQuoteGA } from '@/lib/config/ga4.config'
import type { SupportedChainId } from '@/lib/contracts/addresses'
import { getContractAddresses } from '@/lib/contracts/addresses'

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
  requiresQuote: boolean
  balmyOverrideOptions?: BalmyAdapterOverrideOptions
}

export function useCollateralToDebtQuote({
  chainId,
  routerAddress,
  swap,
  requiresQuote,
  balmyOverrideOptions,
}: UseCollateralToDebtQuoteParams): {
  quote: ReturnType<typeof createCollateralToDebtQuote>['quote'] | undefined
  status: QuoteStatus
  error: Error | undefined
} {
  const publicClient = usePublicClient({ chainId })
  const { balmySDK } = useBalmySDK()
  const { trackBestQuoteSource } = useQuoteGA()

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
      // Resolve MulticallExecutor (actual on-chain caller for swapCalls)
      const executor = getContractAddresses(chainId).multicallExecutor as Address | undefined
      const { quote } = createCollateralToDebtQuote({
        chainId,
        routerAddress,
        swap,
        // Align aggregator expectations: executor executes the swap on-chain
        ...(executor ? { fromAddress: executor } : {}),
        getPublicClient,
        balmySDK,
        ...(balmyOverrideOptions ? { balmyOverrideOptions } : {}),
        trackBestQuoteSource,
      })
      return { status: 'ready' as QuoteStatus, quote, error: undefined }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      const message = error.message
      if (message.includes('Public client')) {
        return { status: 'missing-client' as QuoteStatus, quote: undefined, error }
      }
      if (
        message.includes('Missing Uniswap V3 configuration') ||
        message.includes('Missing wrapped native token for Uniswap V2')
      ) {
        return { status: 'missing-chain-config' as QuoteStatus, quote: undefined, error }
      }
      return { status: 'error' as QuoteStatus, quote: undefined, error }
    }
  }, [
    balmyOverrideOptions,
    balmySDK,
    chainId,
    publicClient,
    requiresQuote,
    routerAddress,
    swap,
    trackBestQuoteSource,
  ])
}
