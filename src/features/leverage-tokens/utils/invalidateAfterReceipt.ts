import type { QueryClient } from '@tanstack/react-query'
import type { Address, Hash, PublicClient } from 'viem'
import { invalidateLeverageTokenQueries } from './invalidation'

export interface InvalidateAfterReceiptParams {
  hash: Hash
  token: Address
  chainId: number
  owner?: Address
  includeUser?: boolean
  confirmations?: number
}

/**
 * Waits for 1 confirmation (default), then invalidates leverage-token queries.
 * This is intended to be used in widget onSuccess callbacks.
 */
export async function invalidateAfterReceipt(
  client: PublicClient,
  qc: QueryClient,
  {
    hash,
    token,
    chainId: _chainId,
    owner,
    includeUser = true,
    confirmations = 1,
  }: InvalidateAfterReceiptParams,
): Promise<void> {
  await client.waitForTransactionReceipt({ hash, confirmations })
  const payload: Parameters<typeof invalidateLeverageTokenQueries>[1] = {
    token,
    chainId: _chainId,
    includeUser,
    refetchType: 'active',
    ...(owner && { owner }),
  }
  await invalidateLeverageTokenQueries(qc, payload)
}
