import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import type { PortfolioDataPoint } from '../components/portfolio-performance-chart'
import { mockPortfolioData, mockPortfolioData1Y, mockPortfolioData90D } from '../data/mock'
import { portfolioKeys } from '../utils/queryKeys'

export interface PortfolioPerformanceData {
  data: Array<PortfolioDataPoint>
  selectedTimeframe: string
  setSelectedTimeframe: (timeframe: string) => void
  timeframes: Array<string>
}

/**
 * Hook to fetch portfolio performance data using TanStack Query
 * Currently returns mock data, but can easily be replaced with real API calls
 */
export function usePortfolioPerformance() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30D')

  // Simple data selection from pre-generated mock data
  const getTimeframeData = (timeframe: string): Array<PortfolioDataPoint> => {
    switch (timeframe) {
      case '7D':
        return mockPortfolioData.slice(-7)
      case '30D':
        return mockPortfolioData
      case '90D':
        return mockPortfolioData90D
      case '1Y':
        return mockPortfolioData1Y
      default:
        return mockPortfolioData
    }
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: portfolioKeys.performance(selectedTimeframe),
    queryFn: async (): Promise<Array<PortfolioDataPoint>> => {
      // No setTimeout needed - just return static data immediately
      return getTimeframeData(selectedTimeframe)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - longer to avoid refetches
    refetchInterval: false, // Disable auto-refetch to prevent jarring updates
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  })

  return {
    data: data || [],
    selectedTimeframe,
    setSelectedTimeframe,
    timeframes: ['7D', '30D', '90D', '1Y'],
    isLoading,
    isError,
  }
}
