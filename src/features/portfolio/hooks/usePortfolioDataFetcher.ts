import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { createLogger } from '@/lib/logger'

const logger = createLogger('portfolio-data-fetcher')

import {
  getLeverageTokenConfig,
  leverageTokenConfigs,
} from '@/features/leverage-tokens/leverageTokens.config'
import {
  fetchAllLeverageTokenStateHistory,
  fetchUserPositions,
} from '@/lib/graphql/fetchers/portfolio'
import type { LeverageTokenState, UserPosition } from '@/lib/graphql/types/portfolio'
import { useUsdPricesMultiChain } from '@/lib/prices/useUsdPricesMulti'
import type { Position } from '../components/active-positions'
import type { PortfolioDataPoint } from '../components/portfolio-performance-chart'
import {
  calculatePortfolioMetrics,
  generatePortfolioPerformanceData,
  groupStatesByToken,
} from '../utils/portfolio-calculations'
import { portfolioKeys } from '../utils/queryKeys'
import { useTokensAPY } from './usePositionsAPY'

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
 * Calculate individual position values from user position and token states
 */
function calculatePositionValues(
  userPosition: UserPosition,
  leverageTokenStates: Map<string, Array<LeverageTokenState>>,
  usdPrices: Record<string, number>,
): {
  currentValue: { amount: string; symbol: string; usdValue: string }
  unrealizedGain: { amount: string; symbol: string; percentage: string }
} {
  const tokenStates = leverageTokenStates.get(userPosition.leverageToken.id)
  if (!tokenStates || tokenStates.length === 0) {
    return {
      currentValue: { amount: '0.00', symbol: 'USD', usdValue: '$0.00' },
      unrealizedGain: { amount: '0.00', symbol: 'USD', percentage: '0.00%' },
    }
  }

  // Find the most recent state
  const now = Date.now() / 1000
  const mostRecentState = tokenStates
    .map((state) => ({
      ...state,
      timestamp: Number(state.timestamp) / 1000000, // Convert microseconds to seconds
    }))
    .sort((a, b) => b.timestamp - a.timestamp)
    .find((state) => state.timestamp <= now)

  if (!mostRecentState) {
    return {
      currentValue: { amount: '0.00', symbol: 'USD', usdValue: '$0.00' },
      unrealizedGain: { amount: '0.00', symbol: 'USD', percentage: '0.00%' },
    }
  }

  // Calculate current position value
  const balance = BigInt(userPosition.balance)

  // Handle zero balance positions (redeemed tokens)
  if (balance === 0n) {
    return {
      currentValue: { amount: '0.00', symbol: 'USD', usdValue: '$0.00' },
      unrealizedGain: { amount: '0.00', symbol: 'USD', percentage: '0.00%' },
    }
  }

  const equityPerToken = BigInt(mostRecentState.equityPerTokenInCollateral)
  const positionValue = (balance * equityPerToken) / BigInt(1e18)

  // Get the collateral asset decimals from the leverage token config
  const leverageTokenAddress = userPosition.leverageToken.id.toLowerCase()
  const tokenConfig = Object.values(leverageTokenConfigs).find(
    (config) => config.address.toLowerCase() === leverageTokenAddress,
  )
  const collateralDecimals = tokenConfig?.collateralAsset?.decimals || 18

  // Convert from wei to collateral asset units
  const positionValueInCollateralAsset = Number(formatUnits(positionValue, collateralDecimals))

  // Get collateral asset price in USD
  const collateralAssetAddress =
    userPosition.leverageToken.lendingAdapter.collateralAsset.toLowerCase()
  const collateralAssetPriceUsd = usdPrices[collateralAssetAddress]
  const positionValueInUSD = collateralAssetPriceUsd
    ? positionValueInCollateralAsset * collateralAssetPriceUsd
    : 0

  // Calculate deposited amount (what user originally put in)
  const depositedInCollateral = BigInt(userPosition.totalEquityDepositedInCollateral || '0')
  const depositedInCollateralAsset = Number(formatUnits(depositedInCollateral, collateralDecimals))
  const depositedInUSD = collateralAssetPriceUsd
    ? depositedInCollateralAsset * collateralAssetPriceUsd
    : 0

  // Calculate unrealized gain
  const unrealizedGainAmount = positionValueInUSD - depositedInUSD
  const unrealizedGainPercentage =
    depositedInUSD > 0 ? (unrealizedGainAmount / depositedInUSD) * 100 : 0

  // Get the collateral asset symbol from the leverage token config
  const collateralSymbol = tokenConfig?.collateralAsset?.symbol || 'UNKNOWN'

  const result = {
    currentValue: {
      amount: positionValueInCollateralAsset.toFixed(4),
      symbol: collateralSymbol, // Use actual collateral asset symbol
      usdValue: collateralAssetPriceUsd
        ? `$${positionValueInUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '$0.00 (unpriced)',
    },
    unrealizedGain: {
      amount: collateralAssetPriceUsd
        ? `${unrealizedGainAmount >= 0 ? '+' : '-'}${Math.abs(unrealizedGainAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '—',
      symbol: 'USD', // This is correct since unrealized gain is in USD
      percentage: collateralAssetPriceUsd
        ? `${unrealizedGainPercentage >= 0 ? '+' : ''}${unrealizedGainPercentage.toFixed(2)}%`
        : '—',
    },
  }

  return result
}

/**
 * Core data fetcher hook for all portfolio data using TanStack Query
 * Uses real subgraph data from all supported chains with improved caching and error handling
 */
export function usePortfolioDataFetcher() {
  const { address, chainId } = useAccount()
  // address = '0x0ec9a61bd923cbaf519b1baef839617f012344e2'

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

        // Convert subgraph positions to UI positions (without calculated values yet)
        const positions = userPositions.map((userPosition) => {
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
            name:
              tokenConfig?.name || `${collateralAsset.symbol} / ${debtAsset.symbol} Leverage Token`,
            type: 'leverage-token' as const,
            token: collateralAsset.symbol as 'USDC' | 'WETH' | 'weETH', // Use collateral asset as primary token
            riskLevel: (tokenConfig?.leverageRatio && tokenConfig.leverageRatio > 10
              ? 'high'
              : 'medium') as 'low' | 'medium' | 'high',
            currentValue: {
              amount: '0.00', // Will be calculated later
              symbol: 'USD',
              usdValue: '$0.00',
            },
            unrealizedGain: {
              amount: '0.00', // Will be calculated later
              symbol: 'USD',
              percentage: '0.00%',
            },
            apy: '0.00%', // Will be calculated later
            collateralAsset: {
              symbol: collateralAsset.symbol,
              name: collateralAsset.name,
            },
            debtAsset: {
              symbol: debtAsset.symbol,
              name: debtAsset.name,
            },
            leverageTokenAddress: userPosition.leverageToken.id,
          }
        })

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
          totalEarnings: 0, // Will be calculated in usePortfolioWithTotalValue
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
        logger.error('Error fetching portfolio data', { error, chainId: chainId ?? 0 })
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

  // Get unique collateral asset addresses grouped by chain ID
  const addressesByChain = useMemo(() => {
    if (!portfolioQueryData?.rawUserPositions.length) return {}

    const chainMap = new Map<number, Set<string>>()

    portfolioQueryData.rawUserPositions.forEach((position) => {
      if (position.leverageToken.lendingAdapter.collateralAsset) {
        // Get the chain ID from the leverage token config
        const leverageTokenConfig = getLeverageTokenConfig(
          position.leverageToken.id as `0x${string}`,
        )
        const chainId = leverageTokenConfig?.chainId || 1 // Fallback to Ethereum

        if (!chainMap.has(chainId)) {
          chainMap.set(chainId, new Set<string>())
        }
        chainMap
          .get(chainId)
          ?.add(position.leverageToken.lendingAdapter.collateralAsset.toLowerCase())
      }
    })

    // Convert Map to Record for the hook
    const result: Record<number, Array<string>> = {}
    for (const [chainId, addresses] of chainMap.entries()) {
      result[chainId] = Array.from(addresses)
    }

    return result
  }, [portfolioQueryData?.rawUserPositions])

  // Fetch prices for all collateral assets across all chains
  const { data: usdPricesByChain = {} } = useUsdPricesMultiChain({
    byChain: addressesByChain,
    enabled: Object.keys(addressesByChain).length > 0,
  })

  // Flatten the multi-chain prices into a single map for backward compatibility
  const usdPrices = useMemo(() => {
    const flattened: Record<string, number> = {}
    for (const chainPrices of Object.values(usdPricesByChain)) {
      Object.assign(flattened, chainPrices)
    }
    return flattened
  }, [usdPricesByChain])

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

  // Calculate APY data for all positions
  const { data: positionsAPYData, isLoading: positionsAPYLoading } = useTokensAPY({
    tokens: portfolioQueryData?.portfolioData.positions || [],
    enabled: !!portfolioQueryData?.portfolioData.positions.length,
  })

  // Return portfolio data with calculated metrics and APY breakdown
  const portfolioDataWithMetrics = useMemo(() => {
    if (!portfolioQueryData) return null

    // Enhance positions with APY breakdown data and calculated values
    const enhancedPositions = portfolioQueryData.portfolioData.positions.map((position) => {
      const apyBreakdown = positionsAPYData?.get(position.id)
      const newApy = apyBreakdown ? `${(apyBreakdown.totalAPY * 100).toFixed(2)}%` : position.apy

      // Find the corresponding raw user position to calculate values
      const rawUserPosition = portfolioQueryData.rawUserPositions.find(
        (rawPos) => rawPos.id === position.id,
      )

      // Calculate position values if we have the raw data and USD prices
      let calculatedValues = {}
      if (rawUserPosition && Object.keys(usdPrices).length > 0) {
        calculatedValues = calculatePositionValues(
          rawUserPosition,
          portfolioQueryData.leverageTokenStates,
          usdPrices,
        )
      }

      return {
        ...position,
        ...calculatedValues, // Override with calculated values
        apyBreakdown,
        // Update APY display with calculated value
        apy: newApy,
      }
    })

    return {
      ...portfolioQueryData.portfolioData,
      positions: enhancedPositions,
      summary: {
        ...portfolioQueryData.portfolioData.summary,
        totalValue: portfolioMetrics.totalValue,
        totalEarnings: Math.max(0, portfolioMetrics.changeAmount), // Only show positive earnings
        changeAmount: portfolioMetrics.changeAmount,
        changePercent: portfolioMetrics.changePercent,
      },
    }
  }, [portfolioQueryData, portfolioMetrics, positionsAPYData, usdPrices])

  return {
    data: portfolioDataWithMetrics,
    rawUserPositions: portfolioQueryData?.rawUserPositions || [],
    leverageTokenStates: portfolioQueryData?.leverageTokenStates || new Map(),
    usdPrices,
    positionsAPYLoading,
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
