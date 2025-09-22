/**
 * Morpho GraphQL types
 */

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
