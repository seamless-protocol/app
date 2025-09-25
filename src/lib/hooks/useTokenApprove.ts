import * as Sentry from '@sentry/react'
import { useState } from 'react'
import type { Address, Hash, PublicClient } from 'viem'
import { parseUnits } from 'viem'
import { usePublicClient, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { TX_SETTINGS } from '@/features/leverage-tokens/utils/constants'
import type { SupportedChainId } from '@/lib/contracts'
import { leverageTokenAbi } from '@/lib/contracts/abis/leverageToken'
import { createLogger } from '@/lib/logger'

const logger = createLogger('useTokenApprove')

export interface UseTokenApproveParams {
  tokenAddress?: Address
  spender?: Address
  amount?: string // Amount in human-readable format (e.g., "100.5")
  decimals?: number // Token decimals
  chainId: number
  enabled?: boolean
  currentAllowance?: bigint
  mode?: 'increase-only' | 'exact'
}

/**
 * Hook for approving ERC20 token spending
 * Uses leverageTokenAbi which includes standard ERC20 functions like approve
 */
export function useTokenApprove({
  tokenAddress,
  spender,
  amount,
  decimals = 18,
  chainId,
  enabled = true,
  currentAllowance,
  mode = 'increase-only',
}: UseTokenApproveParams) {
  // Calculate approval amount
  const approvalAmount = amount ? parseUnits(amount, decimals) : 0n

  const [hash, setHash] = useState<Hash | undefined>(undefined)
  const [localError, setLocalError] = useState<Error | null>(null)
  const [isResetting, setIsResetting] = useState(false)

  const publicClient = usePublicClient({
    chainId: chainId as SupportedChainId,
  }) as PublicClient | undefined

  const requiresExact = mode === 'exact'
  const requiresReset =
    requiresExact &&
    typeof currentAllowance === 'bigint' &&
    currentAllowance > 0n &&
    approvalAmount !== 0n &&
    currentAllowance !== approvalAmount

  // Write contract for approval
  const {
    writeContractAsync,
    isPending: isApproving,
    isError: isApproveError,
    error: approveError,
  } = useWriteContract()

  // Wait for transaction receipt of the final approval
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isApproved,
    isError: isConfirmError,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
    confirmations: TX_SETTINGS.confirmations,
    timeout: TX_SETTINGS.timeout,
  })

  // Execute approval
  const approve = async () => {
    if (!enabled || !tokenAddress || !spender || approvalAmount === 0n) {
      logger.warn('Missing required parameters for approval', {
        enabled,
        tokenAddress,
        spender,
        approvalAmount: approvalAmount.toString(),
        chainId,
      })
      return
    }

    setLocalError(null)
    setHash(undefined)

    try {
      if (requiresReset) {
        if (!publicClient) {
          const error = new Error('Unable to reset allowance without a public client')
          logger.error('Allowance reset failed: missing public client', {
            tokenAddress,
            spender,
            chainId,
          })
          throw error
        }

        setIsResetting(true)

        Sentry.addBreadcrumb({
          message: 'Resetting token allowance to zero',
          category: 'transaction',
          level: 'info',
          data: {
            tokenAddress,
            spender,
            chainId,
          },
        })

        const resetHash = await writeContractAsync({
          address: tokenAddress,
          abi: leverageTokenAbi,
          functionName: 'approve',
          args: [spender, 0n],
          chainId: chainId as SupportedChainId,
        })

        await publicClient.waitForTransactionReceipt({
          hash: resetHash,
          confirmations: TX_SETTINGS.confirmations,
          timeout: TX_SETTINGS.timeout,
        })
      }

      // Track approval attempt
      Sentry.addBreadcrumb({
        message: 'Token approval initiated',
        category: 'transaction',
        level: 'info',
        data: {
          tokenAddress,
          spender,
          approvalAmount: approvalAmount.toString(),
          chainId,
        },
      })

      const approvalHash = await writeContractAsync({
        address: tokenAddress,
        abi: leverageTokenAbi,
        functionName: 'approve',
        args: [spender, approvalAmount],
        chainId: chainId as SupportedChainId,
      })

      setHash(approvalHash)
      return approvalHash
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown approval error')
      setLocalError(err)
      Sentry.captureException(err, {
        contexts: {
          approval: {
            tokenAddress,
            spender,
            approvalAmount: approvalAmount.toString(),
            chainId,
            requiresReset,
          },
        },
      })
      logger.error('Token approval failed', {
        error: err,
        tokenAddress,
        spender,
        approvalAmount: approvalAmount.toString(),
        chainId,
        requiresReset,
      })
      throw err
    } finally {
      if (requiresReset) {
        setIsResetting(false)
      }
    }
  }

  return {
    // Actions
    approve,

    // Transaction state
    hash,
    receipt,

    // Loading states
    isApproving,
    isConfirming,
    isPending: isApproving || isConfirming || isResetting,

    // Success state
    isApproved,

    // Error states
    isError: Boolean(localError) || isApproveError || isConfirmError,
    error: localError || approveError || confirmError,

    // Approval details
    approvalAmount,
  }
}
