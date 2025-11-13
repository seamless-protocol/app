import { type QueryClient, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { createLogger } from '@/lib/logger'

const logger = createLogger('portfolio-data-fetcher')

import {
  getAllLeverageTokenConfigs,
  getLeverageTokenConfig,
} from '@/features/leverage-tokens/leverageTokens.config'
import { fetchUserBalanceHistoryWithBaseline } from '@/lib/graphql/fetchers/portfolio'
import type { BalanceChange, LeverageTokenState, UserPosition } from '@/lib/graphql/types/portfolio'
import { fetchCoingeckoTokenUsdPricesRange } from '@/lib/prices/coingecko'
import {
  createUsdHistoryKey,
  mapWithConcurrency as mapWithConcurrencyHistory,
  usdHistoryQueryKey,
  useHistoricalUsdPricesMultiChain,
} from '@/lib/prices/useUsdPricesHistory'
import { useUsdPricesMultiChain } from '@/lib/prices/useUsdPricesMulti'
import { type FetchPortfolioDataResult, fetchPortfolioData } from '../api/fetchPortfolioData'
import type { Position } from '../components/active-positions'
import type { PortfolioDataPoint } from '../components/portfolio-performance-chart'
import { buildCollateralAddressesByChain } from '../utils/addresses'
import { computePerformancePointsFromCache } from '../utils/performance'
import {
  calculatePortfolioMetrics,
  generatePortfolioPerformanceData,
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
      timestamp: (() => {
        try {
          const rawTimestamp = Number(state.timestamp)
          const timestamp = rawTimestamp > 4102444800 ? rawTimestamp / 1000000 : rawTimestamp
          // Validate timestamp
          if (Number.isNaN(timestamp) || timestamp <= 0 || timestamp > 4102444800) {
            console.warn('Invalid timestamp in usePortfolioDataFetcher:', {
              raw: state.timestamp,
              rawTimestamp,
              timestamp,
            })
            return 0 // Return 0 for invalid timestamps
          }
          return timestamp
        } catch (error) {
          console.error('Error processing timestamp in usePortfolioDataFetcher:', {
            timestamp: state.timestamp,
            error,
          })
          return 0
        }
      })(),
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
  const tokenConfig = getAllLeverageTokenConfigs().find(
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
    queryKey: portfolioKeys.data(address),
    queryFn: async () => {
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
        return await fetchPortfolioData(address)
      } catch (error) {
        logger.error('Error fetching portfolio data', { error, chainId: chainId ?? 0 })
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
    return buildCollateralAddressesByChain(portfolioQueryData.rawUserPositions)
  }, [portfolioQueryData?.rawUserPositions])

  // Fetch prices for all collateral assets across all chains
  const { data: usdPricesByChain = {} } = useUsdPricesMultiChain({
    byChain: addressesByChain,
    enabled: Object.keys(addressesByChain).length > 0,
    staleTimeMs: 15 * 60 * 1000,
    refetchIntervalMs: 15 * 60 * 1000,
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

    // Filter raw positions to only include those with matching leverage token configs
    const filteredUserPositions = portfolioQueryData.rawUserPositions.filter((position) => {
      const leverageTokenAddress = position.leverageToken.id.toLowerCase()
      const tokenConfig = getAllLeverageTokenConfigs().find(
        (config) => config.address.toLowerCase() === leverageTokenAddress,
      )
      return tokenConfig !== undefined
    })

    return calculatePortfolioMetrics(
      filteredUserPositions,
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
 * Fetches balance history to ensure accurate historical portfolio values
 */
export function usePortfolioPerformance() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30D')
  const { address } = useAccount()
  const { rawUserPositions, leverageTokenStates, usdPrices, isLoading, isError, error } =
    usePortfolioWithTotalValue()

  // Compute timeframe bounds
  const nowSec = Math.floor(Date.now() / 1000)
  const fromSec = useMemo(() => {
    switch (selectedTimeframe) {
      case '7D':
        return nowSec - 7 * 24 * 60 * 60
      case '30D':
        return nowSec - 30 * 24 * 60 * 60
      case '90D':
        return nowSec - 90 * 24 * 60 * 60
      case '1Y':
        return nowSec - 365 * 24 * 60 * 60
      default:
        return nowSec - 30 * 24 * 60 * 60
    }
  }, [nowSec, selectedTimeframe])

  // Fetch balance history for the selected timeframe
  const balanceHistoryQuery = useQuery({
    queryKey: [...portfolioKeys.performance(selectedTimeframe, address), 'balance-history'],
    queryFn: async (): Promise<Array<BalanceChange>> => {
      if (!address || !rawUserPositions.length) {
        return []
      }

      // Get all leverage token addresses
      const tokenAddresses = rawUserPositions.map(
        (position) => position.leverageToken.id.toLowerCase() as string,
      )

      // Calculate timeframe
      const now = nowSec
      const fromTimestamp = fromSec

      // Fetch merged balance history + baseline
      return fetchUserBalanceHistoryWithBaseline(address, tokenAddresses, fromTimestamp, now)
    },
    enabled: !!address && rawUserPositions.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 3,
  })

  // Build addresses by chain for historical USD price fetching
  // We fetch CoinGecko USD history for the COLLATERAL ERC-20 contract addresses,
  // grouped by their chainId (from leverage token configs).
  const addressesByChainForHistory = useMemo(() => {
    if (!rawUserPositions.length) return {}
    return buildCollateralAddressesByChain(rawUserPositions)
  }, [rawUserPositions])

  // Fetch historical USD prices for the timeframe
  const { getUsdPriceAt } = useHistoricalUsdPricesMultiChain({
    byChain: addressesByChainForHistory,
    from: fromSec,
    to: nowSec,
    enabled: Object.keys(addressesByChainForHistory).length > 0,
  })

  // Generate performance data from the cached portfolio data and balance history
  const performanceData = useQuery({
    // Deterministic key: depends only on timeframe + address
    queryKey: portfolioKeys.performance(selectedTimeframe, address),
    queryFn: async (): Promise<Array<PortfolioDataPoint>> => {
      if (
        !rawUserPositions.length ||
        !leverageTokenStates.size ||
        !balanceHistoryQuery.data?.length
      ) {
        return []
      }

      // Filter raw positions to only include those with matching leverage token configs
      const filteredUserPositions = rawUserPositions.filter((position) => {
        const leverageTokenAddress = position.leverageToken.id.toLowerCase()
        const tokenConfig = getAllLeverageTokenConfigs().find(
          (config) => config.address.toLowerCase() === leverageTokenAddress,
        )
        return tokenConfig !== undefined
      })

      // Build decimals/chain maps for valuation
      const collateralDecimalsByLeverageToken: Record<string, number> = {}
      const chainIdByLeverageToken: Record<string, number> = {}
      for (const pos of filteredUserPositions) {
        const cfg = getLeverageTokenConfig(pos.leverageToken.id as `0x${string}`)
        const key = pos.leverageToken.id.toLowerCase()
        if (cfg?.collateralAsset?.decimals !== undefined) {
          collateralDecimalsByLeverageToken[key] = cfg.collateralAsset.decimals
        }
        if (cfg?.chainId !== undefined) {
          chainIdByLeverageToken[key] = cfg.chainId
        }
      }

      // Generate portfolio performance data using the filtered positions, states, and balance history
      const performanceData = generatePortfolioPerformanceData(
        filteredUserPositions,
        leverageTokenStates,
        balanceHistoryQuery.data,
        selectedTimeframe as '7D' | '30D' | '90D' | '1Y',
        (chainId, address, ts) => getUsdPriceAt(chainId, address, ts),
        collateralDecimalsByLeverageToken,
        chainIdByLeverageToken,
        usdPrices, // spot fallback
      )

      return performanceData
    },
    enabled:
      rawUserPositions.length > 0 &&
      leverageTokenStates.size > 0 &&
      balanceHistoryQuery.isSuccess &&
      (balanceHistoryQuery.data?.length ?? 0) > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes - performance data changes less frequently
    gcTime: 15 * 60 * 1000, // 15 minutes - keep in cache longer
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount since we depend on portfolio data
    retry: false, // Don't retry performance calculations - they're derived from portfolio data
  })

  return {
    data: performanceData.data || [],
    selectedTimeframe,
    setSelectedTimeframe,
    timeframes: ['7D', '30D', '90D', '1Y'],
    // Avoid showing a loading state if we already have cached performance points
    isLoading:
      isLoading ||
      ((performanceData.data?.length ?? 0) === 0 &&
        (performanceData.isLoading || balanceHistoryQuery.isLoading)),
    isError: isError || performanceData.isError || balanceHistoryQuery.isError,
    error: error || performanceData.error || balanceHistoryQuery.error,
  }
}

/**
 * Programmatic prefetch for portfolio warmup. Use in MainLayout on wallet connect,
 * or on Portfolio nav hover to prime the cache before route entry.
 */
export async function prefetchPortfolioWarmup(
  queryClient: QueryClient,
  params: { address: string; timeframe?: '7D' | '30D' | '90D' | '1Y'; concurrency?: number },
) {
  const { address, timeframe = '30D', concurrency = 5 } = params
  if (!address) return

  // 1) Prefetch core portfolio data and read from cache
  await queryClient.prefetchQuery({
    queryKey: portfolioKeys.data(address),
    queryFn: () => fetchPortfolioData(address),
    staleTime: 5 * 60 * 1000,
  })
  const ensured = queryClient.getQueryData<FetchPortfolioDataResult>(portfolioKeys.data(address))

  const rawUserPositions = ensured?.rawUserPositions || []
  if (rawUserPositions.length === 0) return

  const nowSec = Math.floor(Date.now() / 1000)
  const fromSec = (() => {
    switch (timeframe) {
      case '7D':
        return nowSec - 7 * 24 * 60 * 60
      case '30D':
        return nowSec - 30 * 24 * 60 * 60
      case '90D':
        return nowSec - 90 * 24 * 60 * 60
      case '1Y':
        return nowSec - 365 * 24 * 60 * 60
    }
  })()

  // 2) Prefetch balance history + baseline
  const tokenAddresses = rawUserPositions.map((p) => p.leverageToken.id.toLowerCase())
  await queryClient.prefetchQuery({
    queryKey: [...portfolioKeys.performance(timeframe, address), 'balance-history'],
    queryFn: () => fetchUserBalanceHistoryWithBaseline(address, tokenAddresses, fromSec, nowSec),
    staleTime: 5 * 60 * 1000,
  })

  // 3) Prefetch historical USD ranges
  const byChain = buildCollateralAddressesByChain(rawUserPositions)
  if (Object.keys(byChain).length === 0) return

  // normalize input for stable query key; returned value unused directly
  createUsdHistoryKey(byChain, fromSec, nowSec)
  await queryClient.prefetchQuery({
    queryKey: usdHistoryQueryKey(byChain, fromSec, nowSec),
    queryFn: async () => {
      const out: Record<number, Record<string, Array<[number, number]>>> = {}
      for (const [chainIdStr, addrs] of Object.entries(byChain)) {
        const chainId = Number(chainIdStr)
        const unique = [...new Set(addrs.map((a) => a.toLowerCase()))]
        const results = await mapWithConcurrencyHistory(unique, concurrency, async (addr) => {
          const series = await fetchCoingeckoTokenUsdPricesRange(chainId, addr, fromSec, nowSec)
          return [addr, series] as const
        })
        out[chainId] = Object.fromEntries(results)
      }
      return out
    },
    staleTime: 60_000,
  })

  // 4) Compute performance points now and seed the cache for instant render
  const balanceChanges = queryClient.getQueryData<Array<BalanceChange>>([
    ...portfolioKeys.performance(timeframe, address),
    'balance-history',
  ])
  const usdHistory = queryClient.getQueryData<
    Record<number, Record<string, Array<[number, number]>>>
  >(usdHistoryQueryKey(byChain, fromSec, nowSec))
  if (balanceChanges && usdHistory) {
    const points = computePerformancePointsFromCache({
      rawUserPositions,
      leverageTokenStates: ensured?.leverageTokenStates || new Map(),
      balanceChanges,
      timeframe,
      usdHistory,
    })

    queryClient.setQueryData(portfolioKeys.performance(timeframe, address), points)
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
