/**
 * GraphQL response types
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

export interface MorphoMarketData {
  uniqueKey: string
  id: string
  collateralAsset: {
    address: string
    name: string
  }
  state: {
    borrowApy: number
  }
}

export interface MorphoMarketBorrowRateResponse {
  marketByUniqueKey?: MorphoMarketData | null
}
