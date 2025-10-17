import * as Sentry from '@sentry/react'
import { useEffect } from 'react'
import type { Address } from 'viem'
import { parseUnits } from 'viem'
import { useChainId, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { TX_SETTINGS } from '@/features/leverage-tokens/utils/constants'
import { classifyError, isActionableError } from '@/features/leverage-tokens/utils/errors'
import { leverageTokenAbi } from '@/lib/contracts/abis/leverageToken'
import { createLogger } from '@/lib/logger'
import { captureApprovalError } from '@/lib/observability/sentry'

const logger = createLogger('useTokenApprove')

export interface UseTokenApproveParams {
  tokenAddress?: Address
  spender?: Address
  amount?: string // Amount in human-readable format (e.g., "100.5")
  decimals?: number // Token decimals
  targetChainId: number
  enabled?: boolean
  flow?: 'mint' | 'redeem'
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
  targetChainId,
  enabled = true,
  flow,
}: UseTokenApproveParams) {
  const activeChainId = useChainId()
  const { switchChain } = useSwitchChain()

  // Calculate approval amount
  const approvalAmount = amount ? parseUnits(amount, decimals) : 0n

  // Write contract for approval
  const {
    writeContract,
    data: hash,
    isPending: isApproving,
    isError: isApproveError,
    error: approveError,
  } = useWriteContract()

  // Wait for transaction receipt
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

  // Capture approval errors (submit failures or on-chain reverts)
  useEffect(() => {
    const actionable = (e: unknown) => isActionableError(classifyError(e))
    if (isApproveError && approveError && actionable(approveError)) {
      captureApprovalError({
        ...(flow ? { flow } : {}),
        chainId: targetChainId,
        token: tokenAddress || 'unknown',
        ...(spender ? { spender } : {}),
        ...(amount ? { amount } : {}),
        error: approveError,
      })
    }
    if (isConfirmError && confirmError && actionable(confirmError)) {
      captureApprovalError({
        ...(flow ? { flow } : {}),
        chainId: targetChainId,
        token: tokenAddress || 'unknown',
        ...(spender ? { spender } : {}),
        ...(amount ? { amount } : {}),
        ...(hash ? { txHash: hash } : {}),
        error: confirmError,
      })
    }
  }, [
    isApproveError,
    approveError,
    isConfirmError,
    confirmError,
    flow,
    targetChainId,
    tokenAddress,
    spender,
    amount,
    hash,
  ])

  // Execute approval
  const approve = () => {
    if (!enabled || !tokenAddress || !spender || approvalAmount === 0n) {
      logger.warn('Missing required parameters for approval', {
        enabled,
        tokenAddress,
        spender,
        approvalAmount: approvalAmount.toString(),
        targetChainId,
      })
      return
    }

    // switch chains if needed
    if (targetChainId !== activeChainId) {
      switchChain({ chainId: targetChainId })
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
        targetChainId,
      },
    })

    try {
      writeContract({
        address: tokenAddress,
        abi: leverageTokenAbi,
        functionName: 'approve',
        args: [spender, approvalAmount],
        chainId: targetChainId,
      })
    } catch (error) {
      const err = classifyError(error)
      if (isActionableError(err)) {
        captureApprovalError({
          ...(flow ? { flow } : {}),
          chainId: targetChainId,
          token: tokenAddress,
          ...(spender ? { spender } : {}),
          ...(amount ? { amount } : {}),
          error,
        })
      }
      throw error
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
    isPending: isApproving || isConfirming,

    // Success state
    isApproved,

    // Error states
    isError: isApproveError || isConfirmError,
    error: approveError || confirmError,

    // Approval details
    approvalAmount,
  }
}
