/**
 * Hook for fetching leverage token price comparison data
 * Combines leverage token value historical data with collateral price historical data
 * Used to generate charts showing weETH vs. Leverage Token Price
 */

import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import type { PriceDataPoint } from '@/components/ui/price-line-chart'
import { fetchLeverageTokenPriceComparison } from '@/lib/graphql/fetchers/leverage-tokens'
import { getLeverageTokenConfig } from '../leverageTokens.config'
import { STALE_TIME } from '../utils/constants'
import { ltKeys } from '../utils/queryKeys'

export interface UseLeverageTokenPriceComparisonOptions {
  tokenAddress: Address
  chainId: number
  timeframe?: '1W' | '1M' | '3M' | '6M' | '1Y'
  enabled?: boolean
}

export function useLeverageTokenPriceComparison({
  tokenAddress,
  chainId,
  timeframe = '1M',
  enabled = true,
}: UseLeverageTokenPriceComparisonOptions) {
  return useQuery({
    queryKey: [...ltKeys.token(tokenAddress), 'price-comparison', chainId, timeframe],
    queryFn: async (): Promise<Array<PriceDataPoint>> => {
      const result = await fetchLeverageTokenPriceComparison(tokenAddress, chainId)

      if (!result.leverageToken) {
        return []
      }

      // Get leverage token config to access leverage token decimals
      const tokenConfig = getLeverageTokenConfig(tokenAddress)
      const leverageTokenDecimals = tokenConfig?.decimals || 18 // Fallback to 18 if not found

      const { stateHistory, lendingAdapter } = result.leverageToken

      if (!stateHistory || !lendingAdapter?.oracle?.priceUpdates) {
        return []
      }

      // Convert timestamps from microseconds to milliseconds and sort by timestamp
      const leverageTokenData = stateHistory
        .map((item) => {
          const timestamp = parseInt(item.timestamp, 10) / 1000 // Convert microseconds to milliseconds
          // Validate timestamp is reasonable (not too old or future)
          if (
            Number.isNaN(timestamp) ||
            timestamp <= 0 ||
            timestamp > Date.now() + 24 * 60 * 60 * 1000
          ) {
            return null
          }
          return {
            ...item,
            timestamp,
            equityPerTokenInDebt: parseFloat(item.equityPerTokenInDebt),
          }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null) // Remove invalid entries
        .sort((a, b) => a.timestamp - b.timestamp)

      const collateralPriceData = lendingAdapter.oracle.priceUpdates
        .map((item) => {
          const timestamp = parseInt(item.timestamp, 10) / 1000 // Convert microseconds to milliseconds
          // Validate timestamp is reasonable (not too old or future)
          if (
            Number.isNaN(timestamp) ||
            timestamp <= 0 ||
            timestamp > Date.now() + 24 * 60 * 60 * 1000
          ) {
            return null
          }
          return {
            ...item,
            timestamp,
            price: parseFloat(item.price) / 10 ** lendingAdapter.oracle.decimals, // Convert from raw decimals
          }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null) // Remove invalid entries
        .sort((a, b) => a.timestamp - b.timestamp)

      // Filter data based on timeframe
      const now = Date.now()
      const timeframeMs = getTimeframeMs(timeframe)
      const cutoffTime = now - timeframeMs

      const filteredLeverageTokenData = leverageTokenData.filter(
        (item) => item.timestamp >= cutoffTime,
      )
      const filteredCollateralPriceData = collateralPriceData.filter(
        (item) => item.timestamp >= cutoffTime,
      )

      const combinedData: Array<PriceDataPoint> = []

      if (filteredLeverageTokenData.length > 0 && filteredCollateralPriceData.length > 0) {
        // Build merged timestamp list (like _sources)
        const allTimestamps = Array.from(
          new Set([
            ...filteredLeverageTokenData.map((pt) => pt.timestamp),
            ...filteredCollateralPriceData.map((pt) => pt.timestamp),
          ]),
        ).sort((a, b) => a - b)

        // Prepare arrays for series data
        const collateralSeriesData: Array<number | null> = []
        const leverageTokenSeriesData: Array<number | null> = []

        // Use a pointer to forward-fill collateral price (like _sources)
        let j = 0
        for (const ts of allTimestamps) {
          // Advance j to the latest collateralPoints index where collateralPoints[j].ts <= ts
          while (
            j + 1 < filteredCollateralPriceData.length &&
            filteredCollateralPriceData[j + 1] &&
            (filteredCollateralPriceData[j + 1]?.timestamp ?? 0) <= ts
          ) {
            j++
          }
          // If collateralPoints[j].ts <= ts, use collateralPoints[j].value; else null
          const collateralItem = filteredCollateralPriceData[j]
          if (
            filteredCollateralPriceData.length > 0 &&
            collateralItem &&
            collateralItem.timestamp <= ts
          ) {
            collateralSeriesData.push(collateralItem.price)
          } else {
            collateralSeriesData.push(null)
          }

          // For leverage token, use exact match or null
          const leveragePt = filteredLeverageTokenData.find((pt) => pt.timestamp === ts)
          leverageTokenSeriesData.push(
            leveragePt ? leveragePt.equityPerTokenInDebt / 10 ** leverageTokenDecimals : null,
          )
        }

        // Build final data points
        for (let i = 0; i < allTimestamps.length; i++) {
          const timestamp = allTimestamps[i]
          if (timestamp !== undefined) {
            const weethPrice = collateralSeriesData[i]
            const leverageTokenPrice = leverageTokenSeriesData[i]

            combinedData.push({
              date: new Date(timestamp).toISOString(),
              ...(weethPrice !== null && { weethPrice }),
              ...(leverageTokenPrice !== null && { leverageTokenPrice }),
            })
          }
        }
      }

      // Sort by date (oldest first) and return
      const finalResult = combinedData.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      )

      return finalResult
    },
    staleTime: STALE_TIME.historical,
    enabled: enabled,
  })
}

function getTimeframeMs(timeframe: string): number {
  switch (timeframe) {
    case '1W':
      return 7 * 24 * 60 * 60 * 1000 // 1 week
    case '1M':
      return 30 * 24 * 60 * 60 * 1000 // 1 month
    case '3M':
      return 90 * 24 * 60 * 60 * 1000 // 3 months
    case '6M':
      return 180 * 24 * 60 * 60 * 1000 // 6 months
    case '1Y':
      return 365 * 24 * 60 * 60 * 1000 // 1 year
    default:
      return 30 * 24 * 60 * 60 * 1000 // Default to 1 month
  }
}
