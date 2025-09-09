import { useQuery } from '@tanstack/react-query'
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
 * Currently returns mock data, but can easily be replaced with real API calls
 */
export function useStakingUserPosition() {
  return useQuery({
    queryKey: stakingKeys.userPosition(),
    queryFn: async (): Promise<StakingUserPosition> => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 200))

      return {
        currentHoldings: {
          amount: "0.00 stkSEAM",
          usdValue: "$0.00"
        },
        claimableRewards: {
          amount: "$0.00",
          description: "Stake SEAM to receive rewards"
        },
        availableBalance: "1250.75",
        stakedBalance: "500.25",
        hasStakingPosition: false
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 1 * 60 * 1000, // 1 minute
  })
}
