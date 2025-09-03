/**
 * GraphQL response types
 */

export interface LeverageTokenHistoricalData {
  equityPerTokenInDebt: string
  timestamp: string
}

export interface LeverageTokenPriceComparisonResponse {
  leverageToken?: {
    stateHistory: LeverageTokenHistoricalData[]
    lendingAdapter: {
      oracle: {
        decimals: number
        priceUpdates: Array<{
          price: string
          timestamp: string
        }>
      }
    }
  } | null
}
