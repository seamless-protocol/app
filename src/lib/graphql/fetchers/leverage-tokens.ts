import { LEVERAGE_TOKEN_PRICE_COMPARISON_QUERY } from '../queries/leverage-tokens'
import type { LeverageTokenPriceComparisonResponse } from '../types'
import { graphqlRequest } from '../utils'

export async function fetchLeverageTokenPriceComparison(
  address: string,
  chainId: number,
): Promise<LeverageTokenPriceComparisonResponse> {
  const result = await graphqlRequest<LeverageTokenPriceComparisonResponse>(chainId, {
    query: LEVERAGE_TOKEN_PRICE_COMPARISON_QUERY,
    variables: { address, first: 1000 },
  })

  return result || { leverageToken: null }
}
