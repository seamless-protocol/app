import type { Address } from 'viem'
import { useReadContracts } from 'wagmi'
import { STALE_TIME } from '@/features/leverage-tokens/utils/constants'
import type { SupportedChainId } from '@/lib/contracts'
import { leverageTokenAbi } from '@/lib/contracts'

export interface UseTokenBalanceParams {
  tokenAddress?: Address
  userAddress?: Address
  chainId: number
  enabled?: boolean
}

/**
 * General hook for reading ERC20 token balances
 * Uses leverageTokenAbi which includes standard ERC20 functions like balanceOf
 */
export function useTokenBalance({
  tokenAddress,
  userAddress,
  chainId,
  enabled = true,
}: UseTokenBalanceParams) {
  const {
    data: balanceData,
    isLoading,
    isError,
    error,
    refetch,
  } = useReadContracts({
    contracts:
      enabled && tokenAddress && userAddress
        ? [
            {
              address: tokenAddress,
              abi: leverageTokenAbi,
              functionName: 'balanceOf' as const,
              args: [userAddress],
              chainId: chainId as SupportedChainId,
            },
          ]
        : [],
    query: {
      enabled: enabled && Boolean(tokenAddress && userAddress),
      staleTime: STALE_TIME.supply,
      refetchInterval: 30_000,
    },
  })

  const balance = balanceData?.[0]?.status === 'success' ? (balanceData[0].result as bigint) : 0n

  return {
    balance,
    isLoading,
    isError,
    error,
    refetch,
  }
}
