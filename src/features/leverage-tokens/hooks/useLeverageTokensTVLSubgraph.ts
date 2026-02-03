import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useBalmySDK } from '@/components/BalmySDKProvider'
import { getAllLeverageTokenConfigs } from '@/features/leverage-tokens/leverageTokens.config'
import { ltKeys } from '@/features/leverage-tokens/utils/queryKeys'
import { fetchLeverageTokenStateHistory } from '@/lib/graphql/fetchers/portfolio'
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
  const { balmySDK } = useBalmySDK()

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
    balmySDK,
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
