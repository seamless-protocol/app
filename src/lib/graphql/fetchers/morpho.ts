import { MORPHO_MARKET_BORROW_RATE_QUERY } from '../queries/morpho'
import type { MorphoMarketBorrowRateResponse } from '../types/morpho'

/**
 * Fetches Morpho market borrow rate data using GraphQL
 */
export async function fetchMorphoMarketBorrowRate(
  uniqueKey: string,
  chainId: number = 8453, // Default to Base
): Promise<MorphoMarketBorrowRateResponse> {
  const MORPHO_GRAPHQL_ENDPOINT = 'https://api.morpho.org/graphql'

  const response = await fetch(MORPHO_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: MORPHO_MARKET_BORROW_RATE_QUERY,
      variables: { uniqueKey, chainId },
    }),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result = await response.json()

  if (result.errors && result.errors.length > 0) {
    throw new Error(
      `GraphQL errors: ${result.errors.map((e: { message: string }) => e.message).join(', ')}`,
    )
  }

  return result.data
}
