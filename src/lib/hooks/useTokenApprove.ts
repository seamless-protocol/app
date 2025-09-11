import type { Address } from 'viem'
import { maxUint256, parseUnits } from 'viem'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { TX_SETTINGS } from '@/features/leverage-tokens/utils/constants'
import type { SupportedChainId } from '@/lib/contracts'
import { leverageTokenAbi } from '@/lib/contracts/abis/leverageToken'

export interface UseTokenApproveParams {
  tokenAddress?: Address
  spender?: Address
  amount?: string // Amount in human-readable format (e.g., "100.5")
  decimals?: number // Token decimals
  chainId: number
  enabled?: boolean
  useMaxApproval?: boolean // If true, approves max uint256 instead of specific amount
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
  useMaxApproval = false,
}: UseTokenApproveParams) {
  // Calculate approval amount
  const approvalAmount = useMaxApproval ? maxUint256 : amount ? parseUnits(amount, decimals) : 0n

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

  // Execute approval
  const approve = () => {
    if (!enabled || !tokenAddress || !spender || approvalAmount === 0n) {
      console.warn('useTokenApprove: Missing required parameters for approval')
      return
    }

    writeContract({
      address: tokenAddress,
      abi: leverageTokenAbi,
      functionName: 'approve',
      args: [spender, approvalAmount],
      chainId: chainId as SupportedChainId,
    })
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
    useMaxApproval,
  }
}
