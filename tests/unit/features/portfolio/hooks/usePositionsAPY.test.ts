import { waitFor } from '@testing-library/react'
import type { Address } from 'viem'
import { base } from 'viem/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { APYBreakdownData } from '@/components/APYBreakdown'
import { fetchAprForToken } from '@/features/leverage-tokens/utils/apy-calculations/apr-providers'
import { fetchBorrowApyForToken } from '@/features/leverage-tokens/utils/apy-calculations/borrow-apy-providers'
import { fetchLeverageRatios } from '@/features/leverage-tokens/utils/apy-calculations/leverage-ratios'
import { fetchRewardsAprForToken } from '@/features/leverage-tokens/utils/apy-calculations/rewards-providers'
import { hasApyBreakdownError, useTokensAPY } from '@/features/portfolio/hooks/usePositionsAPY'
import { hookTestUtils } from '../../../../utils'

const mockFetchAprForToken = vi.mocked(fetchAprForToken)
const mockFetchBorrowApyForToken = vi.mocked(fetchBorrowApyForToken)
const mockFetchLeverageRatios = vi.mocked(fetchLeverageRatios)
const mockFetchRewardsAprForToken = vi.mocked(fetchRewardsAprForToken)

const TOKEN_ADDRESS = '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A' as Address

function setupSuccessMocks(overrides?: {
  leverageRatios?: { targetLeverage: number; minLeverage: number; maxLeverage: number }
  apr?: { stakingAPR: number; restakingAPR: number; totalAPR: number; averagingPeriod?: string }
  borrow?: { borrowAPY: number; utilization?: number; averagingPeriod?: string }
  rewards?: {
    rewardsAPR: number
    rewardTokens?: Array<{
      tokenAddress: Address
      tokenSymbol: string
      tokenDecimals: number
      apr: number
    }>
  }
}) {
  mockFetchLeverageRatios.mockResolvedValue(
    overrides?.leverageRatios ?? { targetLeverage: 3, minLeverage: 2, maxLeverage: 5 },
  )
  mockFetchAprForToken.mockResolvedValue(
    overrides?.apr ?? { stakingAPR: 4.0, restakingAPR: 2.0, totalAPR: 6.0 },
  )
  mockFetchBorrowApyForToken.mockResolvedValue(
    overrides?.borrow ?? { borrowAPY: 0.05, utilization: 0.8 },
  )
  mockFetchRewardsAprForToken.mockResolvedValue(overrides?.rewards ?? { rewardsAPR: 0.01 })
}

