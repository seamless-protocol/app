import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { fetchClaimableRewards } from '../../leverage-tokens/utils/rewards'
import type { BaseRewardClaimData } from '../../leverage-tokens/utils/rewards/types'
import { portfolioKeys } from '../utils/queryKeys'

export interface RewardsData {
  claimableRewards: Array<BaseRewardClaimData>
  totalClaimableAmount: string
  totalClaimedAmount: string
  totalEarnedAmount: string
  tokenCount: number
  claimableCount: number
  claimedCount: number
  hasRewards: boolean
  hasClaimableRewards: boolean
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

      // Test account: 0x4F2BF7469Bc38d1aE779b1F4affC588f35E60973
      const claimableRewards = await fetchClaimableRewards(address)

      // Calculate totals for UI display
      const totalClaimableAmount = claimableRewards
        .reduce((total, reward) => {
          return total + BigInt(reward.claimableAmount)
        }, 0n)
        .toString()

      const totalClaimedAmount = claimableRewards
        .reduce((total, reward) => {
          const claimedAmount = (reward.metadata?.['claimedAmount'] as string) || '0'
          return total + BigInt(claimedAmount)
        }, 0n)
        .toString()

      const totalEarnedAmount = claimableRewards
        .reduce((total, reward) => {
          const totalAmount = (reward.metadata?.['totalAmount'] as string) || '0'
          return total + BigInt(totalAmount)
        }, 0n)
        .toString()

      // Get unique token count
      const uniqueTokens = new Set(claimableRewards.map((reward) => reward.tokenAddress))
      const tokenCount = uniqueTokens.size

      // Count rewards by type
      const claimableCount = claimableRewards.filter(
        (reward) => reward.metadata?.['hasClaimable'] === true,
      ).length

      const claimedCount = claimableRewards.filter(
        (reward) => reward.metadata?.['hasClaimed'] === true,
      ).length

      return {
        claimableRewards,
        totalClaimableAmount,
        totalClaimedAmount,
        totalEarnedAmount,
        tokenCount,
        claimableCount,
        claimedCount,
        hasRewards: claimableRewards.length > 0,
        hasClaimableRewards: claimableCount > 0,
      }
    },
    enabled: !!address, // Only run query when wallet is connected
    staleTime: 1 * 60 * 1000, // 1 minute (rewards can change frequently)
    refetchInterval: 30 * 1000, // 30 seconds (check for new rewards frequently)
    retry: 2, // Retry failed requests twice
  })
}
