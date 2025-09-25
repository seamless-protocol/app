import { useQuery } from '@tanstack/react-query'
import { useConfig } from 'wagmi'
import { createLogger } from '@/lib/logger'

const logger = createLogger('positions-apy')

import type { APYBreakdownData } from '@/components/APYBreakdown'
import type { LeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { portfolioKeys } from '../utils/queryKeys'

// Generic token interface that can represent either a Position or a LeverageTokenConfig
interface TokenWithAddress {
  id?: string // For positions
  address?: string // Token address (for leverage token configs)
  name: string
  type?: 'vault' | 'leverage-token' // For positions
  leverageTokenAddress?: string // For positions
  collateralAsset?: { symbol: string; name: string } // For positions
  debtAsset?: { symbol: string; name: string } // For positions
  chainId?: number // For leverage token configs
}

interface UseTokensAPYOptions {
  tokens: Array<TokenWithAddress>
  enabled?: boolean
}

/**
 * Hook to calculate APY data for any array of tokens (positions, leverage tokens, etc.)
 * This is the single source of truth for all APY calculations in the app
 */
export function useTokensAPY({ tokens, enabled = true }: UseTokensAPYOptions) {
  const config = useConfig()

  return useQuery({
    queryKey: portfolioKeys.positionsAPY(tokens),
    queryFn: async (): Promise<Map<string, APYBreakdownData>> => {
      const apyDataMap = new Map<string, APYBreakdownData>()

      // Import APY calculation functions once (not per token)
      const [
        { fetchAprForToken },
        { fetchBorrowApyForToken },
        { fetchLeverageRatios },
        { fetchRewardsAprForToken },
        { leverageTokenConfigs },
      ] = await Promise.all([
        import('@/features/leverage-tokens/utils/apy-calculations/apr-providers'),
        import('@/features/leverage-tokens/utils/apy-calculations/borrow-apy-providers'),
        import('@/features/leverage-tokens/utils/apy-calculations/leverage-ratios'),
        import('@/features/leverage-tokens/utils/apy-calculations/rewards-providers'),
        import('@/features/leverage-tokens/leverageTokens.config'),
      ])

      // For each token, fetch APY data
      const apyPromises = tokens
        .filter((token) => {
          // Filter for leverage tokens - either from positions or direct leverage token configs
          const isLeverageToken = token.type === 'leverage-token' || token.chainId
          const hasAddress = token.address || token.leverageTokenAddress
          return isLeverageToken && hasAddress
        })
        .map(async (token) => {
          try {
            // Get token address - either from leverageTokenAddress (positions) or address (configs)
            const tokenAddress = (token.leverageTokenAddress || token.address) as `0x${string}`

            // Get token config - either from leverageTokenConfigs or use the token itself if it's a config
            let tokenConfig = Object.values(leverageTokenConfigs).find(
              (config) => config.address.toLowerCase() === tokenAddress.toLowerCase(),
            )

            // If no config found and token has chainId, it might be a leverage token config itself
            if (!tokenConfig && token.chainId) {
              tokenConfig = token as LeverageTokenConfig
            }

            if (!tokenConfig) {
              return { tokenId: token.id || token.address, apyData: null }
            }

            // Fetch all required data in parallel
            const [leverageRatios, aprData, borrowApyData, rewardsAPRData] = await Promise.all([
              fetchLeverageRatios(tokenAddress, tokenConfig.chainId, config),
              fetchAprForToken(tokenAddress, tokenConfig.chainId),
              fetchBorrowApyForToken(tokenAddress, tokenConfig.chainId, config),
              fetchRewardsAprForToken(tokenAddress, tokenConfig.chainId),
            ])

            const borrowAPY = borrowApyData.borrowAPY
            const targetLeverage = leverageRatios.targetLeverage

            // Calculate APY components
            const stakingYield =
              (aprData.stakingAPR && targetLeverage
                ? (aprData.stakingAPR / 100) * targetLeverage
                : undefined) ?? 0

            const restakingYield =
              (aprData.restakingAPR && targetLeverage
                ? (aprData.restakingAPR / 100) * targetLeverage
                : undefined) ?? 0

            const borrowRate =
              (borrowAPY && targetLeverage ? borrowAPY * -1 * (targetLeverage - 1) : undefined) ?? 0

            const rewardsAPR = rewardsAPRData?.rewardsAPR ?? 0
            const points = (targetLeverage ? targetLeverage * 2 : undefined) ?? 0

            const totalAPY = stakingYield + restakingYield + rewardsAPR + borrowRate

            const apyBreakdown: APYBreakdownData = {
              stakingYield,
              restakingYield,
              borrowRate,
              rewardsAPR,
              points,
              totalAPY,
            }

            const tokenId = token.id || token.address || token.leverageTokenAddress
            if (!tokenId) {
              throw new Error(`No valid token ID found for token: ${JSON.stringify(token)}`)
            }
            return { tokenId, apyData: apyBreakdown }
          } catch (error) {
            const tokenId = token.id || token.address || token.leverageTokenAddress
            logger.error('Failed to calculate APY for token', { tokenId, error })
            // Re-throw the error so Sentry can catch it
            throw error
          }
        })

      const results = await Promise.allSettled(apyPromises)

      // Process results and track failures
      let hasFailures = false
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.apyData) {
          apyDataMap.set(result.value.tokenId, result.value.apyData)
        } else if (result.status === 'rejected') {
          hasFailures = true
        }
      })

      // If all APY calculations failed, throw an error
      if (hasFailures && apyDataMap.size === 0) {
        throw new Error('All APY calculations failed')
      }

      return apyDataMap
    },
    enabled: enabled && tokens.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Only retry on network errors, not on business logic errors
      if (failureCount >= 2) return false
      if (error instanceof Error && error.message.includes('network')) return true
      return false
    },
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}

// Backward compatibility export
export const usePositionsAPY = useTokensAPY
