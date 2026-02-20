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
            const [leverageRatios, aprDataResult, borrowApyData, rewardsAPRData] =
              await Promise.allSettled([
                fetchLeverageRatios(tokenAddress, tokenConfig.chainId, config),
                fetchAprForToken(tokenAddress, tokenConfig.chainId),
                fetchBorrowApyForToken(tokenAddress, tokenConfig.chainId, config),
                fetchRewardsAprForToken(tokenAddress, tokenConfig.chainId),
              ])

            const borrowAPY =
              borrowApyData.status === 'fulfilled' ? borrowApyData.value.borrowAPY : 0
            const utilization =
              borrowApyData.status === 'fulfilled' ? borrowApyData.value.utilization : 0
            const targetLeverage =
              leverageRatios.status === 'fulfilled' ? leverageRatios.value.targetLeverage : 0
            const aprData =
              aprDataResult.status === 'fulfilled'
                ? aprDataResult.value
                : { stakingAPR: 0, restakingAPR: 0, averagingPeriod: undefined }

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

            const rewardsAPR =
              rewardsAPRData.status === 'fulfilled' ? rewardsAPRData.value.rewardsAPR : 0
            const rewardTokens =
              rewardsAPRData.status === 'fulfilled' ? rewardsAPRData.value.rewardTokens : undefined

            // Points calculation - use pointsMultiplier from config if available, otherwise default to 0
            const points = tokenConfig.apyConfig?.pointsMultiplier ?? 0

            const totalAPY = stakingYield + restakingYield + rewardsAPR + borrowRate

            // Build metadata for averaging periods
            const metadata: {
              yieldAveragingPeriod?: string
              borrowAveragingPeriod?: string
            } = {}
            if (aprData.averagingPeriod) {
              metadata.yieldAveragingPeriod = aprData.averagingPeriod
            }
            if (borrowApyData.status === 'fulfilled' && borrowApyData.value.averagingPeriod) {
              metadata.borrowAveragingPeriod = borrowApyData.value.averagingPeriod
            }

            // Build base APY breakdown
            const apyBreakdown: APYBreakdownData = {
              stakingYield,
              restakingYield,
              borrowRate,
              rewardsAPR,
              points,
              totalAPY,
              utilization,
              raw: {
                rawBorrowRate: borrowAPY ?? 0,
                rawStakingYield: aprData.stakingAPR ? aprData.stakingAPR / 100 : 0,
                rawRestakingYield: aprData.restakingAPR ? aprData.restakingAPR / 100 : 0,
              },
              errors: {
                stakingYield: aprDataResult.status === 'rejected' ? aprDataResult.reason : null,
                restakingYield: aprDataResult.status === 'rejected' ? aprDataResult.reason : null,
                borrowRate: borrowApyData.status === 'rejected' ? borrowApyData.reason : null,
                rewardsAPR: rewardsAPRData.status === 'rejected' ? rewardsAPRData.reason : null,
                rewardTokens: rewardsAPRData.status === 'rejected' ? rewardsAPRData.reason : null,
              },
              ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
            }

            // Add rewardTokens only if they exist (for exactOptionalPropertyTypes)
            if (rewardTokens && rewardTokens.length > 0) {
              apyBreakdown.rewardTokens = rewardTokens
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

export const hasApyError = (apyData: APYBreakdownData | undefined) => {
  return (
    !!apyData?.errors?.stakingYield ||
    !!apyData?.errors?.restakingYield ||
    !!apyData?.errors?.borrowRate ||
    !!apyData?.errors?.rewardsAPR ||
    !!apyData?.errors?.rewardTokens ||
    !!apyData?.errors?.totalAPY ||
    !!apyData?.errors?.utilization
  )
}
