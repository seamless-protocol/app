import { LEVERAGE_TOKEN_PRICE_COMPARISON_QUERY } from '../queries/leverage-tokens'
import { graphqlRequest } from '../utils'
import type { LeverageTokenPriceComparisonResponse } from '../types'

export async function fetchLeverageTokenPriceComparison(
  address: string,
  chainId: number,
): Promise<LeverageTokenPriceComparisonResponse> {
  console.log('🚀 Fetcher called with:', { address, chainId })

  const result = await graphqlRequest<LeverageTokenPriceComparisonResponse>(chainId, {
    query: LEVERAGE_TOKEN_PRICE_COMPARISON_QUERY,
    variables: { address, first: 1000 },
  })

  console.log('📡 GraphQL response:', result)
  return result || { leverageToken: null }
}
