import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import type { PortfolioDataPoint } from '../components/portfolio-performance-chart'
import { mockPortfolioData } from '../data/mock'
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
export function usePortfolioPerformance(currentValue: number) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30D')

  // Generate different datasets for different timeframes to avoid loading states
  const generateTimeframeData = (timeframe: string): Array<PortfolioDataPoint> => {
    const baseData = [...mockPortfolioData]

    switch (timeframe) {
      case '7D':
        return baseData.slice(-7)
      case '30D':
        return baseData
      case '90D':
        // Generate 90 days of data
        return Array.from({ length: 90 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (89 - i))
          const baseValue = currentValue * 0.8
          const timeProgress = i / 89
          const growthFactor = 1 + timeProgress * 0.25
          const volatility = Math.sin(i * 0.1) * 0.03 + Math.random() * 0.01 - 0.005
          const value = baseValue * growthFactor * (1 + volatility)

          return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: Math.round(value),
            earnings: Math.round(((value * 0.08) / 365) * (i + 1)),
          }
        })
      case '1Y':
        // Generate 365 days of data
        return Array.from({ length: 365 }, (_, i) => {
          const date = new Date()
          date.setDate(date.getDate() - (364 - i))
          const baseValue = currentValue * 0.6
          const timeProgress = i / 364
          const growthFactor = 1 + timeProgress * 0.67
          const volatility = Math.sin(i * 0.05) * 0.05 + Math.random() * 0.02 - 0.01
          const value = baseValue * growthFactor * (1 + volatility)

          return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: Math.round(value),
            earnings: Math.round(((value * 0.08) / 365) * (i + 1)),
          }
        })
      default:
        return baseData
    }
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: portfolioKeys.performance(selectedTimeframe, currentValue),
    queryFn: async (): Promise<Array<PortfolioDataPoint>> => {
      // Simulate very short API delay for smooth transitions
      await new Promise((resolve) => setTimeout(resolve, 100))

      return generateTimeframeData(selectedTimeframe)
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
