import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { prefetchPortfolioWarmup } from './usePortfolioDataFetcher'

interface UsePortfolioPrefetchParams {
  address?: `0x${string}` | null | undefined
  enabled?: boolean
  timeframe?: '7D' | '30D' | '90D' | '1Y'
  oncePerAddress?: boolean
}

/**
 * Small helper hook to warm the portfolio cache.
 * - Calls prefetchPortfolioWarmup when `enabled` and `address` are provided.
 * - Guards duplicate runs per address when `oncePerAddress` is true (default).
 */
export function usePortfolioPrefetch({
  address,
  enabled = true,
  timeframe = '30D',
  oncePerAddress = true,
}: UsePortfolioPrefetchParams) {
  const queryClient = useQueryClient()
  const lastAddressRef = useRef<`0x${string}` | null | undefined>(null)

  useEffect(() => {
    if (!enabled || !address) return
    if (oncePerAddress && lastAddressRef.current === address) return
    lastAddressRef.current = address
    prefetchPortfolioWarmup(queryClient, { address, timeframe }).catch(() => {})
  }, [enabled, address, timeframe, oncePerAddress, queryClient])
}
