import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { leverageTokenConfigs } from '@/features/leverage-tokens/leverageTokens.config'
import {
  fetchAllLeverageTokenStateHistory,
  fetchUserPositions,
} from '@/lib/graphql/fetchers/portfolio'
import type { LeverageTokenState, UserPosition } from '@/lib/graphql/types/portfolio'
import { useUsdPrices } from '@/lib/prices/useUsdPrices'
import type { Position } from '../components/active-positions'
import type { PortfolioDataPoint } from '../components/portfolio-performance-chart'
import {
  calculatePortfolioMetrics,
  generatePortfolioPerformanceData,
  groupStatesByToken,
} from '../utils/portfolio-calculations'
import { portfolioKeys } from '../utils/queryKeys'

export interface PortfolioSummary {
  totalValue: number
  totalEarnings: number
  activePositions: number
  changeAmount: number
  changePercent: number
  averageAPY: number
}

export interface PortfolioData {
  summary: PortfolioSummary
  positions: Array<Position>
}

export interface PortfolioPerformanceData {
  data: Array<PortfolioDataPoint>
  selectedTimeframe: string
  setSelectedTimeframe: (timeframe: string) => void
  timeframes: Array<string>
  isLoading: boolean
  isError: boolean
}

/**
 * Convert subgraph user position to UI position format
 */
function convertUserPositionToUIPosition(userPosition: UserPosition): Position {
  // Find the leverage token config by matching the address
  const leverageTokenAddress = userPosition.leverageToken.id.toLowerCase()
  const tokenConfig = Object.values(leverageTokenConfigs).find(
    (config) => config.address.toLowerCase() === leverageTokenAddress,
  )

  // Use config data if available, otherwise fallback to placeholder values
  const collateralAsset = tokenConfig?.collateralAsset || {
    symbol: 'UNKNOWN',
    name: 'Unknown Collateral Asset',
  }

  const debtAsset = tokenConfig?.debtAsset || {
    symbol: 'UNKNOWN',
    name: 'Unknown Debt Asset',
  }

  return {
    id: userPosition.id,
    name: tokenConfig?.name || `Leverage Token ${userPosition.leverageToken.id.slice(0, 8)}...`,
    type: 'leverage-token',
    token: collateralAsset.symbol as 'USDC' | 'WETH' | 'weETH', // Use collateral asset as primary token
    riskLevel: tokenConfig?.leverageRatio && tokenConfig.leverageRatio > 10 ? 'high' : 'medium',
    currentValue: {
      amount: '0.00', // Would need to calculate from balance and equity per token
      symbol: 'USD',
      usdValue: '$0.00',
    },
    unrealizedGain: {
      amount: '0.00',
      symbol: 'USD',
      percentage: '0.00%',
    },
    apy: '0.00%', // Would need to calculate from historical data
    collateralAsset: {
      symbol: collateralAsset.symbol,
      name: collateralAsset.name,
    },
    debtAsset: {
      symbol: debtAsset.symbol,
      name: debtAsset.name,
    },
  }
}

/**
 * Core data fetcher hook for all portfolio data using TanStack Query
 * Uses real subgraph data from all supported chains with improved caching and error handling
 */
