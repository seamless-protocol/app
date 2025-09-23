import { useQuery } from '@tanstack/react-query'
import { useConfig } from 'wagmi'
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
            // Import the APY calculation functions
            const { fetchAprForToken } = await import(
              '@/features/leverage-tokens/utils/apy-calculations/apr-providers'
            )
            const { fetchBorrowApyForToken } = await import(
              '@/features/leverage-tokens/utils/apy-calculations/borrow-apy-providers'
            )
            const { fetchLeverageRatios } = await import(
              '@/features/leverage-tokens/utils/apy-calculations/leverage-ratios'
            )
            const { fetchRewardsAprForToken } = await import(
              '@/features/leverage-tokens/utils/apy-calculations/rewards-providers'
            )
            const { leverageTokenConfigs } = await import(
              '@/features/leverage-tokens/leverageTokens.config'
            )

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
            console.warn(`Failed to calculate APY for token ${tokenId}:`, error)
            if (!tokenId) {
              throw new Error(`No valid token ID found for token: ${JSON.stringify(token)}`)
            }
            return { tokenId, apyData: null }
          }
        })

      const results = await Promise.allSettled(apyPromises)

      // Process results
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.apyData) {
          apyDataMap.set(result.value.tokenId, result.value.apyData)
        }
      })

      return apyDataMap
    },
    enabled: enabled && tokens.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}

// Backward compatibility export
export const usePositionsAPY = useTokensAPY
