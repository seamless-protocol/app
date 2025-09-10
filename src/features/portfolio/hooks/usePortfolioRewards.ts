import { useQuery } from '@tanstack/react-query'
import { mockRewardsData } from '../data/mock'
import { portfolioKeys } from '../utils/queryKeys'

export interface RewardsData {
  accruingAmount: string
  seamToken: string
  protocolFees: string
  tokenAddresses: Array<string>
}

/**
 * Hook to fetch portfolio rewards data using TanStack Query
 * Currently returns mock data, but can easily be replaced with real API calls
 */
export function usePortfolioRewards() {
  return useQuery({
    queryKey: portfolioKeys.rewards(),
    queryFn: async (): Promise<RewardsData> => {
      return mockRewardsData
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    refetchInterval: 2 * 60 * 1000, // 2 minutes
  })
}
