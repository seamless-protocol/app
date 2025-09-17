import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
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
    const { useMintPreview } = await import('@/features/leverage-tokens/hooks/mint/useMintPreview')
    const { result, rerender } = renderHook(
      ({ amount }) =>
        useMintPreview({ config: cfg, token, equityInCollateralAsset: amount, debounceMs: 200 }),
      {
        wrapper: ({ children }) => wrapper(children),
        initialProps: { amount: 0n as bigint | undefined },
      },
    )

    // Initially disabled => not loading
    expect(result.current.isLoading).toBe(false)

    // Rapidly change value a couple times within debounce window
    rerender({ amount: 1000n })
    rerender({ amount: 2000n })
    // Still within debounce window => not loading yet
    expect(result.current.isLoading).toBe(false)

    // Advance timers past debounce
    await act(async () => {
      vi.advanceTimersByTime(210)
    })

    // Now query should run once with the debounced latest value (2000n)
    const { readLeverageManagerPreviewMint } = await import('@/lib/contracts/generated')
    expect(readLeverageManagerPreviewMint).toHaveBeenCalledTimes(1)
    const args = (readLeverageManagerPreviewMint as any).mock.calls[0][1].args
    expect(args[0]).toBe(token)
    expect(args[1]).toBe(2000n)
  })

  it('stays disabled for undefined amount', async () => {
    const { useMintPreview } = await import('@/features/leverage-tokens/hooks/mint/useMintPreview')
    const { result } = renderHook(
      () =>
        useMintPreview({ config: cfg, token, equityInCollateralAsset: undefined, debounceMs: 50 }),
      { wrapper: ({ children }) => wrapper(children) },
    )
    expect(result.current.isLoading).toBe(false)
    const { readLeverageManagerPreviewMint } = await import('@/lib/contracts/generated')
    expect(readLeverageManagerPreviewMint).not.toHaveBeenCalled()
  })
})
