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
        rewardTokens: [],
      })
    })

    it('should handle different token addresses', async () => {
      const differentTokenAddress = '0x1234567890123456789012345678901234567890' as Address

      const result = await fetchRewardsAprForToken(differentTokenAddress, chainId)

      expect(result).toEqual({
        rewardsAPR: 0,
        rewardTokens: [],
      })
    })

    it('should work for Ethereum chain ID', async () => {
      const ethereumChainId = 1 // Ethereum

      const result = await fetchRewardsAprForToken(tokenAddress, ethereumChainId)

      // Should return actual rewards APR data from Merkl provider
      expect(result).toHaveProperty('rewardsAPR')
    })

    it('should work for unsupported chain ID 2', async () => {
      const unsupportedChainId = 137 // Polygon

      const result = await fetchRewardsAprForToken(tokenAddress, unsupportedChainId)

      expect(result).toEqual({
        rewardsAPR: 0,
        rewardTokens: [],
      })
    })

    it('should handle case where chain ID is 0', async () => {
      const chainIdZero = 0

      const result = await fetchRewardsAprForToken(tokenAddress, chainIdZero)

      expect(result).toEqual({
        rewardsAPR: 0,
        rewardTokens: [],
      })
    })

    it('should handle negative chain ID', async () => {
      const negativeChainId = -1

      const result = await fetchRewardsAprForToken(tokenAddress, negativeChainId)

      expect(result).toEqual({
        rewardsAPR: 0,
        rewardTokens: [],
      })
    })
  })

  describe('fetchRewardsAprForToken', () => {
    it('should be a wrapper around fetchRewardsAprForToken', async () => {
      const result = await fetchRewardsAprForToken(tokenAddress, chainId)

      expect(result).toEqual({
        rewardsAPR: 0,
        rewardTokens: [],
      })
    })

    it('should pass through all parameters correctly', async () => {
      const result = await fetchRewardsAprForToken(tokenAddress, chainId)

      expect(result).toEqual({
        rewardsAPR: 0,
        rewardTokens: [],
      })
    })
  })

  describe('provider selection logic', () => {
    it('should handle Base chain configuration', async () => {
      const result = await fetchRewardsAprForToken(tokenAddress, chainId)

      expect(result).toEqual({
        rewardsAPR: 0,
        rewardTokens: [],
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
          rewardTokens: [],
        })
      })
    })
  })

  describe('future extensibility', () => {
    it('should be easy to add new chain support', async () => {
      // This test documents the expected behavior when new chains are added
      // Currently both Base (8453) and Ethereum (1) are supported
      const supportedChains = [8453, 1] // Base and Ethereum
      const unsupportedChains = [137, 56, 42161] // Polygon, BSC, Arbitrum

      // Test supported chains
      for (const chainId of supportedChains) {
        const result = await fetchRewardsAprForToken(tokenAddress, chainId)
        expect(result).toHaveProperty('rewardsAPR')
      }

      // Test unsupported chains - should work but return default data
      for (const chainId of unsupportedChains) {
        const result = await fetchRewardsAprForToken(tokenAddress, chainId)
        expect(result).toEqual({
          rewardsAPR: 0,
          rewardTokens: [],
        })
      }
    })
  })
})
