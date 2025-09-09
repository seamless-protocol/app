import { useQuery } from '@tanstack/react-query'
import { stakingMockData } from '../data/mockData'
import { stakingKeys } from '../utils/queryKeys'

export interface StakingStats {
  currentHoldings: {
    amount: string
    usdValue: string
  }
  claimableRewards: {
    amount: string
    description: string
  }
  keyMetrics: {
    totalStaked: {
      amount: string
      usdValue: string
    }
    totalAPR: {
      percentage: string
      description: string
    }
    unstakingCooldown: {
      days: string
      description: string
    }
  }
}

/**
 * Hook to fetch staking statistics using TanStack Query
 * Currently returns mock data, but can easily be replaced with real API calls
 * Based on the pattern from .sources StakingStats component
 */
export function useStakingStats() {
  return useQuery({
    queryKey: stakingKeys.stats(),
    queryFn: async (): Promise<StakingStats> => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 350))

      return stakingMockData
    },
    staleTime: 4 * 60 * 1000, // 4 minutes
    refetchInterval: 3 * 60 * 1000, // 3 minutes
  })
}

/**
 * Hook to fetch total staked assets (similar to useFormattedTotalAssetsUSDValue)
 * Currently returns mock data
 */
export function useStakingTotalAssets() {
  return useQuery({
    queryKey: stakingKeys.stats(),
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 200))

      return {
        totalAssets: {
          value: "3.70M",
          symbol: "SEAM",
          decimals: 18
        },
        totalAssetsUSD: {
          value: "7.96M",
          symbol: "USD",
          decimals: 2
        }
      }
    },
    staleTime: 4 * 60 * 1000, // 4 minutes
    refetchInterval: 3 * 60 * 1000, // 3 minutes
  })
}

/**
 * Hook to fetch staking rewards data (similar to useFetchViewAssetsRewardsData)
 * Currently returns mock data
 */
export function useStakingRewardsData() {
  return useQuery({
    queryKey: stakingKeys.rewards(),
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 250))

      return {
        totalApr: {
          value: "35.72",
          symbol: "%",
          decimals: 2
        },
        claimableRewards: {
          value: "0.00",
          symbol: "USD",
          decimals: 2
        }
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 1 * 60 * 1000, // 1 minute
  })
}
