import {
  LEVERAGE_TOKEN_PRICE_COMPARISON_QUERY,
  USER_LEVERAGE_TOKEN_POSITION_QUERY,
} from '../queries/leverage-tokens'
import type {
  LeverageTokenPriceComparisonResponse,
  UserLeverageTokenPositionResponse,
} from '../types/leverage-tokens'
import { graphqlRequest } from '../utils'

export async function fetchLeverageTokenPriceComparison(
  address: string,
  chainId: number,
): Promise<LeverageTokenPriceComparisonResponse> {
  const result = await graphqlRequest<LeverageTokenPriceComparisonResponse>(chainId, {
    query: LEVERAGE_TOKEN_PRICE_COMPARISON_QUERY,
    variables: { address: address.toLowerCase(), first: 1000 },
  })

  return result || { leverageToken: null }
}

export async function fetchUserLeverageTokenPosition(params: {
  userAddress: string
  leverageTokenAddress: string
  chainId: number
}): Promise<UserLeverageTokenPositionResponse> {
  const { userAddress, leverageTokenAddress, chainId } = params

  const result = await graphqlRequest<UserLeverageTokenPositionResponse>(chainId, {
    query: USER_LEVERAGE_TOKEN_POSITION_QUERY,
    variables: {
      userAddress: userAddress.toLowerCase(),
      leverageToken: leverageTokenAddress.toLowerCase(),
    },
  })

  return result || { user: null }
}
