import { describe, expect, it, vi } from 'vitest'
import { LidoAprProvider } from '@/features/leverage-tokens/utils/apy-calculations/apr-providers/lido'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('LidoAprProvider', () => {
  const provider = new LidoAprProvider()

  it('should fetch APR data successfully', async () => {
    const mockData = {
      data: {
        aprs: [
          { timeUnix: 1759407791, apr: 2.575 },
          { timeUnix: 1759494179, apr: 2.57 },
        ],
        smaApr: 3.25,
      },
      meta: {
        symbol: 'stETH',
        address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
        chainId: 1,
      },
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const result = await provider.fetchApr()

    expect(result).toEqual({
      stakingAPR: 3.25,
      restakingAPR: 0,
      totalAPR: 3.25,
    })

    expect(mockFetch).toHaveBeenCalledWith('https://eth-api.lido.fi/v1/protocol/steth/apr/sma')
  })

  it('should handle API errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })

    await expect(provider.fetchApr()).rejects.toThrow(
      'Failed to fetch Lido data (status 500): Internal Server Error',
    )
  })

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    await expect(provider.fetchApr()).rejects.toThrow('Network error')
  })

  it('should handle invalid JSON response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new Error('Invalid JSON')),
    })

    await expect(provider.fetchApr()).rejects.toThrow('Invalid JSON')
  })

  it('should handle zero APR value', async () => {
    const mockData = {
      data: {
        smaApr: '0',
        timestamp: '2024-01-01T00:00:00Z',
      },
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const result = await provider.fetchApr()

    expect(result.stakingAPR).toBe('0')
    expect(result.totalAPR).toBe('0')
  })

  it('should handle high APR values', async () => {
    const mockData = {
      data: {
        smaApr: '15.75',
        timestamp: '2024-01-01T00:00:00Z',
      },
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const result = await provider.fetchApr()

    expect(result.stakingAPR).toBe('15.75')
    expect(result.totalAPR).toBe('15.75')
  })

  it('should handle decimal APR values', async () => {
    const mockData = {
      data: {
        smaApr: 2.6,
        timestamp: '2024-01-01T00:00:00Z',
      },
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const result = await provider.fetchApr()

    expect(result.stakingAPR).toBe(2.6)
    expect(result.totalAPR).toBe(2.6)
  })

  it('should have correct protocol properties', () => {
    expect(provider.protocolId).toBe('lido')
    expect(provider.protocolName).toBe('Lido')
  })
})