describe('useTokensAPY', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('query lifecycle', () => {
    it('should be disabled when tokens array is empty', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() => useTokensAPY({ tokens: [] }))

      expect(result.current.isFetching).toBe(false)
      expect(result.current.data).toBeUndefined()
    })

    it('should be disabled when enabled option is false', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [{ name: 'Test', type: 'leverage-token', address: TOKEN_ADDRESS }],
          enabled: false,
        }),
      )

      expect(result.current.isFetching).toBe(false)
    })

    it('should start loading when enabled with valid tokens', () => {
      setupSuccessMocks()

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [{ name: 'Test', type: 'leverage-token', address: TOKEN_ADDRESS }],
        }),
      )

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('token filtering', () => {
    it('should skip vault-type tokens', async () => {
      setupSuccessMocks()

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [{ name: 'Vault Token', type: 'vault', address: '0xabc' as Address }],
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.size).toBe(0)
      expect(mockFetchAprForToken).not.toHaveBeenCalled()
    })

    it('should skip tokens without an address', async () => {
      setupSuccessMocks()

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [{ name: 'No Address Token', type: 'leverage-token' }],
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.size).toBe(0)
      expect(mockFetchAprForToken).not.toHaveBeenCalled()
    })

    it('should include tokens with type leverage-token and address', async () => {
      setupSuccessMocks()

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [{ name: 'LT', type: 'leverage-token', address: TOKEN_ADDRESS }],
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.size).toBe(1)
    })

    it('should include tokens with chainId (leverage token configs)', async () => {
      setupSuccessMocks()

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [{ name: 'LT Config', chainId: base.id, address: TOKEN_ADDRESS }],
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.size).toBe(1)
    })

    it('should use leverageTokenAddress for position-style tokens', async () => {
      setupSuccessMocks()

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [
            {
              id: 'pos-1',
              name: 'Position',
              type: 'leverage-token',
              leverageTokenAddress: TOKEN_ADDRESS,
            },
          ],
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.has('pos-1')).toBe(true)
      expect(mockFetchLeverageRatios).toHaveBeenCalledWith(TOKEN_ADDRESS, undefined, {})
    })
  })

  describe('APY calculations', () => {
    it('should compute staking/restaking yield, borrow rate, and total APY', async () => {
      setupSuccessMocks({
        leverageRatios: { targetLeverage: 3, minLeverage: 2, maxLeverage: 5 },
        apr: { stakingAPR: 4.0, restakingAPR: 2.0, totalAPR: 6.0 },
        borrow: { borrowAPY: 0.05, utilization: 0.8 },
        rewards: { rewardsAPR: 0.01 },
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [{ name: 'LT', type: 'leverage-token', address: TOKEN_ADDRESS }],
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const apyData = result.current.data?.values().next().value as APYBreakdownData

      // borrowRate = borrowAPY * -1 * (leverage - 1) = 0.05 * -1 * 2 = -0.10
      expect(apyData.borrowRate).toBeCloseTo(-0.1, 5)

      // rewardsAPR = 0.01
      expect(apyData.rewardsAPR).toBeCloseTo(0.01, 5)

      // totalAPY = stakingYield(0) + restakingYield(0) + rewardsAPR + borrowRate
      // Note: the source sets stakingYield/restakingYield to 0 in the output object
      // while calculating them for totalAPY
      // totalAPY = (4/100)*3 + (2/100)*3 + 0.01 + (-0.1) = 0.12 + 0.06 + 0.01 - 0.1 = 0.09
      expect(apyData.totalAPY).toBeCloseTo(0.09, 5)
    })

    it('should default all yields to 0 when leverage is 0', async () => {
      setupSuccessMocks({
        leverageRatios: { targetLeverage: 0, minLeverage: 0, maxLeverage: 0 },
        apr: { stakingAPR: 4.0, restakingAPR: 2.0, totalAPR: 6.0 },
        borrow: { borrowAPY: 0.05 },
        rewards: { rewardsAPR: 0.01 },
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [{ name: 'LT', type: 'leverage-token', address: TOKEN_ADDRESS }],
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const apyData = result.current.data?.values().next().value as APYBreakdownData
      expect(apyData.borrowRate).toBe(0)
      // totalAPY with 0 leverage yields = only rewardsAPR
      expect(apyData.totalAPY).toBeCloseTo(0.01, 5)
    })

    it('should default all yields to 0 when APR values are 0', async () => {
      setupSuccessMocks({
        leverageRatios: { targetLeverage: 3, minLeverage: 2, maxLeverage: 5 },
        apr: { stakingAPR: 0, restakingAPR: 0, totalAPR: 0 },
        borrow: { borrowAPY: 0 },
        rewards: { rewardsAPR: 0 },
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [{ name: 'LT', type: 'leverage-token', address: TOKEN_ADDRESS }],
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const apyData = result.current.data?.values().next().value as APYBreakdownData
      expect(apyData.borrowRate).toBe(0)
      expect(apyData.totalAPY).toBe(0)
    })

    it('should populate raw rates from provider data', async () => {
      setupSuccessMocks({
        apr: { stakingAPR: 5.0, restakingAPR: 3.0, totalAPR: 8.0 },
        borrow: { borrowAPY: 0.04 },
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [{ name: 'LT', type: 'leverage-token', address: TOKEN_ADDRESS }],
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const apyData = result.current.data?.values().next().value as APYBreakdownData
      expect(apyData.raw?.rawStakingYield).toBeCloseTo(0.05, 5)
      expect(apyData.raw?.rawRestakingYield).toBeCloseTo(0.03, 5)
      expect(apyData.raw?.rawBorrowRate).toBeCloseTo(0.04, 5)
    })

    it('should include utilization from borrow data', async () => {
      setupSuccessMocks({
        borrow: { borrowAPY: 0.05, utilization: 0.85 },
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [{ name: 'LT', type: 'leverage-token', address: TOKEN_ADDRESS }],
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const apyData = result.current.data?.values().next().value as APYBreakdownData
      expect(apyData.utilization).toBe(0.85)
    })

    it('should use pointsMultiplier from token config apyConfig', async () => {
      setupSuccessMocks()

      // Use an address not in the mocked leverageTokenConfigs so the code
      // falls through to `token as LeverageTokenConfig`
      const customAddress = '0x0000000000000000000000000000000000000099' as Address

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [
            {
              name: 'LT with points',
              chainId: base.id,
              address: customAddress,
              apyConfig: { pointsMultiplier: 5 },
            } as any,
          ],
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const apyData = result.current.data?.get(customAddress)
      expect(apyData?.points).toBe(5)
    })
  })

  describe('metadata', () => {
    it('should include yield averaging period when present', async () => {
      setupSuccessMocks({
        apr: {
          stakingAPR: 4.0,
          restakingAPR: 2.0,
          totalAPR: 6.0,
          averagingPeriod: '30-day average',
        },
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [{ name: 'LT', type: 'leverage-token', address: TOKEN_ADDRESS }],
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const apyData = result.current.data?.values().next().value as APYBreakdownData
      expect(apyData.metadata?.yieldAveragingPeriod).toBe('30-day average')
    })

    it('should include borrow averaging period when present', async () => {
      setupSuccessMocks({
        borrow: { borrowAPY: 0.05, utilization: 0.8, averagingPeriod: '7-day average' },
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [{ name: 'LT', type: 'leverage-token', address: TOKEN_ADDRESS }],
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const apyData = result.current.data?.values().next().value as APYBreakdownData
      expect(apyData.metadata?.borrowAveragingPeriod).toBe('7-day average')
    })

    it('should omit metadata when no averaging periods are present', async () => {
      setupSuccessMocks({
        apr: { stakingAPR: 4.0, restakingAPR: 2.0, totalAPR: 6.0 },
        borrow: { borrowAPY: 0.05 },
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [{ name: 'LT', type: 'leverage-token', address: TOKEN_ADDRESS }],
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const apyData = result.current.data?.values().next().value as APYBreakdownData
      expect(apyData.metadata).toBeUndefined()
    })
  })

  describe('reward tokens', () => {
    it('should include rewardTokens when provider returns them', async () => {
      const rewardTokens = [
        {
          tokenAddress: '0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85' as Address,
          tokenSymbol: 'SEAM',
          tokenDecimals: 18,
          apr: 0.005,
        },
      ]

      setupSuccessMocks({
        rewards: { rewardsAPR: 0.005, rewardTokens },
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [{ name: 'LT', type: 'leverage-token', address: TOKEN_ADDRESS }],
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const apyData = result.current.data?.values().next().value as APYBreakdownData
      expect(apyData.rewardTokens).toHaveLength(1)
      expect(apyData.rewardTokens?.[0]?.tokenSymbol).toBe('SEAM')
    })

    it('should not include rewardTokens when array is empty', async () => {
      setupSuccessMocks({
        rewards: { rewardsAPR: 0, rewardTokens: [] },
      })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [{ name: 'LT', type: 'leverage-token', address: TOKEN_ADDRESS }],
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const apyData = result.current.data?.values().next().value as APYBreakdownData
      expect(apyData.rewardTokens).toBeUndefined()
    })
  })

  describe('error handling', () => {
    it('should gracefully handle rejected leverage ratios', async () => {
      mockFetchLeverageRatios.mockRejectedValue(new Error('RPC error'))
      mockFetchAprForToken.mockResolvedValue({ stakingAPR: 4.0, restakingAPR: 2.0, totalAPR: 6.0 })
      mockFetchBorrowApyForToken.mockResolvedValue({ borrowAPY: 0.05, utilization: 0.8 })
      mockFetchRewardsAprForToken.mockResolvedValue({ rewardsAPR: 0 })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [{ name: 'LT', type: 'leverage-token', address: TOKEN_ADDRESS }],
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const apyData = result.current.data?.values().next().value as APYBreakdownData
      // targetLeverage defaults to 0 when rejected, so yields are 0
      expect(apyData.borrowRate).toBe(0)
      expect(apyData.totalAPY).toBe(0)
    })

    it('should gracefully handle rejected APR data', async () => {
      mockFetchLeverageRatios.mockResolvedValue({
        targetLeverage: 3,
        minLeverage: 2,
        maxLeverage: 5,
      })
      mockFetchAprForToken.mockRejectedValue(new Error('API down'))
      mockFetchBorrowApyForToken.mockResolvedValue({ borrowAPY: 0.05, utilization: 0.8 })
      mockFetchRewardsAprForToken.mockResolvedValue({ rewardsAPR: 0 })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [{ name: 'LT', type: 'leverage-token', address: TOKEN_ADDRESS }],
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const apyData = result.current.data?.values().next().value as APYBreakdownData
      expect(apyData.raw?.rawStakingYield).toBe(0)
      expect(apyData.raw?.rawRestakingYield).toBe(0)
    })

    it('should record borrow error when borrow provider rejects', async () => {
      mockFetchLeverageRatios.mockResolvedValue({
        targetLeverage: 3,
        minLeverage: 2,
        maxLeverage: 5,
      })
      mockFetchAprForToken.mockResolvedValue({ stakingAPR: 4.0, restakingAPR: 2.0, totalAPR: 6.0 })
      mockFetchBorrowApyForToken.mockRejectedValue(new Error('borrow fetch failed'))
      mockFetchRewardsAprForToken.mockResolvedValue({ rewardsAPR: 0 })

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [{ name: 'LT', type: 'leverage-token', address: TOKEN_ADDRESS }],
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const apyData = result.current.data?.values().next().value as APYBreakdownData
      expect(apyData.errors.borrowRate).toBeInstanceOf(Error)
      expect(apyData.errors.borrowRate?.message).toBe('borrow fetch failed')
      expect(apyData.borrowRate).toBe(0)
      expect(apyData.utilization).toBe(0)
    })

    it('should record rewards error when rewards provider rejects', async () => {
      mockFetchLeverageRatios.mockResolvedValue({
        targetLeverage: 3,
        minLeverage: 2,
        maxLeverage: 5,
      })
      mockFetchAprForToken.mockResolvedValue({ stakingAPR: 4.0, restakingAPR: 2.0, totalAPR: 6.0 })
      mockFetchBorrowApyForToken.mockResolvedValue({ borrowAPY: 0.05, utilization: 0.8 })
      mockFetchRewardsAprForToken.mockRejectedValue(new Error('rewards fetch failed'))

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [{ name: 'LT', type: 'leverage-token', address: TOKEN_ADDRESS }],
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      const apyData = result.current.data?.values().next().value as APYBreakdownData
      expect(apyData.errors.rewardsAPR).toBeInstanceOf(Error)
      expect(apyData.errors.rewardsAPR?.message).toBe('rewards fetch failed')
      expect(apyData.errors.rewardTokens).toBeInstanceOf(Error)
      expect(apyData.errors.rewardTokens?.message).toBe('rewards fetch failed')
      expect(apyData.rewardsAPR).toBe(0)
    })

    it('should return null apyData when no config is found for a token', async () => {
      setupSuccessMocks()

      const unknownAddress = '0x0000000000000000000000000000000000000001' as Address

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [{ name: 'Unknown', type: 'leverage-token', address: unknownAddress }],
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Token has no matching config, so apyData is null and not added to the map
      expect(result.current.data?.size).toBe(0)
    })
  })

  describe('multiple tokens', () => {
    it('should process multiple leverage tokens in parallel', async () => {
      setupSuccessMocks()

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [
            { name: 'Token A', type: 'leverage-token', address: TOKEN_ADDRESS },
            {
              name: 'Token B',
              type: 'leverage-token',
              address: '0x10041DFFBE8fB54Ca4Dfa56F2286680EC98A37c3' as Address,
            },
          ],
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Both tokens should have APY data (both addresses are in the mocked leverageTokenConfigs)
      expect(result.current.data?.size).toBe(2)
    })

    it('should only include leverage tokens and skip vaults in mixed arrays', async () => {
      setupSuccessMocks()

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [
            { name: 'Vault', type: 'vault', address: '0xabc' as Address },
            { name: 'LT', type: 'leverage-token', address: TOKEN_ADDRESS },
          ],
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.size).toBe(1)
    })
  })

  describe('token ID resolution', () => {
    it('should use token.id as map key when available', async () => {
      setupSuccessMocks()

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [
            {
              id: 'my-position-id',
              name: 'Position',
              type: 'leverage-token',
              leverageTokenAddress: TOKEN_ADDRESS,
            },
          ],
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.has('my-position-id')).toBe(true)
    })

    it('should fall back to address when id is not provided', async () => {
      setupSuccessMocks()

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useTokensAPY({
          tokens: [{ name: 'LT', type: 'leverage-token', address: TOKEN_ADDRESS }],
        }),
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data?.has(TOKEN_ADDRESS)).toBe(true)
    })
  })
})

describe('hasApyBreakdownError', () => {
  it('should return true when any error is non-null', () => {
    const data: APYBreakdownData = {
      stakingYield: 0,
      restakingYield: 0,
      borrowRate: 0,
      rewardsAPR: 0,
      points: 0,
      totalAPY: 0,
      errors: {
        borrowRate: new Error('fetch failed'),
      },
    }

    expect(hasApyBreakdownError(data)).toBe(true)
  })

  it('should return false when all errors are null', () => {
    const data: APYBreakdownData = {
      stakingYield: 0,
      restakingYield: 0,
      borrowRate: 0,
      rewardsAPR: 0,
      points: 0,
      totalAPY: 0,
      errors: {
        stakingYield: null,
        restakingYield: null,
        borrowRate: null,
        rewardsAPR: null,
      },
    }

    expect(hasApyBreakdownError(data)).toBe(false)
  })

  it('should return false when errors object is empty', () => {
    const data: APYBreakdownData = {
      stakingYield: 0,
      restakingYield: 0,
      borrowRate: 0,
      rewardsAPR: 0,
      points: 0,
      totalAPY: 0,
      errors: {},
    }

    expect(hasApyBreakdownError(data)).toBe(false)
  })

  it('should return true when multiple errors are present', () => {
    const data: APYBreakdownData = {
      stakingYield: 0,
      restakingYield: 0,
      borrowRate: 0,
      rewardsAPR: 0,
      points: 0,
      totalAPY: 0,
      errors: {
        stakingYield: new Error('staking failed'),
        borrowRate: new Error('borrow failed'),
        rewardsAPR: null,
      },
    }

    expect(hasApyBreakdownError(data)).toBe(true)
  })
})
