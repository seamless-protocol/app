import { type QueryClient, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getAllLeverageTokenConfigs } from '@/features/leverage-tokens/leverageTokens.config'
import { ltKeys } from '@/features/leverage-tokens/utils/queryKeys'
import { fetchLeverageTokenStateHistory } from '@/lib/graphql/fetchers/portfolio'
import { fetchCoingeckoTokenUsdPrices } from '@/lib/prices/coingecko'
import { useUsdPricesMultiChain } from '@/lib/prices/useUsdPricesMulti'

export interface LeverageTokensTVLResult {
  tvlUsd?: number
  isLoading: boolean
  isError: boolean
}

/**
 * Aggregate Leverage Token TVL via subgraph (latest state per token) in USD.
 * Falls back to undefined if subgraph requests fail; consumer can gate on isError.
 */
export function useLeverageTokensTVLSubgraph(): LeverageTokensTVLResult {
  const tokens = useMemo(() => getAllLeverageTokenConfigs(), [])

  // Prepare price fetch input using reduce: debt asset addresses grouped by chain
  const pricesByChainInput = useMemo(
    () =>
      tokens.reduce(
        (acc, t) => {
          let list = acc[t.chainId]
          if (!list) {
            list = []
            acc[t.chainId] = list
          }
          list.push(t.debtAsset.address)
          return acc
        },
        {} as Record<number, Array<string>>,
      ),
    [tokens],
  )

  const {
    data: usdPriceMapByChain,
    isLoading: isPricesLoading,
    isError: isPricesError,
  } = useUsdPricesMultiChain({
    byChain: pricesByChainInput,
    enabled: tokens.length > 0,
    staleTimeMs: 15 * 60 * 1000,
    refetchIntervalMs: 15 * 60 * 1000,
  })

  const {
    data: tvlUsd,
    isLoading: isSubgraphLoading,
    isError: isSubgraphError,
  } = useQuery({
    queryKey: ltKeys.tvlSubgraphAggregate(tokens.map((t) => t.address)),
    enabled: tokens.length > 0 && !!usdPriceMapByChain,
    queryFn: async () => {
      // Fetch latest state per token in parallel
      const results = await Promise.all(
        tokens.map(async (t) => {
          try {
            const res = await fetchLeverageTokenStateHistory(t.address, t.chainId, 1, 0)
            const state = res.leverageToken?.stateHistory?.[0]
            if (!state) return 0
            const equityDebtUnits = Number(state.totalEquityInDebt) / 10 ** t.debtAsset.decimals
            const price = usdPriceMapByChain?.[t.chainId]?.[t.debtAsset.address.toLowerCase()]
            if (typeof price !== 'number' || !Number.isFinite(price)) return 0
            const usd = equityDebtUnits * price
            return Number.isFinite(usd) ? usd : 0
          } catch {
            return 0
          }
        }),
      )
      const sum = results.reduce((acc, x) => acc + x, 0)
      return Number.isFinite(sum) ? sum : undefined
    },
    staleTime: 60 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000,
  })

  const result: LeverageTokensTVLResult = {
    ...(typeof tvlUsd === 'number' ? { tvlUsd } : {}),
    isLoading: isSubgraphLoading || isPricesLoading,
    isError: isSubgraphError || isPricesError,
  }
  return result
}

// Prefetch leverage tokens TVL and dependent prices for faster navigation
export async function prefetchLeverageTokensTVL(queryClient: QueryClient) {
  const tokens = getAllLeverageTokenConfigs()
  if (tokens.length === 0) return

  // Build price input by chain using the same reduce logic
  const byChain: Record<number, Array<string>> = tokens.reduce(
    (acc, t) => {
      let list = acc[t.chainId]
      if (!list) {
        list = []
        acc[t.chainId] = list
      }
      list.push(t.debtAsset.address)
      return acc
    },
    {} as Record<number, Array<string>>,
  )

  // Build the multi-chain price query key just like useUsdPricesMultiChain
  const priceKey = [
    'usd-prices-multi',
    Object.entries(byChain)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([chainId, addrs]) => [
        Number(chainId),
        [...new Set(addrs.map((a) => a.toLowerCase()))].sort(),
      ]),
  ]

  // Prefetch prices for all chains
  await queryClient.prefetchQuery({
    queryKey: priceKey,
    queryFn: async () => {
      const entries = Object.entries(byChain)
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
    staleTime: 15 * 60 * 1000,
  })

  // Prefetch the aggregate TVL query, reusing prices from cache
  await queryClient.prefetchQuery({
    queryKey: ltKeys.tvlSubgraphAggregate(tokens.map((t) => t.address)),
    queryFn: async () => {
      const usdPriceMapByChain =
        queryClient.getQueryData<Record<number, Record<string, number>>>(priceKey)
      // If prices missing, compute quickly as fallback (should be cached above)
      const prices =
        usdPriceMapByChain ??
        (await (async () => {
          const entries = Object.entries(byChain)
          const res = await Promise.all(
            entries.map(async ([chainIdStr, addrs]) => {
              const chainId = Number(chainIdStr)
              const map = await fetchCoingeckoTokenUsdPrices(chainId, addrs)
              return [chainId, map] as const
            }),
          )
          const out: Record<number, Record<string, number>> = {}
          for (const [chainId, map] of res) out[chainId] = map
          return out
        })())

      const results = await Promise.all(
        tokens.map(async (t) => {
          try {
            const res = await fetchLeverageTokenStateHistory(t.address, t.chainId, 1, 0)
            const state = res.leverageToken?.stateHistory?.[0]
            if (!state) return 0
            const equityDebtUnits = Number(state.totalEquityInDebt) / 10 ** t.debtAsset.decimals
            const price = prices?.[t.chainId]?.[t.debtAsset.address.toLowerCase()]
            if (typeof price !== 'number' || !Number.isFinite(price)) return 0
            const usd = equityDebtUnits * price
            return Number.isFinite(usd) ? usd : 0
          } catch {
            return 0
          }
        }),
      )
      const sum = results.reduce((acc, x) => acc + x, 0)
      return Number.isFinite(sum) ? sum : undefined
    },
    staleTime: 60 * 60 * 1000,
  })
}
