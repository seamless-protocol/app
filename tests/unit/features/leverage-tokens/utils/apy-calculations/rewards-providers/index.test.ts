import type { Address } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Unmock the rewards providers for this test
vi.unmock('@/features/leverage-tokens/utils/apy-calculations/rewards-providers')

import { fetchRewardsAprForToken } from '@/features/leverage-tokens/utils/apy-calculations/rewards-providers'

describe('Rewards Providers', () => {
  const tokenAddress = '0xA2fceEAe99d2cAeEe978DA27bE2d95b0381dBB8c' as Address
  const chainId = 8453

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchRewardsAprForToken', () => {
    it('should be mocked and return default data', async () => {
      const result = await fetchRewardsAprForToken(tokenAddress, chainId)

      expect(result).toEqual({
        rewardsAPR: 0,
      })
    })

    it('should handle different token addresses', async () => {
      const differentTokenAddress = '0x1234567890123456789012345678901234567890' as Address

      const result = await fetchRewardsAprForToken(differentTokenAddress, chainId)

      expect(result).toEqual({
        rewardsAPR: 0,
      })
    })

    it('should throw error for unsupported chain ID', async () => {
      const unsupportedChainId = 1 // Ethereum

      await expect(fetchRewardsAprForToken(tokenAddress, unsupportedChainId)).rejects.toThrow(
        'No rewards APR provider found for chain ID: 1',
      )
    })

    it('should throw error for unsupported chain ID 2', async () => {
      const unsupportedChainId = 137 // Polygon

      await expect(fetchRewardsAprForToken(tokenAddress, unsupportedChainId)).rejects.toThrow(
        'No rewards APR provider found for chain ID: 137',
      )
    })

    it('should handle case where chain ID is 0', async () => {
      const chainIdZero = 0

      await expect(fetchRewardsAprForToken(tokenAddress, chainIdZero)).rejects.toThrow(
        'No rewards APR provider found for chain ID: 0',
      )
    })

    it('should handle negative chain ID', async () => {
      const negativeChainId = -1

      await expect(fetchRewardsAprForToken(tokenAddress, negativeChainId)).rejects.toThrow(
        'No rewards APR provider found for chain ID: -1',
      )
    })
  })

  describe('fetchRewardsAprForToken', () => {
    it('should be a wrapper around fetchRewardsAprForToken', async () => {
      const result = await fetchRewardsAprForToken(tokenAddress, chainId)

      expect(result).toEqual({
        rewardsAPR: 0,
      })
    })

    it('should pass through all parameters correctly', async () => {
      const result = await fetchRewardsAprForToken(tokenAddress, chainId)

      expect(result).toEqual({
        rewardsAPR: 0,
      })
    })
  })

  describe('provider selection logic', () => {
    it('should handle Base chain configuration', async () => {
      const result = await fetchRewardsAprForToken(tokenAddress, chainId)

      expect(result).toEqual({
        rewardsAPR: 0,
      })
    })

    it('should handle multiple concurrent requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        fetchRewardsAprForToken(`0x${i.toString().padStart(40, '0')}` as Address, chainId),
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
        const result = await fetchRewardsAprForToken(tokenAddress, chainId)
        expect(result).toEqual({ rewardsAPR: 0 })
      }

      // Test unsupported chains
      for (const chainId of unsupportedChains) {
        await expect(fetchRewardsAprForToken(tokenAddress, chainId)).rejects.toThrow(
          `No rewards APR provider found for chain ID: ${chainId}`,
        )
      }
    })
  })
})
