import type { Address } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { planMintV2 } from '@/domain/mint/planner/plan.v2'

vi.mock('@/lib/contracts/generated', async () => {
  return {
    readLeverageManagerV2GetLeverageTokenCollateralAsset: vi.fn(
      async () => '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address,
    ),
    readLeverageManagerV2GetLeverageTokenDebtAsset: vi.fn(
      async () => '0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD' as Address,
    ),
    readLeverageManagerV2PreviewDeposit: vi.fn(async (_config: any, { args }: any) => {
      const equity = args[1] as bigint
      // For a given equity, manager needs +10% collateral and plans an initial debt of 5_000
      // Shares equal equity for simplicity
      return {
        collateral: (equity * 11n) / 10n,
        debt: 5_000n,
        equity,
        shares: equity,
        tokenFee: 0n,
        treasuryFee: 0n,
      }
    }),
  }
})

describe('planMintV2', () => {
  const cfg = {} as any
  const token = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('input == collateral: no input conversion calls, sizes debt swap, and computes minShares', async () => {
    const inputAsset = '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address // equals mocked collateral
    const equityInInputAsset = 1_000n

    // Quote returns slightly more than neededFromDebtSwap, so no re-quote path
    const quoteDebtToCollateral = vi.fn(async () => {
      // neededFromDebtSwap = collateral - equity = 1100 - 1000 = 100
      // Return more than needed: 150
      return {
        out: 150n,
        approvalTarget: '0x9999999999999999999999999999999999999999' as Address,
        calldata: '0xdeadbeef' as `0x${string}`,
      }
    })

    const plan = await planMintV2({
      config: cfg,
      token,
      inputAsset,
      equityInInputAsset,
      slippageBps: 50,
      quoteDebtToCollateral,
      chainId: 8453,
    })

    expect(plan.inputAsset).toBe(inputAsset)
    expect(plan.equityInInputAsset).toBe(equityInInputAsset)
    expect(plan.collateralAsset).toBe('0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC')
    expect(plan.debtAsset).toBe('0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD')
    // expectedTotalCollateral = user(1000) + quote.out(150)
    expect(plan.expectedTotalCollateral).toBe(1_150n)
    // minShares is slippage-adjusted 0.5% below expected shares (shares == total collateral via mock)
    expect(plan.minShares).toBeGreaterThan(0n)
    // Calls: approve debt asset then perform aggregator swap
    const calls = plan.calls ?? []
    expect(calls.length).toBe(2)
    expect(calls[0]?.target).toBe(plan.debtAsset)
    expect(calls[0]?.value).toBe(0n)
    expect(calls[1]?.target).toBe('0x9999999999999999999999999999999999999999')
    expect(calls[1]?.value).toBe(0n)
  })
})
