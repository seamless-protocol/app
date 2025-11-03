import { z } from 'zod'
import { createLogger } from '@/lib/logger'
import { MORPHO_MARKET_BORROW_RATE_QUERY } from '../queries/morpho'

const logger = createLogger('morpho-fetcher')

// Zod schema for runtime validation of Morpho GraphQL response
const MorphoMarketStateSchema = z.object({
  dailyBorrowApy: z.number().nullable(),
  utilization: z.number(),
})

const MorphoMarketDataSchema = z.object({
  uniqueKey: z.string(),
  id: z.string(),
  collateralAsset: z.object({
    address: z.string(),
    name: z.string(),
  }),
  state: MorphoMarketStateSchema,
})

const MorphoResponseSchema = z.object({
  marketByUniqueKey: MorphoMarketDataSchema.nullable().optional(),
})

/**
 * Fetches Morpho market borrow rate data using GraphQL
 */
export async function fetchMorphoMarketBorrowRate(
  uniqueKey: string,
  chainId: number = 8453, // Default to Base
): Promise<z.infer<typeof MorphoResponseSchema>> {
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

  // Validate response shape with Zod to catch bad data early
  try {
    const validated = MorphoResponseSchema.parse(result.data)
    return validated
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Log validation error with response snippet for debugging
      const responseSnippet = JSON.stringify(result.data).slice(0, 500)
      logger.error('Morpho API response validation failed', {
        uniqueKey,
        chainId,
        validationErrors: error.issues,
        responseSnippet,
      })
      throw new Error(
        `Invalid Morpho API response: ${error.issues.map((e: z.ZodIssue) => e.message).join(', ')}`,
      )
    }
    throw error
  }
}
