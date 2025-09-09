import { useQuery } from '@tanstack/react-query'
import { formatUnits } from 'viem'
import { useAccount, useChainId } from 'wagmi'
import { CONTRACT_ADDRESSES } from '@/lib/constants'
import { useTokenBalance } from '@/lib/hooks/useTokenBalance'
import { stakingKeys } from '../utils/queryKeys'

export interface StakingUserPosition {
  currentHoldings: {
    amount: string
    usdValue: string
  }
  claimableRewards: {
    amount: string
    description: string
  }
  availableBalance: string
  stakedBalance: string
  hasStakingPosition: boolean
}

/**
 * Hook to fetch user's staking position using TanStack Query
 * Uses real token balance data for staked SEAM holdings
 */
export function useStakingUserPosition() {
  const { address: user } = useAccount()
  const chainId = useChainId()

  // Get user's staked SEAM balance
  const {
    balance: stakedBalance,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
  } = useTokenBalance({
    tokenAddress: CONTRACT_ADDRESSES.STAKED_SEAM,
    userAddress: user,
    chainId,
    enabled: Boolean(user),
  })

  return useQuery({
    queryKey: stakingKeys.userPosition(),
    queryFn: async (): Promise<StakingUserPosition> => {
      // Convert BigInt balance to formatted string (assuming 18 decimals for stkSEAM)
      const formattedBalance = stakedBalance ? formatUnits(stakedBalance, 18) : '0.00'

      return {
        currentHoldings: {
          amount: `${formattedBalance} stkSEAM`,
          usdValue: '$0.00', // TODO: Add USD price calculation
        },
        claimableRewards: {
          amount: '$0.00',
          description: 'Stake SEAM to receive rewards',
        },
        availableBalance: '1250.75', // TODO: Get actual SEAM balance
        stakedBalance: formattedBalance,
        hasStakingPosition: stakedBalance > 0n,
      }
    },
    enabled: !isBalanceLoading && !isBalanceError,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 1 * 60 * 1000, // 1 minute
  })
}
