import type { Address } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the module to avoid global mock conflicts
vi.mock(
  '@/features/leverage-tokens/utils/apy-calculations/rewards-providers',
  async (importOriginal) => {
    const actual = await importOriginal()
    return actual
  },
)

import { fetchGenericRewardsApr } from '@/features/leverage-tokens/utils/apy-calculations/rewards-providers'

describe('Rewards Providers', () => {
  const tokenAddress = '0xA2fceEAe99d2cAeEe978DA27bE2d95b0381dBB8c' as Address
  const chainId = 8453

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchGenericRewardsApr', () => {
    it('should return zero rewards APR for Base chain', async () => {
      const result = await fetchGenericRewardsApr({ chainId, tokenAddress })

      expect(result).toEqual({
        rewardsAPR: 0,
      })
    })

    it('should log the placeholder behavior', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await fetchGenericRewardsApr({ chainId, tokenAddress })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Fetching rewards APR for Base chain, token:',
        tokenAddress,
      )
      expect(consoleSpy).toHaveBeenCalledWith('Returning 0% rewards APR (placeholder)')

      consoleSpy.mockRestore()
    })

    it('should handle different token addresses', async () => {
      const differentTokenAddress = '0x1234567890123456789012345678901234567890' as Address

      const result = await fetchGenericRewardsApr({ chainId, tokenAddress: differentTokenAddress })

      expect(result).toEqual({
        rewardsAPR: 0,
      })
    })

    it('should throw error for unsupported chain ID', async () => {
      const unsupportedChainId = 1 // Ethereum

      await expect(
        fetchGenericRewardsApr({ chainId: unsupportedChainId, tokenAddress }),
      ).rejects.toThrow('No rewards APR provider found for chain ID: 1')
    })

    it('should throw error for unsupported chain ID 2', async () => {
      const unsupportedChainId = 137 // Polygon

      await expect(
        fetchGenericRewardsApr({ chainId: unsupportedChainId, tokenAddress }),
      ).rejects.toThrow('No rewards APR provider found for chain ID: 137')
    })

    it('should handle case where chain ID is 0', async () => {
      const chainIdZero = 0

      await expect(fetchGenericRewardsApr({ chainId: chainIdZero, tokenAddress })).rejects.toThrow(
        'No rewards APR provider found for chain ID: 0',
      )
    })

    it('should handle negative chain ID', async () => {
      const negativeChainId = -1

      await expect(
        fetchGenericRewardsApr({ chainId: negativeChainId, tokenAddress }),
      ).rejects.toThrow('No rewards APR provider found for chain ID: -1')
    })
  })

  describe('BaseRewardsAprProvider', () => {
    it('should always return zero rewards APR', async () => {
      // Test multiple calls to ensure consistent behavior
      const results = await Promise.all([
        fetchGenericRewardsApr({ chainId, tokenAddress }),
        fetchGenericRewardsApr({ chainId, tokenAddress }),
        fetchGenericRewardsApr({ chainId, tokenAddress }),
      ])

      results.forEach((result) => {
        expect(result).toEqual({
          rewardsAPR: 0,
        })
      })
    })

    it('should be consistent across different token addresses', async () => {
      const tokenAddresses = [
        '0xA2fceEAe99d2cAeEe978DA27bE2d95b0381dBB8c' as Address,
        '0x1234567890123456789012345678901234567890' as Address,
        '0x9876543210987654321098765432109876543210' as Address,
      ]

      const results = await Promise.all(
        tokenAddresses.map((addr) => fetchGenericRewardsApr({ chainId, tokenAddress: addr })),
      )

      results.forEach((result) => {
        expect(result).toEqual({
          rewardsAPR: 0,
        })
      })
    })
  })

  describe('provider selection logic', () => {
    it('should use BaseRewardsAprProvider for Base chain', async () => {
      const result = await fetchGenericRewardsApr({ chainId, tokenAddress })

      expect(result).toEqual({
        rewardsAPR: 0,
      })
    })

    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        fetchGenericRewardsApr({
          chainId,
          tokenAddress: `0x${i.toString().padStart(40, '0')}` as Address,
        }),
      )

      const results = await Promise.all(requests)

      results.forEach((result) => {
        expect(result).toEqual({
          rewardsAPR: 0,
        })
      })
    })
  })

  describe('future extensibility', () => {
    it('should be easy to add new chain support', async () => {
      // This test documents the expected behavior when new chains are added
      // Currently only Base (8453) is supported
      const supportedChains = [8453]
      const unsupportedChains = [1, 137, 56, 42161] // Ethereum, Polygon, BSC, Arbitrum

      // Test supported chain
      for (const chainId of supportedChains) {
        const result = await fetchGenericRewardsApr({ chainId, tokenAddress })
        expect(result).toEqual({ rewardsAPR: 0 })
      }

      // Test unsupported chains
      for (const chainId of unsupportedChains) {
        await expect(fetchGenericRewardsApr({ chainId, tokenAddress })).rejects.toThrow(
          `No rewards APR provider found for chain ID: ${chainId}`,
        )
      }
    })
  })
})
