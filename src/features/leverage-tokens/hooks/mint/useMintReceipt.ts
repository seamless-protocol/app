import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { Address } from 'viem'
import { useWaitForTransactionReceipt } from 'wagmi'
import { invalidateLeverageTokenQueries } from '@/features/leverage-tokens/utils/invalidation'
import type { SupportedChainId } from '@/lib/contracts/addresses'

type Params = {
  hash?: `0x${string}`
  chainId: SupportedChainId
  token: Address
  owner?: Address
  includeUser?: boolean
  confirmations?: number
  // Optional side-effects
  onSuccess?: () => void
  onError?: (error: Error) => void
  onFinally?: () => void
  refetchCollateralBalance?: () => void
  refetchLeverageTokenBalance?: () => void
}

export function useMintReceipt({
  hash,
  chainId,
  token,
  owner,
  includeUser = true,
  confirmations = 1,
  onSuccess,
  onError,
  onFinally,
  refetchCollateralBalance,
  refetchLeverageTokenBalance,
}: Params) {
  const queryClient = useQueryClient()

  const receiptQuery = useWaitForTransactionReceipt({
    hash,
    chainId,
    confirmations,
    query: { enabled: Boolean(hash) },
  })

  useEffect(() => {
    if (!hash) return
    if (receiptQuery.isSuccess) {
      void (async () => {
        try {
          await invalidateLeverageTokenQueries(queryClient, {
            token,
            chainId,
            ...(owner ? { owner } : {}),
            includeUser,
            refetchType: 'active',
          })
          refetchCollateralBalance?.()
          refetchLeverageTokenBalance?.()
          onSuccess?.()
        } catch (_) {
          // Non-fatal; still call onSuccess to advance UI
          onSuccess?.()
        } finally {
          onFinally?.()
        }
      })()
    } else if (receiptQuery.isError) {
      const err = receiptQuery.error ?? new Error('Transaction failed or timed out')
      onError?.(err)
      onFinally?.()
    }
  }, [
    hash,
    receiptQuery.isSuccess,
    receiptQuery.isError,
    receiptQuery.error,
    queryClient,
    token,
    chainId,
    owner,
    includeUser,
    refetchCollateralBalance,
    refetchLeverageTokenBalance,
    onSuccess,
    onError,
    onFinally,
  ])

  return receiptQuery
}
