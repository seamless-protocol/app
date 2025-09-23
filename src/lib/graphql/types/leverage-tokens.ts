/**
 * Leverage token GraphQL types
 */

export interface LeverageTokenHistoricalData {
  equityPerTokenInDebt: string
  timestamp: string
}

export interface LeverageTokenPriceComparisonResponse {
  leverageToken?: {
    stateHistory: Array<LeverageTokenHistoricalData>
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
