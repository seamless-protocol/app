/**
 * Portfolio performance GraphQL types
 */

export interface LeverageTokenState {
  id: string
  leverageToken: string
  collateralRatio: string
  totalCollateral: string
  totalDebt: string
  totalEquityInCollateral: string
  totalEquityInDebt: string
  totalSupply: string
  equityPerTokenInCollateral: string
  equityPerTokenInDebt: string
  timestamp: string
  blockNumber: string
}

export interface UserPosition {
  id: string
  leverageToken: {
    id: string
    collateralRatio: string
    totalCollateral: string
    totalSupply: string
    lendingAdapter: {
      collateralAsset: string
      debtAsset: string
      oracle: {
        id: string
        price: string
        decimals: number
      }
    }
  }
  balance: string
  totalEquityDepositedInCollateral: string
  totalEquityDepositedInDebt: string
}

export interface User {
  id: string
  positions: Array<UserPosition>
}

export interface UserPositionsResponse {
  user?: User | null
}

export interface LeverageTokenStateHistoryResponse {
  leverageToken?: {
    id: string
    stateHistory: Array<LeverageTokenState>
  } | null
}

export interface BalanceChange {
  id: string
  position: {
    id: string
    leverageToken: {
      id: string
    }
  }
  timestamp: string
  amount: string
}

export interface BalanceHistoryResponse {
  leverageTokenBalanceChanges: Array<BalanceChange>
}
