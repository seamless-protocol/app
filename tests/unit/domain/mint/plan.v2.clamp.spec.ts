import type { Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'
import { planMintV2 } from '@/domain/mint/planner/plan.v2'

const BASE_WETH = '0x4200000000000000000000000000000000000006' as Address
const COLLATERAL = '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address

let previewCall = 0
vi.mock('@/lib/contracts/generated', async () => {
  return {
    readLeverageManagerV2GetLeverageTokenCollateralAsset: vi.fn(async () => COLLATERAL),
    readLeverageManagerV2GetLeverageTokenDebtAsset: vi.fn(async () => BASE_WETH),
    readLeverageRouterV2PreviewDeposit: vi.fn(async (_config: any, params: { args: [Address, bigint] }) => {
      const userCollateral = params.args[1]
      previewCall += 1
      if (previewCall === 1) {
        // Ideal preview: requires +60 out of swaps, sizes idealDebt 150
        return {
          collateral: userCollateral + 60n,
          debt: 150n,
          shares: userCollateral + 60n,
          tokenFee: 0n,
          treasuryFee: 0n,
        }
      }
      // Final preview returns lower previewed debt (120) to trigger clamp path
      return {
        collateral: userCollateral + 60n,
        debt: 120n,
        shares: userCollateral + 60n,
        tokenFee: 0n,
        treasuryFee: 0n,
      }
    }),
  }
})

describe('planMintV2 final clamp + re-quote', () => {
  it('clamps when final previewed debt < sized flash loan and re-quotes once', async () => {
    const inputAsset = COLLATERAL
    const equityInInputAsset = 100n

    // Router previews are mocked above; no ManagerPort now

    const quotedForAmountIn: bigint[] = []
    const quoteDebtToCollateral = vi.fn(async (req: any) => {
      if (req.intent === 'exactOut') {
        return {
          out: req.amountOut as bigint,
          minOut: req.amountOut as bigint,
          maxIn: 140n, // sized larger than final previewed debt to trigger clamp
          approvalTarget: '0x9999999999999999999999999999999999999999' as Address,
          calldata: '0xdeadbeef' as `0x${string}`,
        }
      }
      // record amounts used in re-quote path
      quotedForAmountIn.push(req.amountIn as bigint)
      return {
        out: (req.amountIn as bigint) - 5n, // arbitrary positive out
        approvalTarget: '0x9999999999999999999999999999999999999999' as Address,
        calldata: '0xfeedbeef' as `0x${string}`,
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

    // Re-quote must be called at least once with the clamped amount (120)
    expect(quotedForAmountIn.some((a) => a === 120n)).toBe(true)
    // Native path: withdraw then payable swap with value equal to clamped debt (120)
    expect(plan.calls.length).toBe(2)
    expect(plan.calls[0]?.target).toBe(BASE_WETH)
    expect(plan.calls[1]?.value).toBe(120n)
  })
})
