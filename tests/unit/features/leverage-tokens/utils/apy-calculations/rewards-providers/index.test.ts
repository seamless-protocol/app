import type { Address } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the providers
vi.mock('@/features/leverage-tokens/utils/apy-calculations/rewards-providers/merkl')

// Mock leverage token config
vi.mock('@/features/leverage-tokens/leverageTokens.config', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/leverage-tokens/leverageTokens.config')>()
  return {
    ...actual,
    getLeverageTokenConfig: vi.fn(),
  }
})

// Mock apr-providers to avoid dependency issues
vi.mock(
  '@/features/leverage-tokens/utils/apy-calculations/apr-providers',
  async (importOriginal) => {
    const actual = await importOriginal()
    return actual
  },
)

// Mock the module to avoid global mock conflicts
vi.mock(
  '@/features/leverage-tokens/utils/apy-calculations/rewards-providers',
  async (importOriginal) => {
    const actual = await importOriginal()
    return actual
  },
)

import type { Mock } from 'vitest'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { fetchRewardsAprForToken } from '@/features/leverage-tokens/utils/apy-calculations/rewards-providers'
import { MerklRewardsAprProvider } from '@/features/leverage-tokens/utils/apy-calculations/rewards-providers/merkl'

const mockGetLeverageTokenConfig = getLeverageTokenConfig as Mock

// Mock the provider
vi.mocked(MerklRewardsAprProvider).mockImplementation(
  () =>
    ({
      protocolId: 'merkl',
      protocolName: 'Merkl',
      fetchRewardsApr: vi.fn(),
    }) as any,
)

