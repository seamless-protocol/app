import { useMemo } from 'react'
import type { Address, PublicClient } from 'viem'
import { usePublicClient } from 'wagmi'
import {
  createDebtToCollateralQuote,
  type DebtToCollateralSwapConfig,
} from '@/domain/mint/utils/createDebtToCollateralQuote'
import type { SupportedChainId } from '@/lib/contracts/addresses'

export type QuoteStatus =
  | 'not-required'
  | 'missing-config'
  | 'missing-router'
  | 'missing-client'
  | 'missing-chain-config'
  | 'ready'
  | 'error'

interface UseDebtToCollateralQuoteParams {
  chainId: SupportedChainId
  routerAddress?: Address
  swap?: DebtToCollateralSwapConfig
  requiresQuote: boolean
  fromAddress?: Address
}

export function useDebtToCollateralQuote({
  chainId,
  routerAddress,
  swap,
  requiresQuote,
  fromAddress,
}: UseDebtToCollateralQuoteParams): {
  quote: ReturnType<typeof createDebtToCollateralQuote>['quote'] | undefined
  status: QuoteStatus
  error: Error | undefined
} {
  const publicClient = usePublicClient({ chainId })

  return useMemo(() => {
    if (!requiresQuote) {
      return { status: 'not-required', quote: undefined, error: undefined }
    }

    if (!swap) {
      return { status: 'missing-config', quote: undefined, error: undefined }
    }

    if (!routerAddress) {
      return { status: 'missing-router', quote: undefined, error: undefined }
    }

    const getPublicClient = (cid: number): PublicClient | undefined =>
      cid === chainId ? publicClient : undefined

    try {
      const { quote } = createDebtToCollateralQuote({
        chainId,
        routerAddress,
        swap,
        getPublicClient,
        ...(fromAddress ? { fromAddress } : {}),
      })
      return { status: 'ready', quote, error: undefined }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      const message = error.message
      if (import.meta.env && import.meta.env['VITE_E2E'] === '1') {
        // Help debug quote readiness in E2E by surfacing root cause
        // eslint-disable-next-line no-console
        console.info('[Mint][Quote][Debug]', {
          chainId,
          hasRouter: Boolean(routerAddress),
          hasClient: Boolean(publicClient),
          swapType: swap?.type,
          message,
        })
      }
      if (message.includes('Public client')) {
        return { status: 'missing-client', quote: undefined, error }
      }
      if (
        message.includes('Missing Uniswap V3 configuration') ||
        message.includes('Missing wrapped native token')
      ) {
        return { status: 'missing-chain-config', quote: undefined, error }
      }
      return { status: 'error', quote: undefined, error }
    }
  }, [chainId, fromAddress, publicClient, requiresQuote, routerAddress, swap])
}
