import type { Address } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the providers
vi.mock('@/features/leverage-tokens/utils/apy-calculations/apr-providers/etherfi')
vi.mock('@/features/leverage-tokens/utils/apy-calculations/apr-providers/lido')
vi.mock('@/features/leverage-tokens/utils/apy-calculations/apr-providers/defillama')

// Mock leverage token config
vi.mock('@/features/leverage-tokens/leverageTokens.config', () => ({
  getLeverageTokenConfig: vi.fn(),
  leverageTokenConfigs: {},
  LeverageTokenKey: {},
}))

// Mock the module to avoid global mock conflicts
vi.mock(
  '@/features/leverage-tokens/utils/apy-calculations/apr-providers',
  async (importOriginal) => {
    const actual = await importOriginal()
    return actual
  },
)

import type { Mock } from 'vitest'
import {
  getLeverageTokenConfig,
  LeverageTokenKey,
  leverageTokenConfigs,
} from '@/features/leverage-tokens/leverageTokens.config'
import { fetchAprForToken } from '@/features/leverage-tokens/utils/apy-calculations/apr-providers'
import { DefiLlamaAprProvider } from '@/features/leverage-tokens/utils/apy-calculations/apr-providers/defillama'
import { EtherFiAprProvider } from '@/features/leverage-tokens/utils/apy-calculations/apr-providers/etherfi'
import { LidoAprProvider } from '@/features/leverage-tokens/utils/apy-calculations/apr-providers/lido'

// Get the mocked function - cast to Mock to access mock methods
const mockGetLeverageTokenConfig = getLeverageTokenConfig as Mock

// Mock the providers
vi.mocked(EtherFiAprProvider).mockImplementation(() => ({
  protocolId: 'etherfi',
  protocolName: 'Ether.fi',
  fetchApr: vi.fn(),
}))

vi.mocked(LidoAprProvider).mockImplementation(() => ({
  protocolId: 'lido',
  protocolName: 'Lido',
  fetchApr: vi.fn(),
}))

vi.mocked(DefiLlamaAprProvider).mockImplementation(
  () =>
    ({
      protocolId: 'defillama',
      protocolName: 'DeFi Llama',
      fetchApr: vi.fn(),
    }) as any,
)

