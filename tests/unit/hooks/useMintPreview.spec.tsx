import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Config } from 'wagmi'

// note: import the hook dynamically after mocks to ensure module-level mocks take effect

vi.useFakeTimers()

vi.mock('@/lib/contracts/generated', async () => {
  return {
    readLeverageManagerPreviewMint: vi.fn(async (_config: any, { args }: any) => {
      const equity = args[1] as bigint
      return {
        collateral: equity + 100n,
        debt: 5000n,
        equity,
        shares: equity,
        tokenFee: 0n,
        treasuryFee: 0n,
      }
    }),
  }
})

// Ensure query keys are available and stable for tests
vi.mock('@/features/leverage-tokens/utils/queryKeys', () => {
  return {
    ltKeys: {
      simulation: {
        mintKey: ({ chainId, addr, amount }: any) => [
          'lt',
          chainId ?? 'x',
          'mint',
          String(addr),
          String(amount),
        ],
      },
    },
  }
})

vi.mock('@wagmi/core', async () => {
  return {
    getPublicClient: vi.fn(() => ({ chain: { id: 8453 } })),
  }
})

function wrapper(children: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe('useMintPreview', () => {
  const cfg = {} as unknown as Config
  const token = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as `0x${string}`

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debounces equity input and enables only for positive bigint', async () => {
    vi.useRealTimers()
    try {
      const { useMintPreview } = await import('@/features/leverage-tokens/hooks/mint/useMintPreview')
      const { result, rerender } = renderHook(
        ({ amount }) =>
          useMintPreview({ config: cfg, token, equityInCollateralAsset: amount, debounceMs: 200 }),
        {
          wrapper: ({ children }) => wrapper(children),
          initialProps: { amount: 0n as bigint | undefined },
        },
      )

      // Rapidly change value a couple times within debounce window
      rerender({ amount: 1000n })
      rerender({ amount: 2000n })
      // Still within debounce window => not loading yet
      expect(result.current.isLoading).toBe(false)

      // Advance time past debounce
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 220))
      })

      // Now query should be in-flight
      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
    } finally {
      vi.useFakeTimers()
    }
  })

  it('stays disabled for undefined amount', async () => {
    const { useMintPreview } = await import('@/features/leverage-tokens/hooks/mint/useMintPreview')
    const { result } = renderHook(
      () =>
        useMintPreview({ config: cfg, token, equityInCollateralAsset: undefined, debounceMs: 50 }),
      { wrapper: ({ children }) => wrapper(children) },
    )
    const { readLeverageManagerPreviewMint } = await import('@/lib/contracts/generated')
    expect(readLeverageManagerPreviewMint).not.toHaveBeenCalled()
  })
})
