import type { Address } from 'viem'
import { useReadContracts } from 'wagmi'
import { STALE_TIME } from '@/features/leverage-tokens/utils/constants'
import type { SupportedChainId } from '@/lib/contracts'
import { leverageTokenAbi } from '@/lib/contracts/abis/leverageToken'

export interface UseTokenAllowanceParams {
  tokenAddress?: Address
  owner?: Address
  spender?: Address
  chainId: number
  enabled?: boolean
}

/**
 * General hook for reading ERC20 token allowances
 * Uses leverageTokenAbi which includes standard ERC20 functions like allowance
 */
export function useTokenAllowance({
  tokenAddress,
  owner,
  spender,
  chainId,
  enabled = true,
}: UseTokenAllowanceParams) {
  const {
    data: allowanceData,
    isLoading,
    isError,
    error,
  } = useReadContracts({
    contracts:
      enabled && tokenAddress && owner && spender
        ? [
            {
              address: tokenAddress,
              abi: leverageTokenAbi,
              functionName: 'allowance' as const,
              args: [owner, spender],
              chainId: chainId as SupportedChainId,
            },
          ]
        : [],
    query: {
      enabled: enabled && Boolean(tokenAddress && owner && spender),
      staleTime: STALE_TIME.supply,
      refetchInterval: 30_000,
    },
  })

  const allowance = allowanceData?.[0]?.status === 'success' ? (allowanceData[0].result as bigint) : 0n

  return {
    allowance,
    isLoading,
    isError,
    error,
  }
}
