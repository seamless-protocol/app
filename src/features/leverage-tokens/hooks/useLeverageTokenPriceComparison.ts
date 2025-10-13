/**
 * Hook for fetching leverage token price comparison data
 * Combines leverage token value historical data with collateral price historical data
 * Used to generate charts showing weETH vs. Leverage Token Price
 */

import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import type { PriceDataPoint } from '@/components/ui/price-line-chart'
import { fetchLeverageTokenPriceComparison } from '@/lib/graphql/fetchers/leverage-tokens'
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

      console.log('🔍 [Price Comparison] Data for timeframe:', {
        timeframe,
        cutoffTime: new Date(cutoffTime).toISOString(),
        leverageTokenDataCount: leverageTokenData.length,
        collateralPriceDataCount: collateralPriceData.length,
        filteredLeverageCount: filteredLeverageTokenData.length,
        filteredCollateralCount: filteredCollateralPriceData.length,
        leverageTokenTimestamps: filteredLeverageTokenData.map((d) => ({
          timestamp: d.timestamp,
          date: new Date(d.timestamp).toISOString(),
        })),
        collateralTimestamps: filteredCollateralPriceData.map((d) => ({
          timestamp: d.timestamp,
          date: new Date(d.timestamp).toISOString(),
        })),
      })

      // For each collateral price update, interpolate the leverage token price
      const combinedData: Array<PriceDataPoint> = []

      // If we have leverage token data, use it to interpolate
      if (filteredLeverageTokenData.length > 0) {
        for (const collateralItem of filteredCollateralPriceData) {
          // Find the two leverage token data points that bracket this collateral timestamp
          let beforeIndex = -1
          let afterIndex = -1

          for (let i = 0; i < filteredLeverageTokenData.length; i++) {
            const item = filteredLeverageTokenData[i]
            if (!item) continue

            if (item.timestamp <= collateralItem.timestamp) {
              beforeIndex = i
            }
            if (item.timestamp >= collateralItem.timestamp && afterIndex === -1) {
              afterIndex = i
              break
            }
          }

          let leverageTokenPrice: number

          const firstItem = filteredLeverageTokenData[0]
          const lastItem = filteredLeverageTokenData[filteredLeverageTokenData.length - 1]
          const beforeItem = beforeIndex >= 0 ? filteredLeverageTokenData[beforeIndex] : undefined
          const afterItem = afterIndex >= 0 ? filteredLeverageTokenData[afterIndex] : undefined

          if (beforeIndex === -1 && firstItem) {
            // Before all leverage token data, use the first available
            leverageTokenPrice = firstItem.equityPerTokenInDebt / 10 ** 18
          } else if (afterIndex === -1 && lastItem) {
            // After all leverage token data, use the last available
            leverageTokenPrice = lastItem.equityPerTokenInDebt / 10 ** 18
          } else if (beforeIndex === afterIndex && beforeItem) {
            // Exact match
            leverageTokenPrice = beforeItem.equityPerTokenInDebt / 10 ** 18
          } else if (beforeItem && afterItem) {
            // Interpolate between two points
            const timeDiff = afterItem.timestamp - beforeItem.timestamp
            const timeFromBefore = collateralItem.timestamp - beforeItem.timestamp
            const ratio = timeDiff > 0 ? timeFromBefore / timeDiff : 0

            const beforePrice = beforeItem.equityPerTokenInDebt / 10 ** 18
            const afterPrice = afterItem.equityPerTokenInDebt / 10 ** 18
            leverageTokenPrice = beforePrice + (afterPrice - beforePrice) * ratio
          } else {
            // Fallback: use first available if exists
            leverageTokenPrice = firstItem ? firstItem.equityPerTokenInDebt / 10 ** 18 : 0
          }

          combinedData.push({
            date: new Date(collateralItem.timestamp).toISOString(),
            weethPrice: collateralItem.price,
            leverageTokenPrice,
          })
        }
      }

      // Sort by date (oldest first) and return
      const finalResult = combinedData.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      )

      console.log('🔍 [Price Comparison] Final combined data:', {
        combinedDataCount: combinedData.length,
        finalResultCount: finalResult.length,
        dataPoints: finalResult.map((d) => ({
          date: d.date,
          weethPrice: d.weethPrice,
          leverageTokenPrice: d.leverageTokenPrice,
        })),
      })

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
