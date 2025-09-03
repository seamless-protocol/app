/**
 * Hook for fetching leverage token price comparison data
 * Combines leverage token value historical data with collateral price historical data
 * Used to generate charts showing weETH vs. Leverage Token Price
 */

import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import { STALE_TIME } from '../utils/constants'
import { ltKeys } from '../utils/queryKeys'
import { fetchLeverageTokenPriceComparison } from '@/lib/graphql/fetchers/leverage-tokens'
import type { PriceDataPoint } from '@/components/ui/price-line-chart'

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
    queryFn: async (): Promise<PriceDataPoint[]> => {
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
          const timestamp = parseInt(item.timestamp) / 1000 // Convert microseconds to milliseconds
          // Validate timestamp is reasonable (not too old or future)
          if (isNaN(timestamp) || timestamp <= 0 || timestamp > Date.now() + 24 * 60 * 60 * 1000) {
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
          const timestamp = parseInt(item.timestamp) / 1000 // Convert microseconds to milliseconds
          // Validate timestamp is reasonable (not too old or future)
          if (isNaN(timestamp) || timestamp <= 0 || timestamp > Date.now() + 24 * 60 * 60 * 1000) {
            return null
          }
          return {
            ...item,
            timestamp,
            price: parseFloat(item.price) / Math.pow(10, lendingAdapter.oracle.decimals), // Convert from raw decimals
          }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null) // Remove invalid entries
        .sort((a, b) => a.timestamp - b.timestamp)

      // Filter data based on timeframe
      const now = Date.now()
      const timeframeMs = getTimeframeMs(timeframe)
      const cutoffTime = now - timeframeMs

      const filteredLeverageTokenData = leverageTokenData.filter(
        (item) => item.timestamp > cutoffTime,
      )
      const filteredCollateralPriceData = collateralPriceData.filter(
        (item) => item.timestamp > cutoffTime,
      )

      // Create a map of timestamps to prices for efficient lookup
      const collateralPriceMap = new Map<number, number>()
      filteredCollateralPriceData.forEach((item) => {
        collateralPriceMap.set(item.timestamp, item.price)
      })

      // Combine the data, matching timestamps as closely as possible
      const combinedData: PriceDataPoint[] = []

      filteredLeverageTokenData.forEach((leverageItem, index) => {
        // Find the closest collateral price within a reasonable time window (24 hours)
        const timeWindow = 24 * 60 * 60 * 1000 // 24 hours
        let closestCollateralPrice: number | undefined

        for (const [timestamp, price] of collateralPriceMap.entries()) {
          if (Math.abs(timestamp - leverageItem.timestamp) <= timeWindow) {
            closestCollateralPrice = price
            break
          }
        }

        if (closestCollateralPrice !== undefined) {
          combinedData.push({
            date: new Date(leverageItem.timestamp).toISOString(),
            weethPrice: closestCollateralPrice,
            leverageTokenPrice: leverageItem.equityPerTokenInDebt / Math.pow(10, 18), // Convert from wei to decimal
          })
        }
      })

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
