import {
  LEVERAGE_TOKEN_CAPS_QUERY,
  LEVERAGE_TOKEN_PRICE_COMPARISON_QUERY,
} from '../queries/leverage-tokens'
import type { LeverageTokenCapsResponse, LeverageTokenPriceComparisonResponse } from '../types'
import { graphqlRequest } from '../utils'

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

export async function fetchLeverageTokenCaps(
  chainId: number,
  addresses: Array<string>,
): Promise<Record<string, string>> {
  if (!addresses || addresses.length === 0) return {}

  const ids = addresses.map((a) => a.toLowerCase())
  const data = await graphqlRequest<LeverageTokenCapsResponse>(chainId, {
    query: LEVERAGE_TOKEN_CAPS_QUERY,
    variables: { ids },
  })

  const out: Record<string, string> = {}
  const list = data?.leverageTokens || []
  for (const item of list) {
    if (item?.supplyCap) {
      out[item.id.toLowerCase()] = item.supplyCap
    }
  }
  return out
}
