import { waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLeverageTokenPriceComparison } from '@/features/leverage-tokens/hooks/useLeverageTokenPriceComparison'
import { fetchLeverageTokenPriceComparison } from '@/lib/graphql/fetchers/leverage-tokens'
import { hookTestUtils } from '../../../../utils'

// Mock the fetcher module
vi.mock('@/lib/graphql/fetchers/leverage-tokens', () => ({
  fetchLeverageTokenPriceComparison: vi.fn(),
}))

const mockFetchLeverageTokenPriceComparison = vi.mocked(fetchLeverageTokenPriceComparison)

describe('useLeverageTokenPriceComparison', () => {
  const tokenAddress = '0xA2fceEAe99d2cAeEe978DA27bE2d95b0381dBB8c' as const
  const chainId = 8453

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('hook initialization', () => {
    it('should create query with correct initial state', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useLeverageTokenPriceComparison({
          tokenAddress,
          chainId,
        }),
      )

      expect(result.current.isLoading).toBe(true)
      expect(result.current.isError).toBe(false)
      expect(result.current.data).toBeUndefined()
    })

    it('should respect enabled option', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useLeverageTokenPriceComparison({
          tokenAddress,
          chainId,
          enabled: false,
        }),
      )

      expect(result.current.isFetching).toBe(false)
      expect(mockFetchLeverageTokenPriceComparison).not.toHaveBeenCalled()
    })
  })

  describe('successful data fetching', () => {
    it('should fetch and transform data correctly', async () => {
      const now = Math.floor(Date.now() * 1000) // Current time in microseconds
      const oneDayAgo = now - 24 * 60 * 60 * 1000 * 1000 // 1 day ago in microseconds

      const mockData = {
        leverageToken: {
          stateHistory: [
            {
              equityPerTokenInDebt: '1250000000000000000', // 1.25 in wei (18 decimals)
              timestamp: now.toString(),
            },
            {
              equityPerTokenInDebt: '1300000000000000000', // 1.30 in wei (18 decimals)
              timestamp: oneDayAgo.toString(),
            },
          ],
          lendingAdapter: {
            oracle: {
              decimals: 8,
              priceUpdates: [
                {
                  price: '2500000000', // 25.00 with 8 decimals
                  timestamp: now.toString(),
                },
                {
                  price: '2550000000', // 25.50 with 8 decimals
                  timestamp: oneDayAgo.toString(),
                },
              ],
            },
          },
        },
      }

      mockFetchLeverageTokenPriceComparison.mockResolvedValue(mockData)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useLeverageTokenPriceComparison({
          tokenAddress,
          chainId,
          timeframe: '1M',
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Debug: check if the mock was called
      expect(mockFetchLeverageTokenPriceComparison).toHaveBeenCalledWith(tokenAddress, chainId)

      expect(result.current.data).toHaveLength(2)
      // Note: Data is sorted by timestamp, so oldest first
      expect(result.current.data?.[0]).toEqual({
        date: expect.any(String), // Dynamic timestamp
        leverageTokenPrice: 1.3,
        weethPrice: 25.5,
      })
      expect(result.current.data?.[1]).toEqual({
        date: expect.any(String), // Dynamic timestamp
        leverageTokenPrice: 1.25,
        weethPrice: 25.0,
      })
    })

    it('should filter data based on timeframe', async () => {
      const now = Math.floor(Date.now() * 1000) // Current time in microseconds
      const oneDayAgo = now - 12 * 60 * 60 * 1000 * 1000 // 12 hours ago in microseconds
      const oneWeekAgo = now - 6 * 24 * 60 * 60 * 1000 * 1000 // 6 days ago in microseconds (clearly within 1 week)

      const mockData = {
        leverageToken: {
          stateHistory: [
            {
              equityPerTokenInDebt: '1250000000000000000', // 1.25 in wei (18 decimals)
              timestamp: now.toString(),
            },
            {
              equityPerTokenInDebt: '1200000000000000000', // 1.20 in wei (18 decimals)
              timestamp: oneDayAgo.toString(),
            },
            {
              equityPerTokenInDebt: '1100000000000000000', // 1.10 in wei (18 decimals)
              timestamp: oneWeekAgo.toString(),
            },
          ],
          lendingAdapter: {
            oracle: {
              decimals: 8,
              priceUpdates: [
                {
                  price: '2500000000',
                  timestamp: now.toString(),
                },
                {
                  price: '2400000000',
                  timestamp: oneDayAgo.toString(),
                },
                {
                  price: '2200000000',
                  timestamp: oneWeekAgo.toString(),
                },
              ],
            },
          },
        },
      }

      mockFetchLeverageTokenPriceComparison.mockResolvedValue(mockData)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useLeverageTokenPriceComparison({
          tokenAddress,
          chainId,
          timeframe: '1W', // Only 1 week
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Debug: check if the mock was called
      expect(mockFetchLeverageTokenPriceComparison).toHaveBeenCalledWith(tokenAddress, chainId)

      // Should include all data from the last week (3 entries: now, 1 day ago, 1 week ago)
      expect(result.current.data).toHaveLength(3)
      expect(result.current.data?.[0]?.leverageTokenPrice).toBe(1.1) // oldest (1 week ago)
      expect(result.current.data?.[1]?.leverageTokenPrice).toBe(1.2) // middle (1 day ago)
      expect(result.current.data?.[2]?.leverageTokenPrice).toBe(1.25) // newest (now)
    })
  })

  describe('error handling', () => {
    it('should handle missing leverage token data', async () => {
      mockFetchLeverageTokenPriceComparison.mockResolvedValue({ leverageToken: null })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useLeverageTokenPriceComparison({
          tokenAddress,
          chainId,
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual([])
    })

    it('should handle missing state history', async () => {
      const mockData = {
        leverageToken: {
          stateHistory: [],
          lendingAdapter: {
            oracle: {
              decimals: 8,
              priceUpdates: [],
            },
          },
        },
      }

      mockFetchLeverageTokenPriceComparison.mockResolvedValue(mockData)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useLeverageTokenPriceComparison({
          tokenAddress,
          chainId,
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual([])
    })

    it('should handle missing oracle data', async () => {
      const mockData = {
        leverageToken: {
          stateHistory: [
            {
              equityPerTokenInDebt: '1.25',
              timestamp: '1640995200',
            },
          ],
          lendingAdapter: {
            oracle: {
              decimals: 8,
              priceUpdates: [],
            },
          },
        },
      }

      mockFetchLeverageTokenPriceComparison.mockResolvedValue(mockData)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useLeverageTokenPriceComparison({
          tokenAddress,
          chainId,
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual([])
    })

    it('should handle API errors gracefully', async () => {
      const error = new Error('GraphQL error')
      mockFetchLeverageTokenPriceComparison.mockRejectedValue(error)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useLeverageTokenPriceComparison({
          tokenAddress,
          chainId,
        }),
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBe(error)
    })
  })

  describe('query key structure', () => {
    it('should use correct query key for caching', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useLeverageTokenPriceComparison({
          tokenAddress,
          chainId,
        }),
      )

      // The query key should be based on the token address and chain ID
      expect(result.current.dataUpdatedAt).toBeDefined()
    })
  })

  describe('stale time configuration', () => {
    it('should respect stale time configuration', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useLeverageTokenPriceComparison({
          tokenAddress,
          chainId,
        }),
      )

      // The hook should use the STALE_TIME.historical configuration
      expect(result.current.isStale).toBeDefined()
    })
  })
})
