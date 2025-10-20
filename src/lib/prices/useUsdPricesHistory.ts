import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { fetchCoingeckoTokenUsdPricesRange } from './coingecko'

export interface UseUsdPricesHistoryParams {
  byChain: Record<number, Array<string>>
  from: number // seconds
  to: number // seconds
  enabled?: boolean
  concurrency?: number
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
 * - For each chain, fetches each token’s `[from, to]` CoinGecko range with a small
 *   concurrency cap to avoid rate limiting.
 * - Exposes `getUsdPriceAt(chainId, address, tsSec)` which returns the nearest-prior
 *   USD price at a given timestamp using binary search.
 *
 * Notes
 * - CoinGecko returns timestamps in milliseconds; we normalize to seconds.
 * - The returned series per token is sorted ascending and stored as `[tsSec, priceUsd]`.
 * - Concurrency defaults to 5. CoinGecko can rate-limit; values between 4–6 are reasonable.
 */
export function useHistoricalUsdPricesMultiChain({
  byChain,
  from,
  to,
  enabled = true,
  concurrency = 5,
  staleTimeMs = 60_000,
}: UseUsdPricesHistoryParams) {
  const key = useMemo(() => createKey(byChain, from, to), [byChain, from, to])

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
        const results = await mapWithConcurrency(unique, concurrency, async (addr) => {
          const series = await fetchCoingeckoTokenUsdPricesRange(chainId, addr, from, to)
          return [addr, series] as const
        })
        out[chainId] = Object.fromEntries(results)
      }

      return out
    },
  })

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
 * Minimal concurrency-limited map.
 *
 * - Runs up to `limit` promises in flight at once.
 * - Preserves the original order of `items` in the returned array.
 * - First rejection rejects the whole operation (no retry/backoff here).
 *
 * Useful for gently parallelizing many network requests (e.g., CoinGecko range
 * calls) without hammering the provider.
 */
async function mapWithConcurrency<T, R>(
  items: Array<T>,
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<Array<R>> {
  const results: Array<R> = new Array(items.length)
  let inFlight = 0
  let i = 0
  return new Promise((resolve, reject) => {
    const next = () => {
      if (i >= items.length && inFlight === 0) {
        resolve(results)
        return
      }
      while (inFlight < limit && i < items.length) {
        const idx = i++
        inFlight++
        const item = items[idx] as T
        Promise.resolve(fn(item, idx))
          .then((res) => {
            results[idx] = res
          })
          .catch(reject)
          .finally(() => {
            inFlight--
            next()
          })
      }
    }
    next()
  })
}
