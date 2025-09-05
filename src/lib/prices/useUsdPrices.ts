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
 * Batches into a single CoinGecko call and returns a map of lowercase address -> usd price.
 */
export function useUsdPrices({
  chainId,
  addresses,
  enabled = true,
  staleTimeMs = 15_000,
  refetchIntervalMs = 15_000,
}: UseUsdPricesOptions) {
  const { data, ...rest } = useUsdPricesMultiChain({
    byChain: { [chainId]: addresses },
    enabled: enabled && addresses.length > 0,
    staleTimeMs,
    refetchIntervalMs,
  })

  return {
    data: data?.[chainId] ?? {},
    ...rest,
  }
}
