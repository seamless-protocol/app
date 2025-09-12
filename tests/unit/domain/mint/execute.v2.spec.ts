import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BPS_DENOMINATOR, DEFAULT_MAX_SWAP_COST_BPS } from '@/domain/mint/constants'
import { executeMintV2 } from '@/domain/mint/execute.v2'

vi.mock('@/lib/contracts/generated', async () => {
  return {
    simulateLeverageRouterV2MintWithCalls: vi.fn(async (_config: any, { args, account }: any) => {
      return { request: { args, account } }
    }),
    writeLeverageRouterV2MintWithCalls: vi.fn(async (_config: any) => {
      // echo back a deterministic hash-like string for assertions
      return '0xhash' as any
    }),
  }
})

describe('executeMintV2', () => {
  const cfg = {} as any
  const token = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as `0x${string}`
  const account = '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' as `0x${string}`

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('simulates and writes with default maxSwapCost from expectedTotalCollateral', async () => {
    const plan = {
      inputAsset: '0x1111111111111111111111111111111111111111' as `0x${string}`,
      equityInInputAsset: 1_000n,
      minShares: 900n,
      calls: [],
      expectedTotalCollateral: 10_000n,
    }
    const expectedMaxSwapCost =
      (plan.expectedTotalCollateral * DEFAULT_MAX_SWAP_COST_BPS) / BPS_DENOMINATOR

    const res = await executeMintV2({
      config: cfg,
      token,
      account,
      plan,
      routerAddress: '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as `0x${string}`,
    })
    expect(res.hash).toBe('0xhash')

    const { simulateLeverageRouterV2MintWithCalls } = await import('@/lib/contracts/generated')
    expect(simulateLeverageRouterV2MintWithCalls).toHaveBeenCalledTimes(1)
    const callArgs = (simulateLeverageRouterV2MintWithCalls as any).mock.calls[0][1].args
    expect(callArgs[0]).toBe(token)
    expect(callArgs[1]).toBe(plan.equityInInputAsset)
    expect(callArgs[2]).toBe(plan.minShares)
    expect(callArgs[3]).toBe(expectedMaxSwapCost)
    expect(callArgs[4]).toEqual(plan.calls)
  })

  it('uses provided maxSwapCost override', async () => {
    const plan = {
      inputAsset: '0x1111111111111111111111111111111111111111' as `0x${string}`,
      equityInInputAsset: 2_000n,
      minShares: 1_800n,
      calls: [],
      expectedTotalCollateral: 10_000n,
    }
    const overrideMaxSwapCost = 1234n
    await executeMintV2({
      config: cfg,
      token,
      account,
      plan,
      maxSwapCostInCollateralAsset: overrideMaxSwapCost,
      routerAddress: '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as `0x${string}`,
    })
    const { simulateLeverageRouterV2MintWithCalls } = await import('@/lib/contracts/generated')
    const callArgs = (simulateLeverageRouterV2MintWithCalls as any).mock.calls[0][1].args
    expect(callArgs[3]).toBe(overrideMaxSwapCost)
  })
})
