import type { Address } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Config } from 'wagmi'

// Mock the MorphoBorrowApyProvider
vi.mock('@/features/leverage-tokens/utils/apy-calculations/borrow-apy-providers/morpho')

// Mock the module to avoid global mock conflicts
vi.mock(
  '@/features/leverage-tokens/utils/apy-calculations/borrow-apy-providers',
  async (importOriginal) => {
    const actual = await importOriginal()
    return actual
  },
)

import {
  LeverageTokenKey,
  leverageTokenConfigs,
} from '@/features/leverage-tokens/leverageTokens.config'
import {
  fetchBorrowApyForToken,
  fetchGenericBorrowApy,
} from '@/features/leverage-tokens/utils/apy-calculations/borrow-apy-providers'
import { MorphoBorrowApyProvider } from '@/features/leverage-tokens/utils/apy-calculations/borrow-apy-providers/morpho'

// Mock the MorphoBorrowApyProvider
vi.mocked(MorphoBorrowApyProvider).mockImplementation(() => ({
  protocolId: 'morpho',
  protocolName: 'Morpho',
  fetchBorrowApy: vi.fn(),
}))

describe('Borrow APY Providers', () => {
  const mockConfig = {} as Config
  const chainId = 8453

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchGenericBorrowApy', () => {
    it('should route to Morpho provider for supported token on Base', async () => {
      const supportedTokenAddress = leverageTokenConfigs[LeverageTokenKey.WEETH_WETH_17X]
        ?.address as Address
      const mockBorrowApyData = { borrowAPY: 0.0387 }

      const mockProviderInstance = {
        protocolId: 'morpho',
        protocolName: 'Morpho',
        fetchBorrowApy: vi.fn().mockResolvedValue(mockBorrowApyData),
      }

      vi.mocked(MorphoBorrowApyProvider).mockImplementation(() => mockProviderInstance)

      const result = await fetchGenericBorrowApy(supportedTokenAddress, chainId, mockConfig)

      expect(result).toEqual(mockBorrowApyData)
      expect(MorphoBorrowApyProvider).toHaveBeenCalledTimes(1)
      expect(mockProviderInstance.fetchBorrowApy).toHaveBeenCalledWith(
        supportedTokenAddress,
        chainId,
        mockConfig,
      )
    })

    it('should handle case-insensitive token address matching', async () => {
      const supportedTokenAddress = leverageTokenConfigs[LeverageTokenKey.WEETH_WETH_17X]
        ?.address as Address
      const upperCaseTokenAddress = supportedTokenAddress.toUpperCase() as Address
      const mockBorrowApyData = { borrowAPY: 0.0387 }

      const mockProviderInstance = {
        protocolId: 'morpho',
        protocolName: 'Morpho',
        fetchBorrowApy: vi.fn().mockResolvedValue(mockBorrowApyData),
      }

      vi.mocked(MorphoBorrowApyProvider).mockImplementation(() => mockProviderInstance)

      const result = await fetchGenericBorrowApy(upperCaseTokenAddress, chainId, mockConfig)

      expect(result).toEqual(mockBorrowApyData)
      expect(mockProviderInstance.fetchBorrowApy).toHaveBeenCalledWith(
        upperCaseTokenAddress,
        chainId,
        mockConfig,
      )
    })

    it('should throw error for unsupported token address on Base', async () => {
      const unsupportedTokenAddress = '0x1234567890123456789012345678901234567890' as Address

      await expect(
        fetchGenericBorrowApy(unsupportedTokenAddress, chainId, mockConfig),
      ).rejects.toThrow(
        'Unsupported token address for borrow APY: 0x1234567890123456789012345678901234567890',
      )
    })

    it('should throw error for unsupported chain ID', async () => {
      const supportedTokenAddress = leverageTokenConfigs[LeverageTokenKey.WEETH_WETH_17X]
        ?.address as Address
      const unsupportedChainId = 1 // Ethereum

      await expect(
        fetchGenericBorrowApy(supportedTokenAddress, unsupportedChainId, mockConfig),
      ).rejects.toThrow('Unsupported chain ID for borrow APY: 1')
    })

    it('should propagate provider errors', async () => {
      const supportedTokenAddress = leverageTokenConfigs[LeverageTokenKey.WEETH_WETH_17X]
        ?.address as Address
      const providerError = new Error('Provider fetch failed')

      const mockProviderInstance = {
        protocolId: 'morpho',
        protocolName: 'Morpho',
        fetchBorrowApy: vi.fn().mockRejectedValue(providerError),
      }

      vi.mocked(MorphoBorrowApyProvider).mockImplementation(() => mockProviderInstance)

      await expect(
        fetchGenericBorrowApy(supportedTokenAddress, chainId, mockConfig),
      ).rejects.toThrow('Provider fetch failed')
    })
  })

  describe('fetchBorrowApyForToken', () => {
    it('should be a wrapper around fetchGenericBorrowApy', async () => {
      const supportedTokenAddress = leverageTokenConfigs[LeverageTokenKey.WEETH_WETH_17X]
        ?.address as Address
      const mockBorrowApyData = { borrowAPY: 0.0387 }

      const mockProviderInstance = {
        protocolId: 'morpho',
        protocolName: 'Morpho',
        fetchBorrowApy: vi.fn().mockResolvedValue(mockBorrowApyData),
      }

      vi.mocked(MorphoBorrowApyProvider).mockImplementation(() => mockProviderInstance)

      const result = await fetchBorrowApyForToken(supportedTokenAddress, chainId, mockConfig)

      expect(result).toEqual(mockBorrowApyData)
      expect(mockProviderInstance.fetchBorrowApy).toHaveBeenCalledWith(
        supportedTokenAddress,
        chainId,
        mockConfig,
      )
    })

    it('should pass through all parameters correctly', async () => {
      const supportedTokenAddress = leverageTokenConfigs[LeverageTokenKey.WEETH_WETH_17X]
        ?.address as Address
      const mockBorrowApyData = { borrowAPY: 0.025 }

      const mockProviderInstance = {
        protocolId: 'morpho',
        protocolName: 'Morpho',
        fetchBorrowApy: vi.fn().mockResolvedValue(mockBorrowApyData),
      }

      vi.mocked(MorphoBorrowApyProvider).mockImplementation(() => mockProviderInstance)

      await fetchBorrowApyForToken(supportedTokenAddress, chainId, mockConfig)

      expect(mockProviderInstance.fetchBorrowApy).toHaveBeenCalledWith(
        supportedTokenAddress,
        chainId,
        mockConfig,
      )
    })
  })

  describe('provider selection logic', () => {
    it('should create new provider instance for each call', async () => {
      const supportedTokenAddress = leverageTokenConfigs[LeverageTokenKey.WEETH_WETH_17X]
        ?.address as Address
      const mockBorrowApyData = { borrowAPY: 0.0387 }

      const mockProviderInstance = {
        protocolId: 'morpho',
        protocolName: 'Morpho',
        fetchBorrowApy: vi.fn().mockResolvedValue(mockBorrowApyData),
      }

      vi.mocked(MorphoBorrowApyProvider).mockImplementation(() => mockProviderInstance)

      // Call multiple times
      await fetchGenericBorrowApy(supportedTokenAddress, chainId, mockConfig)
      await fetchGenericBorrowApy(supportedTokenAddress, chainId, mockConfig)

      // Should create new instance each time
      expect(MorphoBorrowApyProvider).toHaveBeenCalledTimes(2)
    })

    it('should log provider selection', async () => {
      const supportedTokenAddress = leverageTokenConfigs[LeverageTokenKey.WEETH_WETH_17X]
        ?.address as Address
      const mockBorrowApyData = { borrowAPY: 0.0387 }

      const mockProviderInstance = {
        protocolId: 'morpho',
        protocolName: 'Morpho',
        fetchBorrowApy: vi.fn().mockResolvedValue(mockBorrowApyData),
      }

      vi.mocked(MorphoBorrowApyProvider).mockImplementation(() => mockProviderInstance)

      // Mock console.log to verify logging
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await fetchGenericBorrowApy(supportedTokenAddress, chainId, mockConfig)

      expect(consoleSpy).toHaveBeenCalledWith(
        `Fetching borrow APY for ${supportedTokenAddress} on chain ${chainId} using Morpho`,
      )

      consoleSpy.mockRestore()
    })
  })
})