describe('Rewards Providers', () => {
  const tokenAddress = '0xA2fceEAe99d2cAeEe978DA27bE2d95b0381dBB8c' as Address
  const chainId = 8453

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset provider mock
    vi.mocked(MerklRewardsAprProvider).mockImplementation(
      () =>
        ({
          protocolId: 'merkl',
          protocolName: 'Merkl',
          fetchRewardsApr: vi.fn(),
        }) as any,
    )
    // Default to null config (will default to Merkl)
    mockGetLeverageTokenConfig.mockReset()
    mockGetLeverageTokenConfig.mockReturnValue(null)
  })

  describe('fetchRewardsAprForToken', () => {
    it('should route to Merkl provider when config is null', async () => {
      const mockAprData = {
        rewardsAPR: 0.05,
        rewardTokens: [],
      }

      mockGetLeverageTokenConfig.mockReturnValue(null)

      const mockProviderInstance = {
        protocolId: 'merkl',
        protocolName: 'Merkl',
        fetchRewardsApr: vi.fn().mockResolvedValue(mockAprData),
      }

      vi.mocked(MerklRewardsAprProvider).mockImplementation(() => mockProviderInstance as any)

      const result = await fetchRewardsAprForToken(tokenAddress, chainId)

      expect(result).toEqual(mockAprData)
      expect(MerklRewardsAprProvider).toHaveBeenCalledTimes(1)
      expect(mockProviderInstance.fetchRewardsApr).toHaveBeenCalledWith(tokenAddress)
    })

    it('should route to Merkl provider when config exists but apyConfig is missing', async () => {
      const mockAprData = {
        rewardsAPR: 0.05,
        rewardTokens: [],
      }

      mockGetLeverageTokenConfig.mockReturnValue({
        address: tokenAddress,
        chainId,
        // apyConfig is missing
      })

      const mockProviderInstance = {
        protocolId: 'merkl',
        protocolName: 'Merkl',
        fetchRewardsApr: vi.fn().mockResolvedValue(mockAprData),
      }

      vi.mocked(MerklRewardsAprProvider).mockImplementation(() => mockProviderInstance as any)

      const result = await fetchRewardsAprForToken(tokenAddress, chainId)

      expect(result).toEqual(mockAprData)
      expect(MerklRewardsAprProvider).toHaveBeenCalledTimes(1)
      expect(mockProviderInstance.fetchRewardsApr).toHaveBeenCalledWith(tokenAddress)
    })

    it('should route to Merkl provider when apyConfig exists but rewardsProvider is missing', async () => {
      const mockAprData = {
        rewardsAPR: 0.05,
        rewardTokens: [],
      }

      mockGetLeverageTokenConfig.mockReturnValue({
        apyConfig: {
          // rewardsProvider is missing
        },
      })

      const mockProviderInstance = {
        protocolId: 'merkl',
        protocolName: 'Merkl',
        fetchRewardsApr: vi.fn().mockResolvedValue(mockAprData),
      }

      vi.mocked(MerklRewardsAprProvider).mockImplementation(() => mockProviderInstance as any)

      const result = await fetchRewardsAprForToken(tokenAddress, chainId)

      expect(result).toEqual(mockAprData)
      expect(MerklRewardsAprProvider).toHaveBeenCalledTimes(1)
      expect(mockProviderInstance.fetchRewardsApr).toHaveBeenCalledWith(tokenAddress)
    })

    it('should route to Merkl provider when rewardsProvider exists but type is missing', async () => {
      const mockAprData = {
        rewardsAPR: 0.05,
        rewardTokens: [],
      }

      mockGetLeverageTokenConfig.mockReturnValue({
        apyConfig: {
          rewardsProvider: {
            // type is missing
          },
        },
      })

      const mockProviderInstance = {
        protocolId: 'merkl',
        protocolName: 'Merkl',
        fetchRewardsApr: vi.fn().mockResolvedValue(mockAprData),
      }

      vi.mocked(MerklRewardsAprProvider).mockImplementation(() => mockProviderInstance as any)

      const result = await fetchRewardsAprForToken(tokenAddress, chainId)

      expect(result).toEqual(mockAprData)
      expect(MerklRewardsAprProvider).toHaveBeenCalledTimes(1)
      expect(mockProviderInstance.fetchRewardsApr).toHaveBeenCalledWith(tokenAddress)
    })

    it('should route to Merkl provider for any token address', async () => {
      const differentTokenAddress = '0x1234567890123456789012345678901234567890' as Address
      const mockAprData = {
        rewardsAPR: 0.05,
        rewardTokens: [],
      }

      mockGetLeverageTokenConfig.mockReturnValue(null)

      const mockProviderInstance = {
        protocolId: 'merkl',
        protocolName: 'Merkl',
        fetchRewardsApr: vi.fn().mockResolvedValue(mockAprData),
      }

      vi.mocked(MerklRewardsAprProvider).mockImplementation(() => mockProviderInstance as any)

      const result = await fetchRewardsAprForToken(differentTokenAddress, chainId)

      expect(result).toEqual(mockAprData)
      expect(MerklRewardsAprProvider).toHaveBeenCalledTimes(1)
      expect(mockProviderInstance.fetchRewardsApr).toHaveBeenCalledWith(differentTokenAddress)
    })

    it('should work for different chain IDs', async () => {
      const ethereumChainId = 1
      const mockAprData = {
        rewardsAPR: 0.05,
        rewardTokens: [],
      }

      mockGetLeverageTokenConfig.mockReturnValue(null)

      const mockProviderInstance = {
        protocolId: 'merkl',
        protocolName: 'Merkl',
        fetchRewardsApr: vi.fn().mockResolvedValue(mockAprData),
      }

      vi.mocked(MerklRewardsAprProvider).mockImplementation(() => mockProviderInstance as any)

      const result = await fetchRewardsAprForToken(tokenAddress, ethereumChainId)

      expect(result).toEqual(mockAprData)
      expect(MerklRewardsAprProvider).toHaveBeenCalledTimes(1)
      expect(mockProviderInstance.fetchRewardsApr).toHaveBeenCalledWith(tokenAddress)
    })

    it('should propagate provider errors', async () => {
      const providerError = new Error('Provider fetch failed')

      mockGetLeverageTokenConfig.mockReturnValue(null)

      const mockProviderInstance = {
        protocolId: 'merkl',
        protocolName: 'Merkl',
        fetchRewardsApr: vi.fn().mockRejectedValue(providerError),
      }

      vi.mocked(MerklRewardsAprProvider).mockImplementation(() => mockProviderInstance as any)

      await expect(fetchRewardsAprForToken(tokenAddress, chainId)).rejects.toThrow(
        'Provider fetch failed',
      )
    })

    it('should create new provider instance for each call', async () => {
      const mockAprData = {
        rewardsAPR: 0.05,
        rewardTokens: [],
      }

      mockGetLeverageTokenConfig.mockReturnValue(null)

      const mockProviderInstance = {
        protocolId: 'merkl',
        protocolName: 'Merkl',
        fetchRewardsApr: vi.fn().mockResolvedValue(mockAprData),
      }

      vi.mocked(MerklRewardsAprProvider).mockImplementation(() => mockProviderInstance as any)

      // Call multiple times
      await fetchRewardsAprForToken(tokenAddress, chainId)
      await fetchRewardsAprForToken(tokenAddress, chainId)

      // Should create new instance each time
      expect(MerklRewardsAprProvider).toHaveBeenCalledTimes(2)
    })
  })
})
