export const LEVERAGE_TOKEN_PRICE_COMPARISON_METADATA_QUERY = `
  query LeverageTokenPriceComparisonMetadata($address: ID!) {
    leverageToken(id: $address) {
      lendingAdapter {
        oracle {
          id
          decimals
        }
      }
    }
  }
`

export const LEVERAGE_TOKEN_PRICE_COMPARISON_QUERY = `
  query LeverageTokenPriceComparison($address: ID!, $oracle: ID!, $first: Int) {
    leverageTokenStateStats_collection(
      interval: hour
      where: { leverageToken: $address }
      orderDirection: desc
      first: $first
    ) {
      lastEquityPerTokenInDebt
      timestamp
    }
    oraclePriceStats_collection(
      interval: hour
      where: { oracle: $oracle }
      orderDirection: desc
      first: $first
    ) {
      lastPrice
      timestamp
    }
  }
`

export const USER_LEVERAGE_TOKEN_POSITION_QUERY = `
  query UserLeverageTokenPosition($userAddress: Bytes!, $leverageToken: Bytes!) {
    user(id: $userAddress) {
      id
      positions(where: { leverageToken: $leverageToken }) {
        id
        balance
        totalEquityDepositedInCollateral
        totalEquityDepositedInDebt
      }
    }
  }
`
