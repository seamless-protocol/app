import type { Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'
import { planMintV2 } from '@/domain/mint/planner/plan.v2'

const BASE_WETH = '0x4200000000000000000000000000000000000006' as Address

vi.mock('@/lib/contracts/generated', async () => {
  return {
    readLeverageManagerV2GetLeverageTokenCollateralAsset: vi.fn(
      async () => '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address,
    ),
    readLeverageManagerV2GetLeverageTokenDebtAsset: vi.fn(async () => BASE_WETH),
    readLeverageRouterV2PreviewDeposit: vi.fn(async (_config: any, { args }: any) => {
      const equity = args[1] as bigint
      // require +60 collateral from debt, and mint shares ~= total collateral
      return {
        collateral: equity + 60n,
        debt: 200n,
        shares: equity + 60n,
        tokenFee: 0n,
        treasuryFee: 0n,
      }
    }),
  }
})

describe('planMintV2 (exact-out fast path)', () => {
  it('uses exact-out (LiFi-like) to size debt and emits native path calls (withdraw + payable swap)', async () => {
    const inputAsset = '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address
    const equityInInputAsset = 100n
    // neededFromDebtSwap will be 60 (from mock preview)

    const quoteDebtToCollateral = vi.fn(async (req: any) => {
      // exact-out path returns out == requested (minOut) and maxIn sized to 120
      if (req.intent === 'exactOut') {
        return {
          out: req.amountOut as bigint,
          minOut: req.amountOut as bigint,
          maxIn: 120n,
          approvalTarget: '0x9999999999999999999999999999999999999999' as Address,
          calldata: '0xdeadbeef' as `0x${string}`,
        }
      }
      // fallback (should not be used when exact-out succeeds)
      return {
        out: 0n,
        approvalTarget: '0x9999999999999999999999999999999999999999' as Address,
        calldata: '0x' as `0x${string}`,
      }
    })

    const plan = await planMintV2({
      config: {} as any,
      token: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address,
      inputAsset,
      equityInInputAsset,
      slippageBps: 50,
      quoteDebtToCollateral,
      chainId: 8453,
    })

    expect(quoteDebtToCollateral).toHaveBeenCalled()
    // expectedTotalCollateral = 100 + 60
    expect(plan.expectedTotalCollateral).toBe(160n)
    // Native path: first call withdraw(WETH), second is payable swap (value == debtIn == 120)
    expect(plan.calls.length).toBe(2)
    expect(plan.calls[0]?.target).toBe(BASE_WETH)
    expect(plan.calls[0]?.value).toBe(0n)
    expect(plan.calls[1]?.value).toBe(120n)
  })
})
