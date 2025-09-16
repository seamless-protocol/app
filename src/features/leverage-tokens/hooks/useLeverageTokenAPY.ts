import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import { useConfig } from 'wagmi'
import type { APYBreakdownData } from '@/components/APYBreakdown'
import type { LeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { getLeverageTokenConfig } from '../leverageTokens.config'
import { fetchAprForToken } from '../utils/apy-calculations/apr-providers'
import { fetchBorrowApyForToken } from '../utils/apy-calculations/borrow-apy-providers'
import { fetchLeverageRatios } from '../utils/apy-calculations/leverage-ratios'
import { fetchRewardsAprForToken } from '../utils/apy-calculations/rewards-providers'
import { ltKeys } from '../utils/queryKeys'

interface UseLeverageTokenAPYOptions {
  tokenAddress?: Address
  leverageToken?: LeverageTokenConfig
  enabled?: boolean
}

/**
 * Hook to calculate leverage token APY with proper React Query integration
 */
export function useLeverageTokenAPY({
  tokenAddress,
  leverageToken,
  enabled = true,
}: UseLeverageTokenAPYOptions) {
  const config = useConfig()
  const queryKey = tokenAddress ? ltKeys.apy(tokenAddress) : []

  return useQuery({
    queryKey,
    queryFn: async (): Promise<APYBreakdownData> => {
      if (!tokenAddress) {
        throw new Error('Token address is required')
      }

      if (!leverageToken) {
        // Return default/empty APY data if leverage token config is not available
        return {
          stakingYield: 0,
          restakingYield: 0,
          borrowRate: 0,
          rewardsAPR: 0,
          points: 0,
          totalAPY: 0,
        }
      }

      // Fetch all required data in parallel
      const [leverageRatios, aprData, borrowApyData, rewardsAPRData] = await Promise.all([
        fetchLeverageRatios(tokenAddress, leverageToken.chainId, config),
        fetchAprForToken(tokenAddress, leverageToken.chainId),
        fetchBorrowApyForToken(tokenAddress, leverageToken.chainId, config),
        fetchRewardsAprForToken(tokenAddress, leverageToken.chainId),
      ])

      const borrowAPY = borrowApyData.borrowAPY

      const targetLeverage = leverageRatios.targetLeverage

      // Use the calculated leverage ratios

      // Staking Yield = Protocol APR * leverage (convert from percentage to decimal)
      const stakingYield =
        (aprData.stakingAPR && targetLeverage
          ? (aprData.stakingAPR / 100) * targetLeverage
          : undefined) ?? 0

      // Restaking Yield = Protocol restaking APR * leverage (convert from percentage to decimal)
      const restakingYield =
        (aprData.restakingAPR && targetLeverage
          ? (aprData.restakingAPR / 100) * targetLeverage
          : undefined) ?? 0

      // Borrow Rate = negative cost based on leverage
      const borrowRate =
        (borrowAPY && targetLeverage ? borrowAPY * -1 * (targetLeverage - 1) : undefined) ?? 0

      // Rewards APR from external sources (Fuul, etc.)
      const rewardsAPR = rewardsAPRData?.rewardsAPR ?? 0

      // Points calculation
      const points = (targetLeverage ? targetLeverage * 2 : undefined) ?? 0

      // Calculate total net yield
      const totalAPY = stakingYield + restakingYield + rewardsAPR + borrowRate

      return {
        stakingYield,
        restakingYield,
        borrowRate, // Already negative
        rewardsAPR,
        points,
        totalAPY,
      }
    },
    enabled: enabled && !!tokenAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}

/**
 * Hook to get APR data from providers for a specific token
 */
export function useAprProvider(tokenAddress?: Address, chainId?: number) {
  return useQuery({
    queryKey: tokenAddress && chainId ? ['protocol-apr', tokenAddress, chainId] : [],
    queryFn: () => {
      if (!tokenAddress || !chainId) {
        throw new Error('Token address and chain ID are required')
      }
      return fetchAprForToken(tokenAddress, chainId)
    },
    enabled: !!tokenAddress && !!chainId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useBorrowApy(tokenAddress?: Address, chainId?: number) {
  const config = useConfig()

  return useQuery({
    queryKey: tokenAddress && chainId ? ltKeys.external.borrowApy(tokenAddress) : [],
    queryFn: () => {
      if (!tokenAddress || !chainId) {
        throw new Error('Token address and chain ID are required')
      }
      return fetchBorrowApyForToken(tokenAddress, chainId, config)
    },
    enabled: !!tokenAddress && !!chainId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useRewardsApr(tokenAddress?: Address, chainId?: number) {
  return useQuery({
    queryKey: tokenAddress && chainId ? ltKeys.external.rewardsApr(tokenAddress) : [],
    queryFn: () => {
      if (!tokenAddress || !chainId) throw new Error('Token address and chain ID are required')
      return fetchRewardsAprForToken(tokenAddress, chainId)
    },
    enabled: !!tokenAddress && !!chainId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useLeverageRatios(tokenAddress?: Address) {
  // Get the token config to determine the correct chain ID
  const tokenConfig = tokenAddress ? getLeverageTokenConfig(tokenAddress) : undefined
  const chainId = tokenConfig?.chainId
  const config = useConfig()

  return useQuery({
    queryKey: tokenAddress ? ['leverage-ratios', tokenAddress, chainId] : [],
    queryFn: () => {
      if (!tokenAddress || !chainId) {
        throw new Error('Token address and chain ID are required')
      }
      return fetchLeverageRatios(tokenAddress, chainId, config)
    },
    enabled: !!tokenAddress && !!chainId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}
