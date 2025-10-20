import { describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useHistoricalUsdPricesMultiChain } from '@/lib/prices/useUsdPricesHistory'
import type { PropsWithChildren } from 'react'

function Wrapper({ children }: PropsWithChildren) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useHistoricalUsdPricesMultiChain (stubbed CG)', () => {
  it('fetches range once per asset and serves nearest-prior price via accessor', async () => {
    const from = Math.floor(Date.now() / 1000) - 24 * 60 * 60
    const to = from + 24 * 60 * 60

    const addr = '0xCOLL'
    const platform = 'base'
    const json = {
      prices: [
        [(from + 1) * 1000, 100],
        [(from + 3600) * 1000, 105],
        [(from + 7200) * 1000, 110],
      ],
    }

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (
        url.includes(`/coins/${platform}/contract/${addr.toLowerCase()}/market_chart/range`) &&
        url.includes('vs_currency=usd')
      ) {
        return Promise.resolve(new Response(JSON.stringify(json), { status: 200 })) as any
      }
      return Promise.resolve(new Response(JSON.stringify({}), { status: 200 })) as any
    })

    const byChain = { 8453: [addr] }

    const { result } = renderHook(
      () => useHistoricalUsdPricesMultiChain({ byChain, from, to, concurrency: 2 }),
      { wrapper: Wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const p1 = result.current.getUsdPriceAt(8453, addr, from + 1)
    const p2 = result.current.getUsdPriceAt(8453, addr, from + 3599)
    const p3 = result.current.getUsdPriceAt(8453, addr, from + 3600)
    const p4 = result.current.getUsdPriceAt(8453, addr, from + 7200)
    const p0 = result.current.getUsdPriceAt(8453, addr, from - 10)

    expect(p1).toBe(100)
    expect(p2).toBe(100)
    expect(p3).toBe(105)
    expect(p4).toBe(110)
    expect(p0).toBeUndefined()

    // Only one network call for the asset
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    fetchSpy.mockRestore()
  })
})

