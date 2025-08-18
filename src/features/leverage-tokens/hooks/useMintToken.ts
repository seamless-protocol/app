import { useMutation, useQueryClient } from '@tanstack/react-query'
import { simulateContract, waitForTransactionReceipt, writeContract } from '@wagmi/core'
import type { Address } from 'viem'
import { useAccount, useChainId } from 'wagmi'
import { config } from '@/lib/config/wagmi.config'
import { leverageTokenAbi } from '@/lib/contracts/generated'
import { TX_SETTINGS } from '../utils/constants'
import { classifyError, isActionableError } from '../utils/errors'
import { ltKeys } from '../utils/queryKeys'

export interface UseMintTokenParams {
  token: Address
  onSuccess?: (hash: Address) => void
  onError?: (error: unknown) => void
}

/**
 * Hook to mint leverage tokens
 * Follows the pattern: simulate → write → wait for receipt
 * No optimistic updates - waits for confirmation before updating UI
 */
export function useMintToken({ token, onSuccess, onError }: UseMintTokenParams) {
  const queryClient = useQueryClient()
  const { address: owner } = useAccount()
  const chainId = useChainId()

  return useMutation({
    mutationKey: [...ltKeys.token(token), 'mint', owner],

    mutationFn: async (amount: bigint) => {
      if (!owner) {
        throw new Error('WALLET_NOT_CONNECTED: Please connect your wallet before minting tokens')
      }

      // Step 1: Simulate the transaction
      const { request } = await simulateContract(config, {
        address: token,
        abi: leverageTokenAbi,
        functionName: 'mint',
        args: [owner, amount],
        account: owner,
      })

      // Step 2: Write the transaction
      const hash = await writeContract(config, request)

      // Step 3: Wait for confirmation
      const receipt = await waitForTransactionReceipt(config, {
        hash,
        confirmations: TX_SETTINGS.confirmations,
      })

      return { hash, receipt }
    },

    onSuccess: ({ hash }) => {
      // Invalidate relevant queries after confirmation
      if (owner) {
        queryClient.invalidateQueries({ queryKey: ltKeys.user(token, owner) })
        queryClient.invalidateQueries({ queryKey: ['portfolio', owner] })
      }
      queryClient.invalidateQueries({ queryKey: ltKeys.supply(token) })

      onSuccess?.(hash)
    },

    onError: (error) => {
      const classifiedError = classifyError(error)

      // Only send actionable errors to monitoring
      if (isActionableError(classifiedError)) {
        // This is where we'd send to Sentry
        console.error('[Mint Error]', {
          type: classifiedError.type,
          chainId,
          token,
          error: classifiedError,
        })
      }

      onError?.(classifiedError)
    },
  })
}
