import { describe, expect, it, vi } from 'vitest'
import { DefiLlamaAprProvider } from '@/features/leverage-tokens/utils/apy-calculations/apr-providers/defillama'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('DefiLlamaAprProvider', () => {
  const protocolId = '747c1d2a-c668-4682-b9f9-296708a3dd90'
  const provider = new DefiLlamaAprProvider(protocolId)

  it('should fetch APR data successfully and calculate 24-hour average', async () => {
    // Create 3 days of data to test that we only use the last 24 hours
    const mockData = [
      {
        timestamp: '2024-01-08T12:00:00Z',
        apy: 2.0,
        apyBase: 2.0,
        apyReward: null,
        il7d: null,
        apyBase7d: null,
        tvlUsd: 1000000,
      }, // Should be ignored (older than 24h)
      {
        timestamp: '2024-01-09T00:00:00Z',
        apy: 3.0,
        apyBase: 3.0,
        apyReward: null,
        il7d: null,
        apyBase7d: null,
        tvlUsd: 1000000,
      }, // Last 24 hours start here
      {
        timestamp: '2024-01-09T12:00:00Z',
        apy: 3.2,
        apyBase: 3.2,
        apyReward: null,
        il7d: null,
        apyBase7d: null,
        tvlUsd: 1000000,
      },
      {
        timestamp: '2024-01-10T00:00:00.000Z',
        apy: 3.4,
        apyBase: 3.4,
        apyReward: null,
        il7d: null,
        apyBase7d: null,
        tvlUsd: 1000000,
      }, // Most recent (excluded from average)
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'success', data: mockData }),
    })

    const result = await provider.fetchApr()

    // Should average the last 24 hours (excluding most recent): 3.0, 3.2 = 3.1
    expect(result.stakingAPR).toBeCloseTo(3.1, 4)
    expect(result.restakingAPR).toBe(0)
    expect(result.totalAPR).toBeCloseTo(3.1, 4)
    expect(result.averagingPeriod).toBe('24-hour average')

    expect(mockFetch).toHaveBeenCalledWith(
      `https://yields.llama.fi/chart/${protocolId}`,
      expect.objectContaining({
        method: 'GET',
      }),
    )
    // Ensure we use a simple request (no custom headers) to avoid CORS preflight
    const options = (mockFetch.mock.calls[0] as Array<unknown>)[1] as Record<string, unknown>
    expect(options['headers']).toBeUndefined()
  })

  it('should handle API errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    })

    await expect(provider.fetchApr()).rejects.toThrow('DeFi Llama API error: 404 Not Found')
  })

  it('should handle empty data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'success', data: [] }),
    })

    await expect(provider.fetchApr()).rejects.toThrow(
      'DeFi Llama API returned empty or invalid data',
    )
  })

  it('should handle invalid data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'success', data: [{ apy: null }] }),
    })

    await expect(provider.fetchApr()).rejects.toThrow('No valid APR data found')
  })

  it('should calculate average correctly with data within 24 hours', async () => {
    // Test with only a few hours of data
    const mockData = [
      {
        timestamp: '2024-01-02T20:00:00Z',
        apy: 3.0,
        apyBase: 3.0,
        apyReward: null,
        il7d: null,
        apyBase7d: null,
        tvlUsd: 1000000,
      },
      {
        timestamp: '2024-01-02T22:00:00Z',
        apy: 3.5,
        apyBase: 3.5,
        apyReward: null,
        il7d: null,
        apyBase7d: null,
        tvlUsd: 1000000,
      },
      {
        timestamp: '2024-01-03T00:00:00Z',
        apy: 4.0,
        apyBase: 4.0,
        apyReward: null,
        il7d: null,
        apyBase7d: null,
        tvlUsd: 1000000,
      },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'success', data: mockData }),
    })

    const result = await provider.fetchApr()

    // Should average entries within last 24 hours (excluding most recent): (3.0 + 3.5) / 2 = 3.25
    expect(result.stakingAPR).toBe(3.25)
    expect(result.totalAPR).toBe(3.25)
  })

  it('should handle mixed valid and invalid data in 24-hour window', async () => {
    const mockData = [
      {
        timestamp: '2024-01-06T12:00:00Z',
        apy: 3.0,
        apyBase: 3.0,
        apyReward: null,
        il7d: null,
        apyBase7d: null,
        tvlUsd: 1000000,
      },
      {
        timestamp: '2024-01-06T16:00:00Z',
        apy: null,
        apyBase: null,
        apyReward: null,
        il7d: null,
        apyBase7d: null,
        tvlUsd: 1000000,
      }, // Invalid
      {
        timestamp: '2024-01-06T18:00:00Z',
        apy: 3.5,
        apyBase: 3.5,
        apyReward: null,
        il7d: null,
        apyBase7d: null,
        tvlUsd: 1000000,
      },
      {
        timestamp: '2024-01-06T20:00:00Z',
        apy: Number.NaN,
        apyBase: Number.NaN,
        apyReward: null,
        il7d: null,
        apyBase7d: null,
        tvlUsd: 1000000,
      }, // Invalid
      {
        timestamp: '2024-01-06T22:00:00Z',
        apy: 4.0,
        apyBase: 4.0,
        apyReward: null,
        il7d: null,
        apyBase7d: null,
        tvlUsd: 1000000,
      },
      {
        timestamp: '2024-01-07T02:00:00Z',
        apy: 4.5,
        apyBase: 4.5,
        apyReward: null,
        il7d: null,
        apyBase7d: null,
        tvlUsd: 1000000,
      },
      {
        timestamp: '2024-01-07T12:00:00Z',
        apy: 5.0,
        apyBase: 5.0,
        apyReward: null,
        il7d: null,
        apyBase7d: null,
        tvlUsd: 1000000,
      },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'success', data: mockData }),
    })

    const result = await provider.fetchApr()

    // Should average only valid data within last 24 hours (excluding most recent): (3.0 + 3.5 + 4.0 + 4.5) / 4 = 3.75
    expect(result.stakingAPR).toBe(3.75)
    expect(result.totalAPR).toBe(3.75)
  })

  it('should handle non-success status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'error', data: [] }),
    })

    await expect(provider.fetchApr()).rejects.toThrow(
      'DeFi Llama API returned empty or invalid data',
    )
  })

  it('should handle missing mostRecentEntry', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'success', data: [] }),
    })

    // Empty data array triggers "empty or invalid data" error before checking mostRecentEntry
    await expect(provider.fetchApr()).rejects.toThrow(
      'DeFi Llama API returned empty or invalid data',
    )
  })

  it('should handle no valid data in last 24 hours', async () => {
    // Data older than 24 hours
    const mockData = [
      {
        timestamp: '2024-01-01T00:00:00Z',
        apy: 3.0,
        apyBase: 3.0,
        apyReward: null,
        il7d: null,
        apyBase7d: null,
        tvlUsd: 1000000,
      },
      {
        timestamp: '2024-01-02T00:00:00Z',
        apy: null, // Invalid
        apyBase: null,
        apyReward: null,
        il7d: null,
        apyBase7d: null,
        tvlUsd: 1000000,
      },
      {
        timestamp: '2024-01-10T00:00:00Z',
        apy: Number.NaN, // Invalid
        apyBase: Number.NaN,
        apyReward: null,
        il7d: null,
        apyBase7d: null,
        tvlUsd: 1000000,
      },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'success', data: mockData }),
    })

    await expect(provider.fetchApr()).rejects.toThrow(
      'No valid APR data found in the last 24 hours',
    )
  })

  it('should handle non-Error exceptions', async () => {
    const nonErrorException = 'String error'
    mockFetch.mockRejectedValueOnce(nonErrorException)

    await expect(provider.fetchApr()).rejects.toThrow('Unknown error fetching DeFi Llama APR data')
  })
})
