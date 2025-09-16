import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { fetchClaimableRewards } from '../../leverage-tokens/utils/rewards'
import type { BaseRewardClaimData } from '../../leverage-tokens/utils/rewards/types'
import { portfolioKeys } from '../utils/queryKeys'

export interface RewardsData {
  claimableRewards: BaseRewardClaimData[]
  totalClaimableAmount: string
  tokenCount: number
  hasRewards: boolean
}

/**
 * Hook to fetch portfolio claimable rewards data using TanStack Query
 * Fetches real claimable rewards from all supported reward providers
 */
export function usePortfolioRewards() {
  const { address } = useAccount()

  return useQuery({
    queryKey: portfolioKeys.rewards(address),
    queryFn: async (): Promise<RewardsData> => {
      if (!address) {
        throw new Error('Wallet not connected')
      }

      // const claimableRewards = await fetchClaimableRewards(address)
      const claimableRewards = await fetchClaimableRewards("0x4F2BF7469Bc38d1aE779b1F4affC588f35E60973")

      // Calculate total claimable amount (sum of all rewards)
      const totalClaimableAmount = claimableRewards
        .reduce((total, reward) => {
          return total + BigInt(reward.claimableAmount)
        }, 0n)
        .toString()

      // Get unique token count
      const uniqueTokens = new Set(claimableRewards.map((reward) => reward.tokenAddress))
      const tokenCount = uniqueTokens.size

      return {
        claimableRewards,
        totalClaimableAmount,
        tokenCount,
        hasRewards: claimableRewards.length > 0,
      }
    },
    enabled: !!address, // Only run query when wallet is connected
    staleTime: 1 * 60 * 1000, // 1 minute (rewards can change frequently)
    refetchInterval: 30 * 1000, // 30 seconds (check for new rewards frequently)
    retry: 2, // Retry failed requests twice
  })
}
