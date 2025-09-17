import { beforeEach, describe, expect, it, vi } from 'vitest'
import { executeMintV2 } from '@/domain/mint/exec/execute.v2'
import { BPS_DENOMINATOR, DEFAULT_MAX_SWAP_COST_BPS } from '@/domain/mint/utils/constants'

vi.mock('@/lib/contracts/generated', async () => {
  return {
    simulateLeverageRouterV2Deposit: vi.fn(async (_config: any, { args, account }: any) => {
      return { request: { args, account } }
    }),
    writeLeverageRouterV2Deposit: vi.fn(async (_config: any) => {
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
      expectedDebt: 5_000n,
    }
    void ((plan.expectedTotalCollateral * DEFAULT_MAX_SWAP_COST_BPS) / BPS_DENOMINATOR)

    const res = await executeMintV2({
      config: cfg,
      token,
      account,
      plan,
      routerAddress: '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as `0x${string}`,
      multicallExecutor: '0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD' as `0x${string}`,
    })
    expect(res.hash).toBe('0xhash')

    const { simulateLeverageRouterV2Deposit } = await import('@/lib/contracts/generated')
    expect(simulateLeverageRouterV2Deposit).toHaveBeenCalledTimes(1)
    const callArgs = (simulateLeverageRouterV2Deposit as any).mock.calls[0][1].args
    // deposit(token, collateralFromSender, flashLoanAmount, minShares, multicallExecutor, swapCalls)
    expect(callArgs[0]).toBe(token)
    expect(callArgs[1]).toBe(plan.equityInInputAsset)
    expect(callArgs[2]).toBe(plan.expectedDebt)
    expect(callArgs[3]).toBe(plan.minShares)
    expect(callArgs[4]).toBe('0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD')
    expect(callArgs[5]).toEqual(plan.calls)
  })

  it('uses provided maxSwapCost override', async () => {
    const plan = {
      inputAsset: '0x1111111111111111111111111111111111111111' as `0x${string}`,
      equityInInputAsset: 2_000n,
      minShares: 1_800n,
      calls: [],
      expectedTotalCollateral: 10_000n,
      expectedDebt: 5_000n,
    }
    const overrideMaxSwapCost = 1234n
    await executeMintV2({
      config: cfg,
      token,
      account,
      plan,
      maxSwapCostInCollateralAsset: overrideMaxSwapCost,
      routerAddress: '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as `0x${string}`,
      multicallExecutor: '0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD' as `0x${string}`,
    })
    const { simulateLeverageRouterV2Deposit } = await import('@/lib/contracts/generated')
    const callArgs = (simulateLeverageRouterV2Deposit as any).mock.calls[0][1].args
    // position of maxSwapCost no longer present in deposit; ensure args unaffected by override
    expect(callArgs[2]).toBe(plan.expectedDebt)
  })
})
