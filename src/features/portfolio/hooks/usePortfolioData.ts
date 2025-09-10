import { useQuery } from '@tanstack/react-query'
import type { Position } from '../components/active-positions'
import { mockPortfolioSummary, mockPositions } from '../data/mock'
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

/**
 * Hook to fetch portfolio data using TanStack Query
 * Currently returns mock data, but can easily be replaced with real API calls
 */
export function usePortfolioData() {
  return useQuery({
    queryKey: portfolioKeys.data(),
    queryFn: async (): Promise<PortfolioData> => {
      // No setTimeout needed - just return static data immediately
      return {
        summary: mockPortfolioSummary,
        positions: mockPositions,
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // 30 seconds
  })
}