export function usePortfolioDataFetcher() {
  let { address } = useAccount()
  address = '0x0ec9a61bd923cbaf519b1baef839617f012344e2'

  return useQuery({
    queryKey: portfolioKeys.data(),
    queryFn: async (): Promise<{
      portfolioData: PortfolioData
      rawUserPositions: Array<UserPosition> // Store raw subgraph positions for performance calculations
      leverageTokenStates: Map<string, Array<LeverageTokenState>>
    }> => {
      if (!address) {
        return {
          portfolioData: {
            summary: {
              totalValue: 0,
              totalEarnings: 0,
              activePositions: 0,
              changeAmount: 0,
              changePercent: 0,
              averageAPY: 0,
            },
            positions: [],
          },
          rawUserPositions: [],
          leverageTokenStates: new Map(),
        }
      }

      try {
        // Fetch user positions from all supported chains (single API call)
        const userPositionsResponse = await fetchUserPositions(address)

        if (!userPositionsResponse.user?.positions?.length) {
          // No positions found, return empty portfolio
          return {
            portfolioData: {
              summary: {
                totalValue: 0,
                totalEarnings: 0,
                activePositions: 0,
                changeAmount: 0,
                changePercent: 0,
                averageAPY: 0,
              },
              positions: [],
            },
            rawUserPositions: [],
            leverageTokenStates: new Map(),
          }
        }

        const userPositions = userPositionsResponse.user.positions

        // Convert subgraph positions to UI positions
        const positions = userPositions.map(convertUserPositionToUIPosition)

        // Fetch state history for all leverage tokens in parallel for better performance
        const leverageTokenAddresses = userPositions.map((pos) => pos.leverageToken.id)

        // Use Promise.allSettled to handle partial failures gracefully
        const stateHistoryPromises = leverageTokenAddresses.map((tokenAddress) =>
          fetchAllLeverageTokenStateHistory(tokenAddress),
        )

        const stateHistoryResults = await Promise.allSettled(stateHistoryPromises)
        const allStates: Array<LeverageTokenState> = []

        // Process results, including successful and failed requests
        stateHistoryResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            allStates.push(...result.value)
          }
        })

        // Group states by token address
        const groupedStates = groupStatesByToken(allStates)

        // Get unique collateral asset addresses for price fetching (like old app)
        const collateralAssetAddresses = new Set<string>()
        userPositions.forEach((position) => {
          if (position.leverageToken.lendingAdapter.collateralAsset) {
            collateralAssetAddresses.add(
              position.leverageToken.lendingAdapter.collateralAsset.toLowerCase(),
            )
          }
        })

        // For now, we'll calculate totalValue in the performance hook where we have USD prices
        // This is a temporary solution - in the future we should fetch prices here too
        const summary: PortfolioSummary = {
          totalValue: 0, // Will be calculated in usePortfolioPerformance with USD prices
          totalEarnings: 0, // Would need historical data
          activePositions: positions.length,
          changeAmount: 0, // Would need historical data
          changePercent: 0, // Would need historical data
          averageAPY: 0, // Would need to calculate from historical data
        }

        return {
          portfolioData: {
            summary,
            positions,
          },
          rawUserPositions: userPositions, // Store raw positions for performance calculations
          leverageTokenStates: groupedStates,
        }
      } catch (error) {
        console.error('Error fetching portfolio data:', error)
        // Re-throw the error so TanStack Query can handle retries
        throw error
      }
    },
    enabled: !!address, // Only run when user is connected
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus for better UX
    refetchOnMount: true, // Always refetch when component mounts
    retry: (failureCount, error) => {
      // Retry up to 3 times with exponential backoff
      if (failureCount < 3) {
        return true
      }
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && error.message.includes('4')) {
        return false
      }
      return true
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })
}

/**
 * Hook to get portfolio data with current total value calculated
 * Combines portfolio data with USD price calculations
 */
