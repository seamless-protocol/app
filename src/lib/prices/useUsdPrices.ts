import { useBalmySDK } from '@/components/BalmySDKProvider'
import { useUsdPricesMultiChain } from './useUsdPricesMulti'

interface UseUsdPricesOptions {
  chainId: number
  addresses: Array<string>
  enabled?: boolean
  staleTimeMs?: number
  refetchIntervalMs?: number
}

/**
 * React Query hook to fetch USD prices for a set of token addresses on a chain.
 * Batches into a single call and returns a map of lowercase address -> usd price.
 */
export function useUsdPrices({
  chainId,
  addresses,
  enabled = true,
  staleTimeMs = 15_000,
  refetchIntervalMs = 15_000,
}: UseUsdPricesOptions) {
  const { balmySDK } = useBalmySDK()
  const { data, ...rest } = useUsdPricesMultiChain({
    byChain: { [chainId]: addresses },
    balmySDK,
    enabled: enabled && addresses.length > 0,
    staleTimeMs,
    refetchIntervalMs,
  })

  return {
    data: data?.[chainId] ?? {},
    ...rest,
  }
}
