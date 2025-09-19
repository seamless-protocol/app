import { useQuery } from '@tanstack/react-query'
import { useConfig } from 'wagmi'
import type { APYBreakdownData } from '@/components/APYBreakdown'
import type { Position } from '../components/active-positions'
import { portfolioKeys } from '../utils/queryKeys'

interface UsePositionsAPYOptions {
  positions: Array<Position>
  enabled?: boolean
}

/**
 * Hook to calculate APY data for all positions in the portfolio
 */
export function usePositionsAPY({ positions, enabled = true }: UsePositionsAPYOptions) {
  const config = useConfig()

  return useQuery({
    queryKey: portfolioKeys.positionsAPY(positions),
    queryFn: async (): Promise<Map<string, APYBreakdownData>> => {
      const apyDataMap = new Map<string, APYBreakdownData>()

      // For each position, fetch APY data
      const apyPromises = positions
        .filter((position) => position.leverageTokenAddress && position.type === 'leverage-token')
        .map(async (position) => {
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

            const tokenAddress = position.leverageTokenAddress as `0x${string}`
            const tokenConfig = Object.values(leverageTokenConfigs).find(
              (config) => config.address.toLowerCase() === tokenAddress.toLowerCase(),
            )

            if (!tokenConfig) {
              return { positionId: position.id, apyData: null }
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

            return { positionId: position.id, apyData: apyBreakdown }
          } catch (error) {
            console.warn(`Failed to calculate APY for position ${position.id}:`, error)
            return { positionId: position.id, apyData: null }
          }
        })

      const results = await Promise.allSettled(apyPromises)

      // Process results
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.apyData) {
          apyDataMap.set(result.value.positionId, result.value.apyData)
        }
      })

      return apyDataMap
    },
    enabled: enabled && positions.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}
