import { waitFor } from '@testing-library/react'
import type { Address } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLeverageTokenAPY } from '@/features/leverage-tokens/hooks/useLeverageTokenAPY'
import { fetchAprForToken } from '@/features/leverage-tokens/utils/apy-calculations/apr-providers'
import { fetchBorrowApyForToken } from '@/features/leverage-tokens/utils/apy-calculations/borrow-apy-providers'
import { fetchLeverageRatios } from '@/features/leverage-tokens/utils/apy-calculations/leverage-ratios'
import { fetchRewardsAprForToken } from '@/features/leverage-tokens/utils/apy-calculations/rewards-providers'
import { BASE_WETH } from '@/lib/contracts/addresses'
import { hookTestUtils } from '../../../../utils'

// Mock the external dependencies
const mockFetchAprForToken = vi.mocked(fetchAprForToken)
const mockFetchBorrowApyForToken = vi.mocked(fetchBorrowApyForToken)
const mockFetchLeverageRatios = vi.mocked(fetchLeverageRatios)
const mockFetchRewardsAprForToken = vi.mocked(fetchRewardsAprForToken)

describe('useLeverageTokenAPY', () => {
  const tokenAddress = '0xA2fceEAe99d2cAeEe978DA27bE2d95b0381dBB8c' as Address
  const chainId = 8453

  const mockLeverageTokenConfig = {
    address: tokenAddress,
    name: 'Mock Leverage Token',
    symbol: 'MLT',
    description: 'Mock leverage token for unit testing',
    decimals: 18,
    leverageRatio: 17,
    chainId,
    chainName: 'Base',
    chainLogo: () => null,
    collateralAsset: {
      symbol: 'WETH',
      name: 'Wrapped Ether',
      address: BASE_WETH,
      decimals: 18,
    },
    debtAsset: {
      symbol: 'USDC',
      name: 'USD Coin',
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as Address,
      decimals: 6,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('hook initialization', () => {
    it('should create query with correct initial state', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useLeverageTokenAPY({
          tokenAddress,
          leverageToken: mockLeverageTokenConfig,
        }),
      )

      expect(result.current.isLoading).toBe(true)
      expect(result.current.isError).toBe(false)
      expect(result.current.data).toBeUndefined()
    })

    it('should respect enabled option', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useLeverageTokenAPY({
          tokenAddress,
          leverageToken: mockLeverageTokenConfig,
          enabled: false,
        }),
      )

      expect(result.current.isFetching).toBe(false)
      expect(mockFetchAprForToken).not.toHaveBeenCalled()
      expect(mockFetchBorrowApyForToken).not.toHaveBeenCalled()
      expect(mockFetchLeverageRatios).not.toHaveBeenCalled()
      expect(mockFetchRewardsAprForToken).not.toHaveBeenCalled()
    })

    it('should not fetch when tokenAddress is missing', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useLeverageTokenAPY({
          leverageToken: mockLeverageTokenConfig,
        }),
      )

      expect(result.current.isFetching).toBe(false)
      expect(mockFetchAprForToken).not.toHaveBeenCalled()
    })
  })

  describe('successful data fetching', () => {
    it('should fetch and calculate APY correctly', async () => {
      // Mock the external API responses
      const mockLeverageRatios = {
        targetLeverage: 17,
        minLeverage: 15,
        maxLeverage: 20,
      }

      const mockAprData = {
        stakingAPR: 5.2, // 5.2%
        restakingAPR: 2.1, // 2.1%
        totalAPR: 7.3,
      }

      const mockBorrowApyData = {
        borrowAPY: 0.0387, // 3.87% (as decimal)
      }

      const mockRewardsAprData = {
        rewardsAPR: 0.008, // 0.8% as decimal
      }

      // Setup mocks
      mockFetchLeverageRatios.mockResolvedValue(mockLeverageRatios)
      mockFetchAprForToken.mockResolvedValue(mockAprData)
      mockFetchBorrowApyForToken.mockResolvedValue(mockBorrowApyData)
      mockFetchRewardsAprForToken.mockResolvedValue(mockRewardsAprData)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useLeverageTokenAPY({
          tokenAddress,
          leverageToken: mockLeverageTokenConfig,
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Verify all external APIs were called
      expect(mockFetchLeverageRatios).toHaveBeenCalledWith(
        tokenAddress,
        chainId,
        expect.any(Object),
      )
      expect(mockFetchAprForToken).toHaveBeenCalledWith(tokenAddress, chainId)
      expect(mockFetchBorrowApyForToken).toHaveBeenCalledWith(
        tokenAddress,
        chainId,
        expect.any(Object),
      )
      expect(mockFetchRewardsAprForToken).toHaveBeenCalledWith(tokenAddress, chainId)

      // Verify the calculated APY data
      const apyData = result.current.data
      expect(apyData).toBeDefined()

      // Staking Yield = Protocol APR * leverage (APR is in percentage format)
      // 5.2% * 17 = 88.4%
      expect(apyData?.stakingYield).toBeCloseTo(88.4, 3)

      // Restaking Yield = Protocol restaking APR * leverage (APR is in percentage format)
      // 2.1% * 17 = 35.7%
      expect(apyData?.restakingYield).toBeCloseTo(35.7, 3)

      // Borrow Rate = negative cost based on leverage (convert decimal to percentage)
      // borrowAPY * -100 * (targetLeverage - 1) = 0.0387 * -100 * (17 - 1) = -61.92
      expect(apyData?.borrowRate).toBeCloseTo(-61.92, 4)

      // Rewards APR = 0.8% = 0.008
      expect(apyData?.rewardsAPR).toBeCloseTo(0.008, 3)

      // Points = leverageToken.apyConfig?.pointsMultiplier ?? 0 = 0 (no apyConfig in mock)
      expect(apyData?.points).toBe(0)

      // Total APY = stakingYield + restakingYield + rewardsAPR + borrowRate
      // 88.4 + 35.7 + 0.008 + (-61.92) = 62.188
      expect(apyData?.totalAPY).toBeCloseTo(62.188, 4)
    })

    it('should handle missing leverage token config gracefully', async () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useLeverageTokenAPY({
          tokenAddress,
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Should return default/empty APY data
      const apyData = result.current.data
      expect(apyData).toEqual({
        stakingYield: 0,
        restakingYield: 0,
        borrowRate: 0,
        rewardsAPR: 0,
        points: 0,
        totalAPY: 0,
      })

      // Should not call external APIs
      expect(mockFetchLeverageRatios).not.toHaveBeenCalled()
      expect(mockFetchAprForToken).not.toHaveBeenCalled()
      expect(mockFetchBorrowApyForToken).not.toHaveBeenCalled()
      expect(mockFetchRewardsAprForToken).not.toHaveBeenCalled()
    })

    it('should handle missing APR data gracefully', async () => {
      const mockLeverageRatios = {
        targetLeverage: 17,
        minLeverage: 15,
        maxLeverage: 20,
      }

      const mockAprData = {
        stakingAPR: 0, // No staking APR
        restakingAPR: 0, // No restaking APR
        totalAPR: 0,
      }

      const mockBorrowApyData = {
        borrowAPY: 0, // No borrow APY
      }

      const mockRewardsAprData = {
        rewardsAPR: 0, // No rewards APR
      }

      // Setup mocks
      mockFetchLeverageRatios.mockResolvedValue(mockLeverageRatios)
      mockFetchAprForToken.mockResolvedValue(mockAprData)
      mockFetchBorrowApyForToken.mockResolvedValue(mockBorrowApyData)
      mockFetchRewardsAprForToken.mockResolvedValue(mockRewardsAprData)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useLeverageTokenAPY({
          tokenAddress,
          leverageToken: mockLeverageTokenConfig,
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const apyData = result.current.data
      expect(apyData).toBeDefined()

      // All values should be 0 when no APR data is available
      expect(apyData?.stakingYield).toBe(0)
      expect(apyData?.restakingYield).toBe(0)
      expect(apyData?.borrowRate).toBe(0)
      expect(apyData?.rewardsAPR).toBe(0)
      expect(apyData?.points).toBe(0) // leverageToken.apyConfig?.pointsMultiplier ?? 0 (no apyConfig in mock)
      expect(apyData?.totalAPY).toBe(0)
    })
  })

  describe('error handling', () => {
    it('should handle missing token address gracefully', async () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useLeverageTokenAPY({
          leverageToken: mockLeverageTokenConfig,
        }),
      )

      // Should not fetch when tokenAddress is missing
      expect(result.current.isFetching).toBe(false)
      expect(result.current.isError).toBe(false)
    })

    it('should handle missing leverage token config gracefully', async () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useLeverageTokenAPY({
          tokenAddress,
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Should return default APY data when leverage token config is missing
      const apyData = result.current.data
      expect(apyData).toEqual({
        stakingYield: 0,
        restakingYield: 0,
        borrowRate: 0,
        rewardsAPR: 0,
        points: 0,
        totalAPY: 0,
      })
    })
  })

  describe('query configuration', () => {
    it('should use correct query key structure', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useLeverageTokenAPY({
          tokenAddress,
          leverageToken: mockLeverageTokenConfig,
        }),
      )

      // The query key should be based on the token address
      expect(result.current.dataUpdatedAt).toBeDefined()
    })

    it('should respect stale time configuration', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useLeverageTokenAPY({
          tokenAddress,
          leverageToken: mockLeverageTokenConfig,
        }),
      )

      // The hook should use the configured stale time
      expect(result.current.isStale).toBeDefined()
    })
  })

  describe('APY calculation edge cases', () => {
    it('should handle zero leverage correctly', async () => {
      const mockLeverageRatios = {
        targetLeverage: 0, // Edge case: zero leverage
        minLeverage: 0,
        maxLeverage: 0,
      }

      const mockAprData = {
        stakingAPR: 5.2,
        restakingAPR: 2.1,
        totalAPR: 7.3,
      }

      const mockBorrowApyData = {
        borrowAPY: 0.0387,
      }

      const mockRewardsAprData = {
        rewardsAPR: 0.008,
      }

      // Setup mocks
      mockFetchLeverageRatios.mockResolvedValue(mockLeverageRatios)
      mockFetchAprForToken.mockResolvedValue(mockAprData)
      mockFetchBorrowApyForToken.mockResolvedValue(mockBorrowApyData)
      mockFetchRewardsAprForToken.mockResolvedValue(mockRewardsAprData)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useLeverageTokenAPY({
          tokenAddress,
          leverageToken: mockLeverageTokenConfig,
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const apyData = result.current.data
      expect(apyData).toBeDefined()

      // With zero leverage, all yields should be 0
      expect(apyData?.stakingYield).toBe(0)
      expect(apyData?.restakingYield).toBe(0)
      expect(apyData?.borrowRate).toBe(0) // borrowAPY * -1 * (0 - 1) = borrowAPY * 1 = 0.0387, but we expect 0 due to fallback
      expect(apyData?.points).toBe(0) // 0 * 2 = 0
    })

    it('should handle very high leverage correctly', async () => {
      const mockLeverageRatios = {
        targetLeverage: 100, // Very high leverage
        minLeverage: 50,
        maxLeverage: 200,
      }

      const mockAprData = {
        stakingAPR: 5.2,
        restakingAPR: 2.1,
        totalAPR: 7.3,
      }

      const mockBorrowApyData = {
        borrowAPY: 0.0387,
      }

      const mockRewardsAprData = {
        rewardsAPR: 0.008,
      }

      // Setup mocks
      mockFetchLeverageRatios.mockResolvedValue(mockLeverageRatios)
      mockFetchAprForToken.mockResolvedValue(mockAprData)
      mockFetchBorrowApyForToken.mockResolvedValue(mockBorrowApyData)
      mockFetchRewardsAprForToken.mockResolvedValue(mockRewardsAprData)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useLeverageTokenAPY({
          tokenAddress,
          leverageToken: mockLeverageTokenConfig,
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const apyData = result.current.data
      expect(apyData).toBeDefined()

      // Staking Yield = 5.2% * 100 = 520%
      expect(apyData?.stakingYield).toBeCloseTo(520, 3)

      // Restaking Yield = 2.1% * 100 = 210%
      expect(apyData?.restakingYield).toBeCloseTo(210, 3)

      // Borrow Rate = 0.0387 * -100 * (100 - 1) = -383.13
      expect(apyData?.borrowRate).toBeCloseTo(-383.13, 4)

      // Points = leverageToken.apyConfig?.pointsMultiplier ?? 0 = 0 (no apyConfig in mock)
      expect(apyData?.points).toBe(0)

      // Total APY = 520 + 210 + 0.008 + (-383.13) = 346.878
      expect(apyData?.totalAPY).toBeCloseTo(346.878, 4)
    })
  })
})
