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
          { timeUnix: 1759580579, apr: 2.58 },
          { timeUnix: 1759666979, apr: 2.59 },
          { timeUnix: 1759753379, apr: 2.6 },
          { timeUnix: 1759839779, apr: 2.61 },
          { timeUnix: 1759926179, apr: 2.62 },
          { timeUnix: 1760012579, apr: 2.63 },
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

    // Should use the most recent entry: 2.63
    expect(result).toEqual({
      stakingAPR: 2.63,
      restakingAPR: 0,
      totalAPR: 2.63,
      averagingPeriod: '24-hour average',
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
        aprs: [
          { timeUnix: 1759407791, apr: 0 },
          { timeUnix: 1759494179, apr: 0 },
          { timeUnix: 1759580579, apr: 0 },
          { timeUnix: 1759666979, apr: 0 },
          { timeUnix: 1759753379, apr: 0 },
          { timeUnix: 1759839779, apr: 0 },
          { timeUnix: 1759926179, apr: 0 },
          { timeUnix: 1760012579, apr: 0 },
        ],
        smaApr: 0,
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

    expect(result.stakingAPR).toBe(0)
    expect(result.totalAPR).toBe(0)
  })

  it('should handle high APR values', async () => {
    const mockData = {
      data: {
        aprs: [
          { timeUnix: 1759407791, apr: 15.0 },
          { timeUnix: 1759494179, apr: 15.5 },
          { timeUnix: 1759580579, apr: 16.0 },
          { timeUnix: 1759666979, apr: 16.5 },
          { timeUnix: 1759753379, apr: 17.0 },
          { timeUnix: 1759839779, apr: 17.5 },
          { timeUnix: 1759926179, apr: 18.0 },
          { timeUnix: 1760012579, apr: 18.5 },
        ],
        smaApr: 15.75,
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

    // Should use the most recent entry: 18.5
    expect(result.stakingAPR).toBe(18.5)
    expect(result.totalAPR).toBe(18.5)
  })

  it('should handle decimal APR values', async () => {
    const mockData = {
      data: {
        aprs: [
          { timeUnix: 1759407791, apr: 2.1 },
          { timeUnix: 1759494179, apr: 2.2 },
          { timeUnix: 1759580579, apr: 2.3 },
          { timeUnix: 1759666979, apr: 2.4 },
          { timeUnix: 1759753379, apr: 2.5 },
          { timeUnix: 1759839779, apr: 2.6 },
          { timeUnix: 1759926179, apr: 2.7 },
          { timeUnix: 1760012579, apr: 2.8 },
        ],
        smaApr: 2.6,
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

    // Should use the most recent entry: 2.8
    expect(result.stakingAPR).toBe(2.8)
    expect(result.totalAPR).toBe(2.8)
  })

  it('should have correct protocol properties', () => {
    expect(provider.protocolId).toBe('lido')
    expect(provider.protocolName).toBe('Lido')
  })

  it('should handle empty aprs array', async () => {
    const mockData = {
      data: {
        aprs: [],
        smaApr: 0,
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

    await expect(provider.fetchApr()).rejects.toThrow('Insufficient APR data')
  })

  it('should handle undefined APR in most recent entry', async () => {
    const mockData = {
      data: {
        aprs: [{ timeUnix: 1759407791, apr: 2.575 }, { timeUnix: 1759494179 }],
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

    await expect(provider.fetchApr()).rejects.toThrow('Invalid APR data in most recent entry')
  })

  it('should handle response.text() failure when response is not ok', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: vi.fn().mockRejectedValue(new Error('Failed to read text')),
    }

    mockFetch.mockResolvedValueOnce(mockResponse)

    await expect(provider.fetchApr()).rejects.toThrow(
      'Failed to fetch Lido data (status 500): Internal Server Error',
    )
  })

  it('should handle non-Error exceptions', async () => {
    const nonErrorException = 'String error'
    mockFetch.mockRejectedValueOnce(nonErrorException)

    await expect(provider.fetchApr()).rejects.toThrow(
      'Failed to fetch Lido APR data: Unknown error',
    )
  })
})
