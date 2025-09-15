import type { Address } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the EtherFiAprProvider in setup
vi.mock('@/features/leverage-tokens/utils/apy-calculations/apr-providers/etherfi')

// Mock the module to avoid global mock conflicts
vi.mock(
  '@/features/leverage-tokens/utils/apy-calculations/apr-providers',
  async (importOriginal) => {
    const actual = await importOriginal()
    return actual
  },
)

import {
  LeverageTokenKey,
  leverageTokenConfigs,
} from '@/features/leverage-tokens/leverageTokens.config'
import { fetchAprForToken } from '@/features/leverage-tokens/utils/apy-calculations/apr-providers'
import { EtherFiAprProvider } from '@/features/leverage-tokens/utils/apy-calculations/apr-providers/etherfi'

// Mock the EtherFiAprProvider
vi.mocked(EtherFiAprProvider).mockImplementation(() => ({
  protocolId: 'etherfi',
  protocolName: 'Ether.fi',
  fetchApr: vi.fn(),
}))

describe('APR Providers', () => {
  const chainId = 8453

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchAprForToken', () => {
    it('should route to EtherFi provider for supported token on Base', async () => {
      const supportedTokenAddress = leverageTokenConfigs[LeverageTokenKey.WEETH_WETH_17X]
        ?.address as Address
      const mockAprData = {
        sevenDayApr: 5.2,
        sevenDayRestakingApr: 2.1,
        bufferEth: 1000,
        totalAPR: 7.3,
        stakingAPR: 5.2,
        restakingAPR: 2.1,
        metadata: {
          raw: {},
          useRestakingApr: true,
        },
      }

      const mockProviderInstance = {
        protocolId: 'etherfi',
        protocolName: 'Ether.fi',
        fetchApr: vi.fn().mockResolvedValue(mockAprData),
      }

      vi.mocked(EtherFiAprProvider).mockImplementation(() => mockProviderInstance)

      const result = await fetchAprForToken(supportedTokenAddress, chainId)

      expect(result).toEqual(mockAprData)
      expect(EtherFiAprProvider).toHaveBeenCalledTimes(1)
      expect(mockProviderInstance.fetchApr).toHaveBeenCalledWith()
    })

    it('should handle case-insensitive token address matching', async () => {
      const supportedTokenAddress = leverageTokenConfigs[LeverageTokenKey.WEETH_WETH_17X]
        ?.address as Address
      const upperCaseTokenAddress = supportedTokenAddress.toUpperCase() as Address
      const mockAprData = {
        sevenDayApr: 5.2,
        sevenDayRestakingApr: 2.1,
        bufferEth: 1000,
        totalAPR: 7.3,
        stakingAPR: 5.2,
        restakingAPR: 2.1,
        metadata: {
          raw: {},
          useRestakingApr: true,
        },
      }

      const mockProviderInstance = {
        protocolId: 'etherfi',
        protocolName: 'Ether.fi',
        fetchApr: vi.fn().mockResolvedValue(mockAprData),
      }

      vi.mocked(EtherFiAprProvider).mockImplementation(() => mockProviderInstance)

      const result = await fetchAprForToken(upperCaseTokenAddress, chainId)

      expect(result).toEqual(mockAprData)
      expect(mockProviderInstance.fetchApr).toHaveBeenCalledWith()
    })

    it('should throw error for unsupported token address on Base', async () => {
      const unsupportedTokenAddress = '0x1234567890123456789012345678901234567890' as Address

      await expect(fetchAprForToken(unsupportedTokenAddress, chainId)).rejects.toThrow(
        'Unsupported token address: 0x1234567890123456789012345678901234567890',
      )
    })

    it('should throw error for unsupported chain ID', async () => {
      const supportedTokenAddress = leverageTokenConfigs[LeverageTokenKey.WEETH_WETH_17X]
        ?.address as Address
      const unsupportedChainId = 1 // Ethereum

      await expect(fetchAprForToken(supportedTokenAddress, unsupportedChainId)).rejects.toThrow(
        'Unsupported chain ID: 1',
      )
    })

    it('should propagate provider errors', async () => {
      const supportedTokenAddress = leverageTokenConfigs[LeverageTokenKey.WEETH_WETH_17X]
        ?.address as Address
      const providerError = new Error('Provider fetch failed')

      const mockProviderInstance = {
        protocolId: 'etherfi',
        protocolName: 'Ether.fi',
        fetchApr: vi.fn().mockRejectedValue(providerError),
      }

      vi.mocked(EtherFiAprProvider).mockImplementation(() => mockProviderInstance)

      await expect(fetchAprForToken(supportedTokenAddress, chainId)).rejects.toThrow(
        'Provider fetch failed',
      )
    })
  })

  describe('provider selection logic', () => {
    it('should create new provider instance for each call', async () => {
      const supportedTokenAddress = leverageTokenConfigs[LeverageTokenKey.WEETH_WETH_17X]
        ?.address as Address
      const mockAprData = {
        sevenDayApr: 5.2,
        sevenDayRestakingApr: 2.1,
        bufferEth: 1000,
        totalAPR: 7.3,
        stakingAPR: 5.2,
        restakingAPR: 2.1,
        metadata: {
          raw: {},
          useRestakingApr: true,
        },
      }

      const mockProviderInstance = {
        protocolId: 'etherfi',
        protocolName: 'Ether.fi',
        fetchApr: vi.fn().mockResolvedValue(mockAprData),
      }

      vi.mocked(EtherFiAprProvider).mockImplementation(() => mockProviderInstance)

      // Call multiple times
      await fetchAprForToken(supportedTokenAddress, chainId)
      await fetchAprForToken(supportedTokenAddress, chainId)

      // Should create new instance each time
      expect(EtherFiAprProvider).toHaveBeenCalledTimes(2)
    })

    it('should log provider selection', async () => {
      const supportedTokenAddress = leverageTokenConfigs[LeverageTokenKey.WEETH_WETH_17X]
        ?.address as Address
      const mockAprData = {
        sevenDayApr: 5.2,
        sevenDayRestakingApr: 2.1,
        bufferEth: 1000,
        totalAPR: 7.3,
        stakingAPR: 5.2,
        restakingAPR: 2.1,
        metadata: {
          raw: {},
          useRestakingApr: true,
        },
      }

      const mockProviderInstance = {
        protocolId: 'etherfi',
        protocolName: 'Ether.fi',
        fetchApr: vi.fn().mockResolvedValue(mockAprData),
      }

      vi.mocked(EtherFiAprProvider).mockImplementation(() => mockProviderInstance)

      // Mock console.log to verify logging
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await fetchAprForToken(supportedTokenAddress, chainId)

      expect(consoleSpy).toHaveBeenCalledWith(
        `Fetching APR for ${supportedTokenAddress} on chain ${chainId} using Ether.fi`,
      )

      consoleSpy.mockRestore()
    })
  })
})
