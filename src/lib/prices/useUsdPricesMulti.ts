import { useQuery } from '@tanstack/react-query'
import { fetchCoingeckoTokenUsdPrices } from './coingecko'

export interface UseUsdPricesMultiParams {
  byChain: Record<number, Array<string>>
  enabled?: boolean
  staleTimeMs?: number
  refetchIntervalMs?: number
}

/**
 * Fetch USD prices for multiple chains in a single React Query, batching per-chain
 * requests under the hood. Returns a nested map: { [chainId]: { [addrLower]: usd } }.
 */
export function useUsdPricesMultiChain({
  byChain,
  enabled = true,
  staleTimeMs = 15_000,
  refetchIntervalMs = 15_000,
}: UseUsdPricesMultiParams) {
  const key = createKey(byChain)

  return useQuery({
    queryKey: ['usd-prices-multi', key],
    queryFn: async () => {
      const entries = Object.entries(byChain)
      if (entries.length === 0) return {}

      const results = await Promise.all(
        entries.map(async ([chainIdStr, addrs]) => {
          const chainId = Number(chainIdStr)
          const map = await fetchCoingeckoTokenUsdPrices(chainId, addrs)
          return [chainId, map] as const
        }),
      )

      const out: Record<number, Record<string, number>> = {}
      for (const [chainId, map] of results) {
        out[chainId] = map
      }
      return out
    },
    enabled: enabled && Object.keys(byChain).length > 0,
    staleTime: staleTimeMs,
    refetchInterval: refetchIntervalMs,
  })
}

function createKey(byChain: Record<number, Array<string>>) {
  const sorted = Object.entries(byChain)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([chainId, addrs]) => [chainId, [...new Set(addrs.map((a) => a.toLowerCase()))].sort()])
  return sorted
}
