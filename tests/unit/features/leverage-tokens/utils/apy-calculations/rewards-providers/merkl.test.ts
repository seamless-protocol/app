import type { Address } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

import { MerklRewardsAprProvider } from '@/features/leverage-tokens/utils/apy-calculations/rewards-providers/merkl'

describe('MerklRewardsAprProvider', () => {
  const tokenAddress = '0xA2fceEAe99d2cAeEe978DA27bE2d95b0381dBB8c' as Address
  const chainId = 8453

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('provider properties', () => {
    it('should have correct protocol identification', () => {
      const provider = new MerklRewardsAprProvider()

      expect(provider.protocolId).toBe('merkl')
      expect(provider.protocolName).toBe('Merkl')
    })
  })

  describe('constructor', () => {
    it('should create provider without configuration', () => {
      const provider = new MerklRewardsAprProvider()
      expect(provider).toBeDefined()
    })

    it('should create provider successfully', () => {
      expect(() => {
        new MerklRewardsAprProvider()
      }).not.toThrow()
    })
  })

  describe('fetchRewardsApr', () => {
    it('should fetch rewards APR successfully', async () => {
      const provider = new MerklRewardsAprProvider()

      // Mock successful API response
      const mockOpportunities = [
        {
          id: 'opportunity-1',
          chainId: 8453,
          apr: 0.05, // 5% APR provided by Merkl
          tokenAddress: tokenAddress,
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpportunities,
      } as unknown as Response)

      const result = await provider.fetchRewardsApr(tokenAddress, chainId)

      expect(result).toEqual({
        rewardsAPR: 0.0005, // Merkl API returns 0.05, converted to percentage format
      })

      // Verify API call
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        `https://api.merkl.xyz/v4/opportunities?identifier=${tokenAddress}&chainId=${chainId}`,
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      )
      // Ensure simple GET (no headers) to avoid preflight
      {
        const opts = (mockFetch.mock.calls[0] as Array<unknown>)[1] as Record<string, unknown>
        expect(opts['headers']).toBeUndefined()
      }
    })

    it('should sum APRs from multiple opportunities', async () => {
      const provider = new MerklRewardsAprProvider()

      // Mock multiple opportunities with different APRs (only Base chain since we're filtering by chainId=8453)
      const mockOpportunities = [
        {
          id: 'opportunity-1',
          chainId: 8453,
          apr: 0.05, // 5% APR
          tokenAddress: tokenAddress,
        },
        {
          id: 'opportunity-2',
          chainId: 8453,
          apr: 0.03, // 3% APR
          tokenAddress: tokenAddress,
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpportunities,
      } as unknown as Response)

      const result = await provider.fetchRewardsApr(tokenAddress, 8453) // Only Base chain

      // Should sum the Base chain opportunities: 0.05 + 0.03 = 0.08, converted to percentage format
      expect(result).toEqual({
        rewardsAPR: 0.0008,
      })

      // Verify API call with chain ID filter
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        `https://api.merkl.xyz/v4/opportunities?identifier=${tokenAddress}&chainId=8453`,
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      )
      {
        const opts = (mockFetch.mock.calls[0] as Array<unknown>)[1] as Record<string, unknown>
        expect(opts['headers']).toBeUndefined()
      }
    })

    it('should fetch opportunities from all chains when no chain ID provided', async () => {
      const provider = new MerklRewardsAprProvider()

      // Mock opportunities from multiple chains
      const mockOpportunities = [
        {
          id: 'opportunity-1',
          chainId: 8453, // Base
          apr: 0.05,
          tokenAddress: tokenAddress,
        },
        {
          id: 'opportunity-2',
          chainId: 1, // Ethereum
          apr: 0.03,
          tokenAddress: tokenAddress,
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpportunities,
      } as unknown as Response)

      const result = await provider.fetchRewardsApr(tokenAddress) // No chain ID

      // Should sum opportunities from all chains: 0.05 + 0.03 = 0.08, converted to percentage format
      expect(result).toEqual({
        rewardsAPR: 0.0008,
      })

      // Verify API call without chain ID filter
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        `https://api.merkl.xyz/v4/opportunities?identifier=${tokenAddress}`,
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      )
      {
        const opts = (mockFetch.mock.calls[0] as Array<unknown>)[1] as Record<string, unknown>
        expect(opts['headers']).toBeUndefined()
      }
    })

    it('should return default data when no opportunities found', async () => {
      const provider = new MerklRewardsAprProvider()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ opportunities: [] }),
      } as unknown as Response)

      const result = await provider.fetchRewardsApr(tokenAddress, chainId)
      expect(result).toEqual({ rewardsAPR: 0, rewardTokens: [] })
    })

    it('should throw error when API returns 404 for opportunities', async () => {
      const provider = new MerklRewardsAprProvider()

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as unknown as Response)

      await expect(provider.fetchRewardsApr(tokenAddress, chainId)).rejects.toThrow(
        `No Merkl opportunities found for token: ${tokenAddress}`,
      )
    })

    it('should throw error when API request fails', async () => {
      const provider = new MerklRewardsAprProvider()

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(provider.fetchRewardsApr(tokenAddress, chainId)).rejects.toThrow('Network error')
    })

    it('should throw error on timeout', async () => {
      const provider = new MerklRewardsAprProvider()

      mockFetch.mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('Request timeout')
            error.name = 'AbortError'
            reject(error)
          }, 100)
        })
      })

      await expect(provider.fetchRewardsApr(tokenAddress, chainId)).rejects.toThrow(
        'Request timeout',
      )
    })

    it('should handle malformed JSON responses', async () => {
      const provider = new MerklRewardsAprProvider()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      } as unknown as Response)

      await expect(provider.fetchRewardsApr(tokenAddress, chainId)).rejects.toThrow('Invalid JSON')
    })

    it('should handle response.text() failure when response is not ok', async () => {
      const provider = new MerklRewardsAprProvider()

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => {
          throw new Error('Failed to read response text')
        },
      } as unknown as Response)

      await expect(provider.fetchRewardsApr(tokenAddress, chainId)).rejects.toThrow(
        'HTTP error! status: 500',
      )
    })

    it('should handle non-array response without opportunities property', async () => {
      const provider = new MerklRewardsAprProvider()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }), // Non-array response without opportunities
      } as unknown as Response)

      const result = await provider.fetchRewardsApr(tokenAddress, chainId)

      expect(result).toEqual({
        rewardsAPR: 0,
        rewardTokens: [],
      })
    })

    it('should handle non-Error exceptions in fetchOpportunitiesByToken', async () => {
      const provider = new MerklRewardsAprProvider()

      mockFetch.mockRejectedValueOnce('String error') // Non-Error exception

      await expect(provider.fetchRewardsApr(tokenAddress, chainId)).rejects.toBe('String error')
    })

    it('should handle non-Error exceptions in fetchRewardsApr catch block', async () => {
      const provider = new MerklRewardsAprProvider()

      // Mock fetchOpportunitiesByToken to throw a non-Error
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw 'String error' // Non-Error exception
        },
      } as unknown as Response)

      await expect(provider.fetchRewardsApr(tokenAddress, chainId)).rejects.toBe('String error')
    })

    it('should handle opportunity with missing APR', async () => {
      const provider = new MerklRewardsAprProvider()

      const mockOpportunities = [
        {
          id: 'opportunity-1',
          chainId: 8453,
          // Missing apr field
          tokenAddress: tokenAddress,
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpportunities,
      } as unknown as Response)

      const result = await provider.fetchRewardsApr(tokenAddress, chainId)

      expect(result).toEqual({
        rewardsAPR: 0, // Fallback when APR is missing
      })
    })

    it('should handle different token addresses', async () => {
      const differentTokenAddress = '0x1234567890123456789012345678901234567890' as Address
      const provider = new MerklRewardsAprProvider()

      const mockOpportunities = [
        {
          id: 'opportunity-1',
          chainId: 8453,
          apr: 0.03,
          tokenAddress: differentTokenAddress,
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpportunities,
      } as unknown as Response)

      const result = await provider.fetchRewardsApr(differentTokenAddress, chainId)

      expect(result).toEqual({
        rewardsAPR: 0.0003, // Converted to percentage format
      })

      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.merkl.xyz/v4/opportunities?identifier=${differentTokenAddress}&chainId=${chainId}`,
        expect.any(Object),
      )
    })

    it('should handle different chain IDs', async () => {
      const customChainId = 1
      const provider = new MerklRewardsAprProvider()

      const mockOpportunities = [
        {
          id: 'opportunity-1',
          chainId: 1,
          apr: 0.025,
          tokenAddress: tokenAddress,
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpportunities,
      } as unknown as Response)

      const result = await provider.fetchRewardsApr(tokenAddress, customChainId)

      expect(result).toEqual({
        rewardsAPR: 0.00025, // Converted to percentage format
      })
    })

    it('should handle multiple opportunities and sum APRs', async () => {
      const provider = new MerklRewardsAprProvider()

      const mockOpportunities = [
        {
          id: 'opportunity-1',
          chainId: 8453,
          apr: 0.05,
          tokenAddress: tokenAddress,
        },
        {
          id: 'opportunity-2',
          chainId: 8453,
          apr: 0.03,
          tokenAddress: tokenAddress,
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpportunities,
      } as unknown as Response)

      const result = await provider.fetchRewardsApr(tokenAddress, chainId)

      expect(result).toEqual({
        rewardsAPR: 0.0008, // Should sum both opportunities: 0.05 + 0.03, converted to percentage format
      })
    })

    it('should handle zero APR', async () => {
      const provider = new MerklRewardsAprProvider()

      const mockOpportunities = [
        {
          id: 'opportunity-1',
          chainId: 8453,
          apr: 0, // Zero APR
          tokenAddress: tokenAddress,
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpportunities,
      } as unknown as Response)

      const result = await provider.fetchRewardsApr(tokenAddress, chainId)

      expect(result).toEqual({
        rewardsAPR: 0,
      })
    })

    it('should handle very high APR', async () => {
      const provider = new MerklRewardsAprProvider()

      const mockOpportunities = [
        {
          id: 'opportunity-1',
          chainId: 8453,
          apr: 0.5, // 50% APR
          tokenAddress: tokenAddress,
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpportunities,
      } as unknown as Response)

      const result = await provider.fetchRewardsApr(tokenAddress, chainId)

      expect(result).toEqual({
        rewardsAPR: 0.005, // Converted to percentage format
      })
    })
  })
})
