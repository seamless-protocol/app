import type { QueryClient } from '@tanstack/react-query'
import type { Address } from 'viem'
import { portfolioKeys } from './queryKeys'

export type RefetchType = 'active' | 'all' | 'none'

export interface InvalidatePortfolioParams {
  address: Address
  refetchType?: RefetchType
  includePerformance?: boolean
  delayMs?: number
}

/**
 * Centralized invalidation for portfolio queries (summary, positions, performance).
 * - Immediately invalidates portfolio queries
 * - Optionally re-invalidates after a delay to catch subgraph indexing
 */
export async function invalidatePortfolioQueries(
  queryClient: QueryClient,
  {
    address,
    refetchType = 'active',
    includePerformance = true,
    delayMs = 10_000,
  }: InvalidatePortfolioParams,
): Promise<void> {
  // Immediate invalidation
  const tasks: Array<Promise<unknown>> = []
  tasks.push(queryClient.invalidateQueries({ queryKey: portfolioKeys.data(address), refetchType }))
  if (includePerformance) {
    // Matches any timeframe/address since we prefix-match on the "performance" segment
    tasks.push(
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'performance'], refetchType }),
    )
  }
  await Promise.all(tasks)

  // Delayed invalidation for subgraph indexing windows
  if (delayMs > 0) {
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.data(address), refetchType })
      if (includePerformance) {
        queryClient.invalidateQueries({ queryKey: ['portfolio', 'performance'], refetchType })
      }
    }, delayMs)
  }
}