export function usePortfolioWithTotalValue() {
  const { data: portfolioQueryData, isLoading, isError, error } = usePortfolioDataFetcher()

  // Get unique collateral asset addresses from user positions (like old app)
  const collateralAssetAddresses = useMemo(() => {
    if (!portfolioQueryData?.rawUserPositions.length) return []

    const addresses = new Set<string>()
    portfolioQueryData.rawUserPositions.forEach((position) => {
      if (position.leverageToken.lendingAdapter.collateralAsset) {
        addresses.add(position.leverageToken.lendingAdapter.collateralAsset.toLowerCase())
      }
    })
    return Array.from(addresses)
  }, [portfolioQueryData?.rawUserPositions])

  // Fetch prices for all collateral assets used in user positions (like old app)
  const { data: usdPrices = {} } = useUsdPrices({
    chainId: 8453, // Base chain
    addresses: collateralAssetAddresses,
    enabled: collateralAssetAddresses.length > 0,
  })

  // Calculate current portfolio metrics (value, deposited, change)
  const portfolioMetrics = useMemo(() => {
    if (
      !portfolioQueryData?.rawUserPositions.length ||
      !portfolioQueryData?.leverageTokenStates.size ||
      Object.keys(usdPrices).length === 0
    ) {
      return {
        totalValue: 0,
        totalDeposited: 0,
        changeAmount: 0,
        changePercent: 0,
      }
    }

    return calculatePortfolioMetrics(
      portfolioQueryData.rawUserPositions,
      portfolioQueryData.leverageTokenStates,
      usdPrices,
    )
  }, [portfolioQueryData?.rawUserPositions, portfolioQueryData?.leverageTokenStates, usdPrices])

  // Return portfolio data with calculated metrics
  const portfolioDataWithMetrics = useMemo(() => {
    if (!portfolioQueryData) return null

    return {
      ...portfolioQueryData.portfolioData,
      summary: {
        ...portfolioQueryData.portfolioData.summary,
        totalValue: portfolioMetrics.totalValue,
        changeAmount: portfolioMetrics.changeAmount,
        changePercent: portfolioMetrics.changePercent,
      },
    }
  }, [portfolioQueryData, portfolioMetrics])

  return {
    data: portfolioDataWithMetrics,
    rawUserPositions: portfolioQueryData?.rawUserPositions || [],
    leverageTokenStates: portfolioQueryData?.leverageTokenStates || new Map(),
    usdPrices,
    isLoading,
    isError,
    error,
  }
}

/**
 * Hook to get portfolio performance data with timeframe selection
 * Uses data from the usePortfolioDataFetcher hook to avoid duplicate API calls
 */
export function usePortfolioPerformance() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30D')
  const { rawUserPositions, leverageTokenStates, usdPrices, isLoading, isError, error } =
    usePortfolioWithTotalValue()

  // Generate performance data from the cached portfolio data
  const performanceData = useQuery({
    queryKey: [...portfolioKeys.performance(selectedTimeframe), usdPrices],
    queryFn: async (): Promise<Array<PortfolioDataPoint>> => {
      if (!rawUserPositions.length || !leverageTokenStates.size) {
        return []
      }

      // Generate portfolio performance data using the cached raw positions and states
      const performanceData = generatePortfolioPerformanceData(
        rawUserPositions,
        leverageTokenStates,
        selectedTimeframe as '7D' | '30D' | '90D' | '1Y',
        usdPrices,
      )

      return performanceData
    },
    enabled:
      rawUserPositions.length > 0 &&
      leverageTokenStates.size > 0 &&
      Object.keys(usdPrices).length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes - performance data changes less frequently
    gcTime: 15 * 60 * 1000, // 15 minutes - keep in cache longer
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount since we depend on portfolio data
    placeholderData: (previousData) => previousData, // Keep previous data while loading
    retry: false, // Don't retry performance calculations - they're derived from portfolio data
  })

  return {
    data: performanceData.data || [],
    selectedTimeframe,
    setSelectedTimeframe,
    timeframes: ['7D', '30D', '90D', '1Y'],
    isLoading: isLoading || performanceData.isLoading,
    isError: isError || performanceData.isError,
    error: error || performanceData.error,
  }
}

/**
 * Hook to get portfolio data (summary and positions)
 * Uses the usePortfolioDataFetcher hook with improved error handling
 */
export function usePortfolioData() {
  const { data, isLoading, isError, error, refetch } = usePortfolioDataFetcher()

  return {
    data: data?.portfolioData || {
      summary: {
        totalValue: 0,
        totalEarnings: 0,
        activePositions: 0,
        changeAmount: 0,
        changePercent: 0,
        averageAPY: 0,
      },
      positions: [],
    },
    isLoading,
    isError,
    error,
    refetch, // Expose refetch function for manual refresh
  }
}
