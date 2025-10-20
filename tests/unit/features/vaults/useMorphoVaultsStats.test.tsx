import { waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useMorphoVaultsStats } from '@/features/vaults/hooks/useMorphoVaultsStats'
import { hookTestUtils } from '../../../utils'

describe('useMorphoVaultsStats (DeFiLlama TVL) — unit', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns tvlUsd from latest Base datapoint when top-level missing', async () => {
    const mockJson = {
      chainTvls: {
        Base: {
          tvl: [
            { date: 1, totalLiquidityUSD: 111 },
            { date: 2, totalLiquidityUSD: 333 },
          ],
        },
      },
    }

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockJson,
    } as any)

    const { result } = hookTestUtils.renderHookWithQuery(() => useMorphoVaultsStats())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isError).toBe(false)
    expect(result.current.tvlUsd).toBe(333)
  })

  it('sums latest points across chains if no top-level total provided', async () => {
    const mockJson = {
      chainTvls: {
        Base: {
          tvl: [
            { date: 1, totalLiquidityUSD: 100 },
            { date: 2, totalLiquidityUSD: 150 },
          ],
        },
        Ethereum: {
          tvl: [
            { date: 1, totalLiquidityUSD: 200 },
            { date: 2, totalLiquidityUSD: 250 },
          ],
        },
      },
    }

    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockJson,
    } as any)

    const { result } = hookTestUtils.renderHookWithQuery(() => useMorphoVaultsStats())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isError).toBe(false)
    expect(result.current.tvlUsd).toBe(150 + 250)
  })
})
