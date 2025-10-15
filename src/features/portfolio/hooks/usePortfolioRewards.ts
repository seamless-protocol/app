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

      // Convert the final total to human-readable format using real token prices
      const totalClaimableAmountHuman = claimableRewards.reduce((total, reward) => {
        const rawAmount = BigInt(reward.claimableAmount)
        const decimals = reward.tokenDecimals
        const divisor = BigInt(10 ** decimals)
        const humanReadableAmount = Number(rawAmount) / Number(divisor)

        // Get token price from metadata (if available) or use $1.00 as fallback
        const tokenPrice = reward.metadata?.tokenPrice || 1.0
        const usdValue = humanReadableAmount * tokenPrice

        return total + usdValue
      }, 0)

      // Format with 3 significant digits
      const formatToSignificantDigits = (value: number): string => {
        if (value === 0) return '$0.00'

        // Convert to scientific notation to get the exponent
        const exp = Math.floor(Math.log10(Math.abs(value)))
        const significantDigits = 3
        const multiplier = 10 ** (significantDigits - 1 - exp)
        const rounded = Math.round(value * multiplier) / multiplier

        // Format with appropriate decimal places
        if (exp >= 0) {
          return `$${rounded.toFixed(2)}`
        } else if (exp >= -2) {
          return `$${rounded.toFixed(4)}`
        } else if (exp >= -4) {
          return `$${rounded.toFixed(6)}`
        } else {
          return `$${rounded.toExponential(2)}`
        }
      }

      const formattedAmount = formatToSignificantDigits(totalClaimableAmountHuman)

      const totalClaimedAmount = claimableRewards
        .reduce((total, reward) => {
          const claimedAmount = reward.metadata?.claimedAmount || '0'
          return total + BigInt(claimedAmount)
        }, 0n)
        .toString()

      const totalEarnedAmount = claimableRewards
        .reduce((total, reward) => {
          const totalAmount = reward.metadata?.totalAmount || '0'
          return total + BigInt(totalAmount)
        }, 0n)
        .toString()

      // Get unique token count
      const uniqueTokens = new Set(claimableRewards.map((reward) => reward.tokenAddress))
      const tokenCount = uniqueTokens.size

      // Count rewards by type
      const claimableCount = claimableRewards.filter(
        (reward) => reward.metadata?.hasClaimable === true,
      ).length

      const claimedCount = claimableRewards.filter(
        (reward) => reward.metadata?.hasClaimed === true,
      ).length

      return {
        claimableRewards,
        totalClaimableAmount: formattedAmount,
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
