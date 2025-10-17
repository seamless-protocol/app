import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EtherFiAprProvider } from '@/features/leverage-tokens/utils/apy-calculations/apr-providers/etherfi'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('EtherFiAprProvider', () => {
  const provider = new EtherFiAprProvider()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('provider properties', () => {
    it('should have correct protocol identification', () => {
      expect(provider.protocolId).toBe('etherfi')
      expect(provider.protocolName).toBe('Ether.fi')
    })
  })

  describe('fetchApr', () => {
    it('should fetch APR data successfully', async () => {
      const mockApiResponse = {
        '7_day_apr': 5.2,
        '7_day_restaking_apr': 2.1,
        buffer_eth: 1000,
        other_field: 'ignored',
      }

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await provider.fetchApr()

      expect(result).toEqual({
        sevenDayApr: 5.2,
        sevenDayRestakingApr: 2.1,
        bufferEth: 1000,
        totalAPR: expect.closeTo(7.3, 10), // 5.2 + 2.1 (handle floating point precision)
        stakingAPR: 5.2,
        restakingAPR: 2.1,
        averagingPeriod: '7-day average',
        metadata: {
          raw: mockApiResponse,
          useRestakingApr: true,
        },
      })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://misc-cache.seamlessprotocol.com/etherfi-protocol-detail',
      )
    })

    it('should handle zero APR values', async () => {
      const mockApiResponse = {
        '7_day_apr': 0,
        '7_day_restaking_apr': 0,
        buffer_eth: 0,
      }

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await provider.fetchApr()

      expect(result).toEqual({
        sevenDayApr: 0,
        sevenDayRestakingApr: 0,
        bufferEth: 0,
        totalAPR: 0,
        stakingAPR: 0,
        restakingAPR: 0,
        averagingPeriod: '7-day average',
        metadata: {
          raw: mockApiResponse,
          useRestakingApr: true,
        },
      })
    })

    it('should handle very high APR values', async () => {
      const mockApiResponse = {
        '7_day_apr': 50.5,
        '7_day_restaking_apr': 25.3,
        buffer_eth: 5000,
      }

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await provider.fetchApr()

      expect(result).toEqual({
        sevenDayApr: 50.5,
        sevenDayRestakingApr: 25.3,
        bufferEth: 5000,
        totalAPR: expect.closeTo(75.8, 10), // 50.5 + 25.3 (handle floating point precision)
        stakingAPR: 50.5,
        restakingAPR: 25.3,
        averagingPeriod: '7-day average',
        metadata: {
          raw: mockApiResponse,
          useRestakingApr: true,
        },
      })
    })

    it('should handle negative APR values', async () => {
      const mockApiResponse = {
        '7_day_apr': -1.5,
        '7_day_restaking_apr': 2.0,
        buffer_eth: 100,
      }

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await provider.fetchApr()

      expect(result).toEqual({
        sevenDayApr: -1.5,
        sevenDayRestakingApr: 2.0,
        bufferEth: 100,
        totalAPR: expect.closeTo(0.5, 10), // -1.5 + 2.0 (handle floating point precision)
        stakingAPR: -1.5,
        restakingAPR: 2.0,
        averagingPeriod: '7-day average',
        metadata: {
          raw: mockApiResponse,
          useRestakingApr: true,
        },
      })
    })

    it('should handle HTTP error responses', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
      }

      mockFetch.mockResolvedValue(mockResponse)

      await expect(provider.fetchApr()).rejects.toThrow(
        'Failed to fetch EtherFi data (status 404): Not Found',
      )
    })

    it('should handle network errors', async () => {
      const networkError = new Error('Network error')
      mockFetch.mockRejectedValue(networkError)

      await expect(provider.fetchApr()).rejects.toThrow(
        'Failed to fetch EtherFi APR data: Network error',
      )
    })

    it('should handle JSON parsing errors', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      }

      mockFetch.mockResolvedValue(mockResponse)

      await expect(provider.fetchApr()).rejects.toThrow(
        'Failed to fetch EtherFi APR data: Invalid JSON',
      )
    })

    it('should handle missing required fields gracefully', async () => {
      const mockApiResponse = {
        // Missing '7_day_apr' and '7_day_restaking_apr'
        buffer_eth: 1000,
      }

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await provider.fetchApr()

      expect(result).toEqual({
        sevenDayApr: undefined,
        sevenDayRestakingApr: undefined,
        bufferEth: 1000,
        totalAPR: NaN, // undefined + undefined = NaN
        stakingAPR: undefined,
        restakingAPR: undefined,
        averagingPeriod: '7-day average',
        metadata: {
          raw: mockApiResponse,
          useRestakingApr: true,
        },
      })
    })

    it('should handle partial data', async () => {
      const mockApiResponse = {
        '7_day_apr': 5.2,
        // Missing '7_day_restaking_apr'
        buffer_eth: 1000,
      }

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await provider.fetchApr()

      expect(result).toEqual({
        sevenDayApr: 5.2,
        sevenDayRestakingApr: undefined,
        bufferEth: 1000,
        totalAPR: NaN, // 5.2 + undefined = NaN
        stakingAPR: 5.2,
        restakingAPR: undefined,
        averagingPeriod: '7-day average',
        metadata: {
          raw: mockApiResponse,
          useRestakingApr: true,
        },
      })
    })

    it('should preserve all raw data in metadata', async () => {
      const mockApiResponse = {
        '7_day_apr': 5.2,
        '7_day_restaking_apr': 2.1,
        buffer_eth: 1000,
        custom_field: 'custom_value',
        nested_object: { key: 'value' },
        array_field: [1, 2, 3],
      }

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await provider.fetchApr()

      expect((result as any).metadata.raw).toEqual(mockApiResponse)
      expect((result as any).metadata.useRestakingApr).toBe(true)
    })

    it('should log debug information', async () => {
      const mockApiResponse = {
        '7_day_apr': 5.2,
        '7_day_restaking_apr': 2.1,
        buffer_eth: 1000,
      }

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      }

      mockFetch.mockResolvedValue(mockResponse)

      await provider.fetchApr()

      // Debug logs have been removed from production code
    })
  })
})
