import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { Address } from 'viem'
import type { Config } from 'wagmi'

// Mock the planner to avoid on-chain reads
vi.mock('@/domain/mint/planner/plan.v2', () => ({
  planMintV2: vi.fn(async () => {
    return {
      inputAsset: '0x0000000000000000000000000000000000000001' as Address,
      equityInInputAsset: 10n,
      collateralAsset: '0x0000000000000000000000000000000000000002' as Address,
      debtAsset: '0x0000000000000000000000000000000000000003' as Address,
      minShares: 120n,
      expectedShares: 123n,
      expectedDebt: 100n,
      expectedTotalCollateral: 110n,
      expectedExcessDebt: 0n,
      calls: [],
    }
  }),
}))

// Import after mocks
import { useMintPlanPreview } from '@/features/leverage-tokens/hooks/mint/useMintPlanPreview'
import { ltKeys } from '@/features/leverage-tokens/utils/queryKeys'

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

const DUMMY_ADDR = '0x0000000000000000000000000000000000000001' as Address

describe('useMintPlanPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not load when amount is undefined and no quote', () => {
    // Ensure simulation key exists in mocked ltKeys from tests/setup
    ;(ltKeys as any).simulation = {
      mintKey: (params: any) => [
        'leverage-tokens',
        'simulate',
        'mint',
        `chain:${String(params.chainId ?? 'na')}`,
        `addr:${String(params.addr)}`,
        `amt:${params.amount.toString()}`,
      ],
    }
    const wrapper = createWrapper()
    const { result } = renderHook(
      () =>
        useMintPlanPreview({
          config: {} as Config,
          token: DUMMY_ADDR,
          inputAsset: DUMMY_ADDR,
          equityInCollateralAsset: undefined,
          slippageBps: 50,
          chainId: 1,
          debounceMs: 0,
        }),
      { wrapper },
    )
    expect(result.current.isLoading).toBe(false)
    expect(result.current.plan).toBeUndefined()
  })

  it('does not load when amount is 0 and quote present', () => {
    ;(ltKeys as any).simulation = {
      mintKey: (params: any) => [
        'leverage-tokens',
        'simulate',
        'mint',
        `chain:${String(params.chainId ?? 'na')}`,
        `addr:${String(params.addr)}`,
        `amt:${params.amount.toString()}`,
      ],
    }
    const wrapper = createWrapper()
    const { result } = renderHook(
      () =>
        useMintPlanPreview({
          config: {} as Config,
          token: DUMMY_ADDR,
          inputAsset: DUMMY_ADDR,
          equityInCollateralAsset: 0n,
          slippageBps: 50,
          chainId: 1,
          debounceMs: 0,
          quote: async () => ({
            inToken: DUMMY_ADDR,
            outToken: DUMMY_ADDR,
            amountIn: 0n,
            out: 0n,
            approvalTarget: DUMMY_ADDR,
            calldata: '0x' as `0x${string}`,
          }),
        }),
      { wrapper },
    )
    expect(result.current.isLoading).toBe(false)
    expect(result.current.plan).toBeUndefined()
  })

  it('loads and returns plan when amount > 0 and quote provided', async () => {
    ;(ltKeys as any).simulation = {
      mintKey: (params: any) => [
        'leverage-tokens',
        'simulate',
        'mint',
        `chain:${String(params.chainId ?? 'na')}`,
        `addr:${String(params.addr)}`,
        `amt:${params.amount.toString()}`,
      ],
    }
    const wrapper = createWrapper()
    const { result } = renderHook(
      () =>
        useMintPlanPreview({
          config: {} as Config,
          token: DUMMY_ADDR,
          inputAsset: DUMMY_ADDR,
          equityInCollateralAsset: 10n,
          slippageBps: 50,
          chainId: 1,
          debounceMs: 0,
          quote: async () => ({
            inToken: DUMMY_ADDR,
            outToken: DUMMY_ADDR,
            amountIn: 10n,
            out: 10n,
            approvalTarget: DUMMY_ADDR,
            calldata: '0x' as `0x${string}`,
          }),
        }),
      { wrapper },
    )

    await waitFor(() => {
      expect(result.current.plan).toBeDefined()
    })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.plan?.expectedShares).toBe(123n)
  })
})
