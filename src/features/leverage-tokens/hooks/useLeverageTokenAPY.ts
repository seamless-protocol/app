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
  const queryKey =
    tokenAddress && leverageToken?.chainId
      ? [...ltKeys.tokenOnChain(leverageToken.chainId, tokenAddress), 'apy']
      : []

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
          raw: {
            rawBorrowRate: 0,
            rawStakingYield: 0,
            rawRestakingYield: 0,
          },
        }
      }

      // Check if this is a test token (Tenderly) that might not be registered
      const isTestToken =
        leverageToken.name.toLowerCase().includes('tenderly') ||
        leverageToken.name.toLowerCase().includes('test')

      if (isTestToken) {
        // Test tokens aren't registered in the manager, return default data
        return {
          stakingYield: 0,
          restakingYield: 0,
          borrowRate: 0,
          rewardsAPR: 0,
          points: 0,
          totalAPY: 0,
          raw: {
            rawBorrowRate: 0,
            rawStakingYield: 0,
            rawRestakingYield: 0,
          },
        }
      }

      // Fetch all required data in parallel with individual error handling
      const [leverageRatiosResult, aprDataResult, borrowApyDataResult, rewardsAPRDataResult] =
        await Promise.allSettled([
          fetchLeverageRatios(tokenAddress, leverageToken.chainId, config),
          fetchAprForToken(tokenAddress, leverageToken.chainId),
          fetchBorrowApyForToken(tokenAddress, leverageToken.chainId, config),
          fetchRewardsAprForToken(tokenAddress, leverageToken.chainId),
        ])

      // If all requests failed, throw an error so React Query can handle it properly
      const allFailed =
        leverageRatiosResult.status === 'rejected' &&
        aprDataResult.status === 'rejected' &&
        borrowApyDataResult.status === 'rejected' &&
        rewardsAPRDataResult.status === 'rejected'

      if (allFailed) {
        const errors = [
          leverageRatiosResult.status === 'rejected' ? leverageRatiosResult.reason : null,
          aprDataResult.status === 'rejected' ? aprDataResult.reason : null,
          borrowApyDataResult.status === 'rejected' ? borrowApyDataResult.reason : null,
          rewardsAPRDataResult.status === 'rejected' ? rewardsAPRDataResult.reason : null,
        ].filter(Boolean)

        throw new Error(
          `APY calculation failed: Unable to fetch data from all sources. Errors: ${errors.map((e) => (e instanceof Error ? e.message : String(e))).join(', ')}`,
        )
      }

      // Extract data with fallbacks
      const leverageRatios =
        leverageRatiosResult.status === 'fulfilled'
          ? leverageRatiosResult.value
          : { targetLeverage: 0, minLeverage: 0, maxLeverage: 0 }

      const aprData =
        aprDataResult.status === 'fulfilled'
          ? aprDataResult.value
          : { stakingAPR: 0, restakingAPR: 0, totalAPR: 0 }

      const borrowApyData =
        borrowApyDataResult.status === 'fulfilled' ? borrowApyDataResult.value : { borrowAPY: 0 }

      const rewardsAPRData =
        rewardsAPRDataResult.status === 'fulfilled' ? rewardsAPRDataResult.value : { rewardsAPR: 0 }

      const borrowAPY = borrowApyData.borrowAPY
      const utilization = borrowApyData.utilization
      const targetLeverage = leverageRatios.targetLeverage

      // Staking Yield = Protocol APR * leverage (APR is already in percentage format)
      const stakingYield =
        (aprData.stakingAPR && targetLeverage ? aprData.stakingAPR * targetLeverage : undefined) ??
        0

      // Restaking Yield = Protocol restaking APR * leverage (APR is already in percentage format)
      const restakingYield =
        (aprData.restakingAPR && targetLeverage
          ? aprData.restakingAPR * targetLeverage
          : undefined) ?? 0

      // Raw market rates without leverage adjustment (convert decimal to percentage)
      const rawBorrowRate = borrowAPY ? borrowAPY * 100 : 0
      const rawStakingYield = aprData.stakingAPR ?? 0
      const rawRestakingYield = aprData.restakingAPR ?? 0

      // Borrow Rate = negative cost based on leverage (convert decimal to percentage)
      const borrowRate =
        (borrowAPY && targetLeverage ? borrowAPY * -100 * (targetLeverage - 1) : undefined) ?? 0

      // Rewards APR from external sources (Fuul, etc.)
      const rewardsAPR = rewardsAPRData?.rewardsAPR ?? 0

      // Points calculation
      const points = leverageToken.apyConfig?.pointsMultiplier ?? 0

      // Calculate total net yield
      const totalAPY = stakingYield + restakingYield + rewardsAPR + borrowRate

      return {
        stakingYield,
        restakingYield,
        borrowRate, // Already negative
        rewardsAPR,
        points,
        totalAPY,
        utilization,
        raw: {
          rawBorrowRate,
          rawStakingYield,
          rawRestakingYield,
        },
      }
    },
    enabled: enabled && !!tokenAddress,
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
