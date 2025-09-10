import { useQuery } from '@tanstack/react-query'
import { stakingKeys } from '../utils/queryKeys'

export interface StakingProtocolStats {
  totalStakedAmount: string
  totalStakedUsdValue: string
  totalAPR: string
  unstakingCooldown: string
}

/**
 * Hook to fetch protocol-wide staking statistics
 * Returns mock data for protocol-level metrics
 */
export function useStakingProtocolStats() {
  return useQuery({
    queryKey: stakingKeys.stats(),
    queryFn: async (): Promise<StakingProtocolStats> => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 350))

      return {
        totalStakedAmount: '3.70M SEAM (todo)',
        totalStakedUsdValue: '$7.96M (todo)',
        totalAPR: '35.72% (todo)',
        unstakingCooldown: '7 days (todo)',
      }
    },
    staleTime: 4 * 60 * 1000, // 4 minutes
    refetchInterval: 3 * 60 * 1000, // 3 minutes
  })
}