describe('APR Providers', () => {
  const chainId = 8453

  beforeEach(() => {
    // Clear call history but preserve mock implementations
    vi.mocked(EtherFiAprProvider).mockClear()
    vi.mocked(LidoAprProvider).mockClear()
    vi.mocked(DefiLlamaAprProvider).mockClear()
    mockGetLeverageTokenConfig.mockClear()
    // Reset provider mocks
    vi.mocked(EtherFiAprProvider).mockImplementation(() => ({
      protocolId: 'etherfi',
      protocolName: 'Ether.fi',
      fetchApr: vi.fn(),
    }))
    vi.mocked(LidoAprProvider).mockImplementation(() => ({
      protocolId: 'lido',
      protocolName: 'Lido',
      fetchApr: vi.fn(),
    }))
    vi.mocked(DefiLlamaAprProvider).mockImplementation(
      () =>
        ({
          protocolId: 'defillama',
          protocolName: 'DeFi Llama',
          fetchApr: vi.fn(),
        }) as any,
    )
    // Default to EtherFi provider (when config is null or no provider specified)
    // Use mockReset to clear previous return values, then set default
    mockGetLeverageTokenConfig.mockReset()
    mockGetLeverageTokenConfig.mockReturnValue(null)
  })

  describe('fetchAprForToken', () => {
    it('should route to EtherFi provider for supported token on Base', async () => {
      const supportedTokenAddress = (leverageTokenConfigs[LeverageTokenKey.WSTETH_ETH_2X_MAINNET]
        ?.address ?? '0x10041DFFBE8fB54Ca4Dfa56F2286680EC98A37c3') as Address
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
      const supportedTokenAddress = (leverageTokenConfigs[LeverageTokenKey.WSTETH_ETH_2X_MAINNET]
        ?.address ?? '0x10041DFFBE8fB54Ca4Dfa56F2286680EC98A37c3') as Address
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

    it('should work for any token address on Base', async () => {
      const unsupportedTokenAddress = '0x1234567890123456789012345678901234567890' as Address
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

      const result = await fetchAprForToken(unsupportedTokenAddress, chainId)

      expect(result).toEqual(mockAprData)
      expect(mockProviderInstance.fetchApr).toHaveBeenCalledWith()
    })

    it('should work for Ethereum chain ID', async () => {
      const supportedTokenAddress = (leverageTokenConfigs[LeverageTokenKey.WSTETH_ETH_2X_MAINNET]
        ?.address ?? '0x10041DFFBE8fB54Ca4Dfa56F2286680EC98A37c3') as Address
      const ethereumChainId = 1 // Ethereum
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

      const result = await fetchAprForToken(supportedTokenAddress, ethereumChainId)

      expect(result).toEqual(mockAprData)
      expect(mockProviderInstance.fetchApr).toHaveBeenCalledWith()
    })

    it('should propagate provider errors', async () => {
      const supportedTokenAddress = (leverageTokenConfigs[LeverageTokenKey.WSTETH_ETH_2X_MAINNET]
        ?.address ?? '0x10041DFFBE8fB54Ca4Dfa56F2286680EC98A37c3') as Address
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

    it('should route to Lido provider when configured', async () => {
      const tokenAddress = '0x1234567890123456789012345678901234567890' as Address
      const mockAprData = {
        stakingAPR: 3.5,
        restakingAPR: 0,
        totalAPR: 3.5,
        averagingPeriod: '24-hour average' as const,
      }

      // Set mock return value - must be set before the function is called
      mockGetLeverageTokenConfig.mockReturnValue({
        apyConfig: {
          aprProvider: {
            type: 'lido' as const,
          },
        },
      } as any)

      const mockProviderInstance = {
        protocolId: 'lido',
        protocolName: 'Lido',
        fetchApr: vi.fn().mockResolvedValue(mockAprData),
      }

      vi.mocked(LidoAprProvider).mockImplementation(() => mockProviderInstance)

      const result = await fetchAprForToken(tokenAddress, chainId)

      expect(result).toEqual(mockAprData)
      expect(mockGetLeverageTokenConfig).toHaveBeenCalledWith(tokenAddress, chainId)
      expect(LidoAprProvider).toHaveBeenCalledTimes(1)
      expect(mockProviderInstance.fetchApr).toHaveBeenCalledWith()
    })

    it('should route to DeFi Llama provider when configured with ID', async () => {
      const tokenAddress = '0x1234567890123456789012345678901234567890' as Address
      const protocolId = 'test-protocol-id'
      const mockAprData = {
        stakingAPR: 4.2,
        restakingAPR: 0,
        totalAPR: 4.2,
        averagingPeriod: '24-hour average' as const,
      }

      // Set mock return value - must be set before the function is called
      mockGetLeverageTokenConfig.mockReturnValue({
        apyConfig: {
          aprProvider: {
            type: 'defillama' as const,
            id: protocolId,
          },
        },
      } as any)

      const mockProviderInstance = {
        protocolId: 'defillama',
        protocolName: 'DeFi Llama',
        fetchApr: vi.fn().mockResolvedValue(mockAprData),
      } as any

      vi.mocked(DefiLlamaAprProvider).mockImplementation(() => mockProviderInstance)

      const result = await fetchAprForToken(tokenAddress, chainId)

      expect(result).toEqual(mockAprData)
      expect(mockGetLeverageTokenConfig).toHaveBeenCalledWith(tokenAddress, chainId)
      expect(DefiLlamaAprProvider).toHaveBeenCalledWith(protocolId)
      expect(mockProviderInstance.fetchApr).toHaveBeenCalledWith()
    })

    it('should throw error when DeFi Llama provider is missing ID', async () => {
      const tokenAddress = '0x1234567890123456789012345678901234567890' as Address

      // Set mock return value - must be set before the function is called
      mockGetLeverageTokenConfig.mockReturnValue({
        apyConfig: {
          aprProvider: {
            type: 'defillama' as const,
            // id is missing/undefined
          },
        },
      } as any)

      await expect(fetchAprForToken(tokenAddress, chainId)).rejects.toThrow(
        'DeFi Llama provider requires protocol ID',
      )
      expect(mockGetLeverageTokenConfig).toHaveBeenCalledWith(tokenAddress, chainId)
    })

    it('should default to EtherFi when config is null', async () => {
      const tokenAddress = '0x1234567890123456789012345678901234567890' as Address
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

      mockGetLeverageTokenConfig.mockReturnValue(null)

      const mockProviderInstance = {
        protocolId: 'etherfi',
        protocolName: 'Ether.fi',
        fetchApr: vi.fn().mockResolvedValue(mockAprData),
      }

      vi.mocked(EtherFiAprProvider).mockImplementation(() => mockProviderInstance)

      const result = await fetchAprForToken(tokenAddress, chainId)

      expect(result).toEqual(mockAprData)
      expect(EtherFiAprProvider).toHaveBeenCalledTimes(1)
      expect(mockProviderInstance.fetchApr).toHaveBeenCalledWith()
    })

    it('should default to EtherFi when config exists but apyConfig is missing', async () => {
      const tokenAddress = '0x1234567890123456789012345678901234567890' as Address
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

      mockGetLeverageTokenConfig.mockReturnValue({
        // apyConfig is missing
        address: tokenAddress,
        chainId,
      })

      const mockProviderInstance = {
        protocolId: 'etherfi',
        protocolName: 'Ether.fi',
        fetchApr: vi.fn().mockResolvedValue(mockAprData),
      }

      vi.mocked(EtherFiAprProvider).mockImplementation(() => mockProviderInstance)

      const result = await fetchAprForToken(tokenAddress, chainId)

      expect(result).toEqual(mockAprData)
      expect(EtherFiAprProvider).toHaveBeenCalledTimes(1)
      expect(mockProviderInstance.fetchApr).toHaveBeenCalledWith()
    })

    it('should default to EtherFi when apyConfig exists but aprProvider is missing', async () => {
      const tokenAddress = '0x1234567890123456789012345678901234567890' as Address
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

      mockGetLeverageTokenConfig.mockReturnValue({
        apyConfig: {
          // aprProvider is missing
        },
      })

      const mockProviderInstance = {
        protocolId: 'etherfi',
        protocolName: 'Ether.fi',
        fetchApr: vi.fn().mockResolvedValue(mockAprData),
      }

      vi.mocked(EtherFiAprProvider).mockImplementation(() => mockProviderInstance)

      const result = await fetchAprForToken(tokenAddress, chainId)

      expect(result).toEqual(mockAprData)
      expect(EtherFiAprProvider).toHaveBeenCalledTimes(1)
      expect(mockProviderInstance.fetchApr).toHaveBeenCalledWith()
    })
  })

  describe('provider selection logic', () => {
    it('should create new provider instance for each call', async () => {
      const supportedTokenAddress = (leverageTokenConfigs[LeverageTokenKey.WSTETH_ETH_2X_MAINNET]
        ?.address ?? '0x10041DFFBE8fB54Ca4Dfa56F2286680EC98A37c3') as Address
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
      const supportedTokenAddress = (leverageTokenConfigs[LeverageTokenKey.WSTETH_ETH_2X_MAINNET]
        ?.address ?? '0x10041DFFBE8fB54Ca4Dfa56F2286680EC98A37c3') as Address
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

      expect(consoleSpy).toHaveBeenCalledWith('[apr-provider] Fetching APR using Ether.fi', {
        chainId,
        tokenAddress: supportedTokenAddress,
      })

      consoleSpy.mockRestore()
    })
  })
})
