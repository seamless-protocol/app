import type { QueryClient } from '@tanstack/react-query'
import type { Address } from 'viem'

export type RefetchType = 'active' | 'all' | 'none'

export interface InvalidateParams {
  token: Address
  chainId: number
  owner?: Address
  includeUser?: boolean
  refetchType?: RefetchType
}

/**
 * Centralized invalidation for leverage-token-related queries.
 * Defaults to refetchType: 'active' to avoid waking background queries unnecessarily.
 */
export async function invalidateLeverageTokenQueries(
  queryClient: QueryClient,
  { token, owner, includeUser = false, refetchType = 'active' }: InvalidateParams,
): Promise<void> {
  const tasks: Array<Promise<unknown>> = []

  // Reconstruct keys inline to avoid coupling to helper exports at runtime
  // ['leverage-tokens', 'tokens', token, 'state']
  const stateKey = ['leverage-tokens', 'tokens', token, 'state'] as const
  // ['leverage-tokens', 'tokens', token, 'collateral']
  const collateralKey = ['leverage-tokens', 'tokens', token, 'collateral'] as const
  // ['leverage-tokens', 'table-data']
  const tableKey = ['leverage-tokens', 'table-data'] as const
  // ['leverage-tokens', 'protocol-tvl']
  const protocolKey = ['leverage-tokens', 'protocol-tvl'] as const

  tasks.push(queryClient.invalidateQueries({ queryKey: stateKey, refetchType }))
  tasks.push(queryClient.invalidateQueries({ queryKey: collateralKey, refetchType }))
  tasks.push(queryClient.invalidateQueries({ queryKey: tableKey, refetchType }))
  tasks.push(queryClient.invalidateQueries({ queryKey: protocolKey, refetchType }))

  if (includeUser && owner) {
    // ['leverage-tokens', 'tokens', token, 'user', owner]
    const userKey = ['leverage-tokens', 'tokens', token, 'user', owner] as const
    tasks.push(queryClient.invalidateQueries({ queryKey: userKey, refetchType }))
  }

  await Promise.all(tasks)
}
