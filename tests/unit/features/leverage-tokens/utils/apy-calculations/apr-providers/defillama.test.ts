import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DefiLlamaAprProvider } from '@/features/leverage-tokens/utils/apy-calculations/apr-providers/defillama'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('DefiLlamaAprProvider', () => {
  const protocolId = '747c1d2a-c668-4682-b9f9-296708a3dd90'
  const provider = new DefiLlamaAprProvider(protocolId)

  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('should fetch APR data successfully using the most recent entry', async () => {
    const now = Date.now()
    const isoHoursAgo = (hours: number) => new Date(now - hours * 60 * 60 * 1000).toISOString()
    const mockData = [
      {
        timestamp: isoHoursAgo(24),
        apy: 3.0,
        apyBase: 3.0,
        apyReward: null,
        il7d: null,
        apyBase7d: null,
        tvlUsd: 1000000,
      },
      {
        timestamp: isoHoursAgo(12),
        apy: 3.8,
        apyBase: 3.8,
        apyReward: null,
        il7d: null,
        apyBase7d: null,
        tvlUsd: 1000000,
      },
      {
        timestamp: isoHoursAgo(1),
        apy: 4.2,
        apyBase: 4.2,
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

    expect(result.stakingAPR).toBe(4.2)
    expect(result.restakingAPR).toBe(0)
    expect(result.totalAPR).toBe(4.2)
    expect(result.averagingPeriod).toBe(
      `as of ${new Date(mockData[2]?.timestamp ?? '').toLocaleString(undefined, { timeZoneName: 'short' })}`,
    )

    expect(mockFetch).toHaveBeenCalledWith(
      `https://yields.llama.fi/chart/${protocolId}`,
      expect.objectContaining({
        method: 'GET',
      }),
    )
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

  it('should handle non-success status responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'error', data: [] }),
    })

    await expect(provider.fetchApr()).rejects.toThrow(
      'DeFi Llama API returned empty or invalid data',
    )
  })

  it('should handle empty data arrays', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'success', data: [] }),
    })

    await expect(provider.fetchApr()).rejects.toThrow(
      'DeFi Llama API returned empty or invalid data',
    )
  })

  it('should handle missing data entries even when array length is non-zero', async () => {
    const mockData = [undefined] as Array<unknown>

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'success', data: mockData }),
    })

    await expect(provider.fetchApr()).rejects.toThrow('No data entries found')
  })

  it('should handle most recent data older than 48 hours', async () => {
    const now = Date.now()
    const isoHoursAgo = (hours: number) => new Date(now - hours * 60 * 60 * 1000).toISOString()
    const mockData = [
      {
        timestamp: isoHoursAgo(96),
        apy: 3.0,
        apyBase: 3.0,
        apyReward: null,
        il7d: null,
        apyBase7d: null,
        tvlUsd: 1000000,
      },
      {
        timestamp: isoHoursAgo(60),
        apy: 3.5,
        apyBase: 3.5,
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

    await expect(provider.fetchApr()).rejects.toThrow('Most recent APR data is older than 48 hours')
  })

  it('should handle invalid most recent APR values', async () => {
    const now = Date.now()
    const isoHoursAgo = (hours: number) => new Date(now - hours * 60 * 60 * 1000).toISOString()
    const mockData = [
      {
        timestamp: isoHoursAgo(24),
        apy: 3.0,
        apyBase: 3.0,
        apyReward: null,
        il7d: null,
        apyBase7d: null,
        tvlUsd: 1000000,
      },
      {
        timestamp: isoHoursAgo(2),
        apy: null,
        apyBase: null,
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

    await expect(provider.fetchApr()).rejects.toThrow('Most recent APR data point is invalid')
  })

  it('should handle non-Error exceptions', async () => {
    const nonErrorException = 'String error'
    mockFetch.mockRejectedValueOnce(nonErrorException)

    await expect(provider.fetchApr()).rejects.toThrow('Unknown error fetching DeFi Llama APR data')
  })
})
