/**
 * GraphQL queries for portfolio performance data
 */

// Query to get user positions across all leverage tokens
export const USER_POSITIONS_QUERY = `
  query GetUserPositions($userAddress: Bytes!) {
    user(id: $userAddress) {
      id
      positions {
        id
        leverageToken {
          id
          collateralRatio
          totalCollateral
          totalSupply
          lendingAdapter {
            collateralAsset
            debtAsset
            oracle {
              id
              price
              decimals
            }
          }
        }
        balance
        totalEquityDepositedInCollateral
        totalEquityDepositedInDebt
      }
    }
  }
`

// Query to get leverage token state history for portfolio value calculation
export const LEVERAGE_TOKEN_STATE_HISTORY_QUERY = `
  query GetLeverageTokenStateHistory($leverageTokenAddress: Bytes!, $first: Int, $skip: Int) {
    leverageToken(id: $leverageTokenAddress) {
      id
      stateHistory(
        orderBy: timestamp
        orderDirection: desc
        first: $first
        skip: $skip
      ) {
        id
        leverageToken
        collateralRatio
        totalCollateral
        totalDebt
        totalEquityInCollateral
        totalEquityInDebt
        totalSupply
        equityPerTokenInCollateral
        equityPerTokenInDebt
        timestamp
        blockNumber
      }
    }
  }
`

// Query to get user's balance history across leverage tokens on a chain
export const BALANCE_HISTORY_QUERY = `
  query BalanceHistoryForUser(
    $user: Bytes!
    $tokens: [Bytes!]
    $from: BigInt
    $to: BigInt
    $first: Int
    $skip: Int
  ) {
    leverageTokenBalanceChanges(
      where: {
        position_: { user: $user, leverageToken_in: $tokens }
        timestamp_gte: $from
        timestamp_lte: $to
      }
      orderBy: timestamp
      orderDirection: asc
      first: $first
      skip: $skip
    ) {
      id
      position {
        id
        leverageToken {
          id
        }
      }
      timestamp
      amount
    }
  }
`
