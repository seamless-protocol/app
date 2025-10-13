export const MORPHO_MARKET_BORROW_RATE_QUERY = `
  query MorphoMarketBorrowRate($uniqueKey: String!, $chainId: Int!) {
    marketByUniqueKey(uniqueKey: $uniqueKey, chainId: $chainId) {
      uniqueKey
      id
      collateralAsset {
        address
        name
      }
      state {
        weeklyBorrowApy
        utilization
      }
    }
  }
`
