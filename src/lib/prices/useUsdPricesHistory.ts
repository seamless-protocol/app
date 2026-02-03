import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useBalmySDK } from '@/components/BalmySDKProvider'
import { fetchBalmyTokenUsdPricesHistory } from '@/domain/shared/adapters/balmy'

export interface UseUsdPricesHistoryParams {
  byChain: Record<number, Array<string>>
  from: number // seconds
  now: number // seconds
  enabled?: boolean
  staleTimeMs?: number
}

export interface UsdHistoryByChain {
  [chainId: number]: {
    [addressLower: string]: Array<[number, number]> // [tsSec, priceUsd]
  }
}

/**
 * Fetch historical USD price ranges for multiple chains and multiple ERC-20 contracts.
 *
 * - Groups requests by `chainId`.
 * - For each chain, fetches all tokens' `[from, now]` price history
 * - Exposes `getUsdPriceAt(chainId, address, tsSec)` which returns the nearest-prior
 *   USD price at a given timestamp using binary search.
 *
 * Notes
 * - The returned series per token is sorted ascending and stored as `[tsSec, priceUsd]`.
 */
export function useHistoricalUsdPricesMultiChain({
  byChain,
  from,
  enabled = true,
  staleTimeMs = 60_000,
}: UseUsdPricesHistoryParams) {
  // Round down to the nearest 5 minutes so the query key (and thus refetch) stays stable
  const now = Math.floor(Date.now() / 1000 / 300) * 300
  const key = useMemo(() => createKey(byChain, from, now), [byChain, from, now])
  const { balmySDK } = useBalmySDK()

  const query = useQuery({
    queryKey: ['usd-history', key],
    enabled: enabled && Object.keys(byChain).length > 0,
    staleTime: staleTimeMs,
    queryFn: async (): Promise<UsdHistoryByChain> => {
      const entries = Object.entries(byChain)
      if (entries.length === 0) return {}

      const out: UsdHistoryByChain = {}

      for (const [chainIdStr, addresses] of entries) {
        const chainId = Number(chainIdStr)
        const unique = [...new Set(addresses.map((a) => a.toLowerCase()))]
        out[chainId] = await fetchBalmyTokenUsdPricesHistory(balmySDK, chainId, unique, from)
      }

      return out
    },
  })

  // Pure accessor: returns nearest-prior USD for (chainId, address, tsSec) from in-memory cache
  const getUsdPriceAt = useMemo(() => {
    return (chainId: number, address: string, tsSec: number): number | undefined => {
      const chainMap = query.data?.[chainId]
      if (!chainMap) return undefined
      const series = chainMap[address.toLowerCase()]
      if (!series || series.length === 0) return undefined
      // Nearest-prior lookup (binary search)
      let lo = 0
      let hi = series.length - 1
      let best: number | undefined
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2)
        const midVal = series[mid]
        if (!midVal) break
        const [t, p] = midVal
        if (t <= tsSec) {
          best = p
          lo = mid + 1
        } else {
          hi = mid - 1
        }
      }
      return best
    }
  }, [query.data])

  return { ...query, getUsdPriceAt }
}

/**
 * Create a stable query key from (byChain, from, to):
 * - Normalizes addresses to lowercase and sorts for deterministic keys.
 */
function createKey(byChain: Record<number, Array<string>>, from: number, to: number) {
  const sorted = Object.entries(byChain)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([chainId, addrs]) => [chainId, [...new Set(addrs.map((a) => a.toLowerCase()))].sort()])
  return [sorted, Math.floor(from), Math.floor(to)]
}

/**
 * Create a stable query key from (byChain, from, to):
 * Exported for prefetching outside of hooks.
 */
export function createUsdHistoryKey(
  byChain: Record<number, Array<string>>,
  from: number,
  to: number,
) {
  return createKey(byChain, from, to)
}

/**
 * Full query key helper for USD history range queries
 */
export function usdHistoryQueryKey(
  byChain: Record<number, Array<string>>,
  from: number,
  to: number,
) {
  return ['usd-history', createKey(byChain, from, to)] as const
}
