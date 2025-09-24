export const LEVERAGE_TOKEN_PRICE_COMPARISON_QUERY = `
  query LeverageTokenPriceComparison($address: ID!, $first: Int) {
    leverageToken(id: $address) {
      stateHistory(orderBy: timestamp, orderDirection: desc, first: $first) {
        equityPerTokenInDebt
        timestamp
      }
      lendingAdapter {
        oracle {
          decimals
          priceUpdates(orderBy: timestamp, orderDirection: desc, first: $first) {
            price
            timestamp
          }
        }
      }
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
