import { useQuery } from '@tanstack/react-query'
import { mockStakingData } from '../data/mock'
import { portfolioKeys } from '../utils/queryKeys'

export interface StakingData {
  stakedAmount: string
  earnedRewards: string
  apy: string
  hasStakingPosition: boolean
  availableToStake: string
}

/**
 * Hook to fetch SEAM staking data using TanStack Query
 * Currently returns mock data, but can easily be replaced with real API calls
 */
export function usePortfolioStaking() {
  return useQuery({
    queryKey: portfolioKeys.staking(),
    queryFn: async (): Promise<StakingData> => {
      return mockStakingData
    },
    staleTime: 4 * 60 * 1000, // 4 minutes
    refetchInterval: 3 * 60 * 1000, // 3 minutes
  })
}
