import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type React from 'react'
import { describe, expect, it } from 'vitest'
import { WagmiProvider } from 'wagmi'
import { useMorphoVaultsStats } from '@/features/vaults/hooks/useMorphoVaultsStats'
import { config } from '@/lib/config/wagmi.config'

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: 1, gcTime: 5 * 60 * 1000 } },
  })
  // eslint-disable-next-line react/display-name
  return ({ children }: { children: React.ReactNode }) => (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

describe('Smoke: Seamless Vaults TVL (DeFiLlama live)', () => {
  it('fetches latest TVL via useMorphoVaultsStats()', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(
      () => useMorphoVaultsStats({ staleTimeMs: 0, refetchIntervalMs: 0 }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 30_000 })
    expect(result.current.isError).toBe(false)
    expect(typeof result.current.tvlUsd).toBe('number')
    expect(Number.isFinite(result.current.tvlUsd)).toBe(true)
    expect(result.current.tvlUsd ?? 0).toBeGreaterThan(0)
  })

  it('raw DeFiLlama protocol endpoint responds OK', async () => {
    const res = await fetch('https://api.llama.fi/protocol/seamless-vaults')
    expect(res.ok).toBe(true)
    const json = await res.json()
    // Should have either Base chain tvl series or top-level tvl
    const baseSeries = json?.chainTvls?.Base?.tvl ?? []
    const topSeries = json?.tvl ?? []
    expect(Array.isArray(baseSeries) || Array.isArray(topSeries)).toBe(true)
  })
})
