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

      // Combine the data using efficient O(N+M) algorithm
      const combinedData: Array<PriceDataPoint> = []
      const timeWindow = 24 * 60 * 60 * 1000 // 24 hours

      // Use a sliding window approach for O(N+M) performance
      let collateralIndex = 0

      for (const leverageItem of filteredLeverageTokenData) {
        if (!leverageItem) continue

        let closestCollateralPrice: number | undefined
        let closestTimeDiff = Infinity

        // Find the start of the relevant time window for this leverage item
        const windowStart = leverageItem.timestamp - timeWindow
        const windowEnd = leverageItem.timestamp + timeWindow

        // Skip collateral items that are too far behind
        while (collateralIndex < filteredCollateralPriceData.length) {
          const collateralItem = filteredCollateralPriceData[collateralIndex]
          if (!collateralItem) {
            collateralIndex++
            continue
          }
          if (collateralItem.timestamp >= windowStart) break
          collateralIndex++
        }

        // Scan forward through the time window
        let scanIndex = collateralIndex
        while (scanIndex < filteredCollateralPriceData.length) {
          const collateralItem = filteredCollateralPriceData[scanIndex]
          if (!collateralItem) {
            scanIndex++
            continue
          }

          // If we've moved beyond the time window, stop scanning
          if (collateralItem.timestamp > windowEnd) break

          const timeDiff = Math.abs(collateralItem.timestamp - leverageItem.timestamp)
          if (timeDiff < closestTimeDiff) {
            closestCollateralPrice = collateralItem.price
            closestTimeDiff = timeDiff
          }

          scanIndex++
        }

        if (closestCollateralPrice !== undefined) {
          combinedData.push({
            date: new Date(leverageItem.timestamp).toISOString(),
            weethPrice: closestCollateralPrice,
            leverageTokenPrice: leverageItem.equityPerTokenInDebt / 10 ** 18, // Convert from wei to decimal
          })
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
