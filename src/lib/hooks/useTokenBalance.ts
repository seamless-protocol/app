import { type Address, erc20Abi, zeroAddress } from 'viem'
import { useReadContract } from 'wagmi'
import { STALE_TIME } from '@/features/leverage-tokens/utils/constants'
import type { SupportedChainId } from '@/lib/contracts'

export interface UseTokenBalanceParams {
  tokenAddress?: Address
  userAddress?: Address
  chainId: SupportedChainId
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
    data: balance,
    isLoading,
    isError,
    error,
    refetch,
  } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [userAddress ?? zeroAddress],
    chainId,
    query: {
      enabled: enabled && Boolean(tokenAddress && userAddress),
      staleTime: STALE_TIME.supply,
      refetchInterval: 30_000,
      retry: false,
    },
  })

  return { balance: balance ?? 0n, isLoading, isError, error, refetch }
}
