import type { Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'
import { planMint } from '@/domain/mint/planner/plan'

const BASE_WETH = '0x4200000000000000000000000000000000000006' as Address
const COLLATERAL = '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address

let previewCall = 0
vi.mock('@/lib/contracts/generated', async () => {
  return {
    readLeverageManagerV2GetLeverageTokenCollateralAsset: vi.fn(async () => COLLATERAL),
    readLeverageManagerV2GetLeverageTokenDebtAsset: vi.fn(async () => BASE_WETH),
    readLeverageManagerV2PreviewDeposit: vi.fn(
      async (_config: any, params: { args: [Address, bigint] }) => {
        const userPlusSwap = params.args[1]
        // Final preview returns lower previewed debt (120e18) to trigger clamp path
        return {
          collateral: userPlusSwap,
          debt: 120n * 10n ** 18n,
          shares: userPlusSwap,
          tokenFee: 0n,
          treasuryFee: 0n,
        }
      },
    ),
    readLeverageRouterV2PreviewDeposit: vi.fn(
      async (_config: any, params: { args: [Address, bigint] }) => {
        const userCollateral = params.args[1]
        previewCall += 1
        if (previewCall === 1) {
          // Ideal preview: requires +60e18 out of swaps, sizes idealDebt 150e18
          return {
            collateral: userCollateral + 60n * 10n ** 18n,
            debt: 150n * 10n ** 18n,
            shares: userCollateral + 60n * 10n ** 18n,
            tokenFee: 0n,
            treasuryFee: 0n,
          }
        }
        // Final preview returns lower previewed debt (120e18) to trigger clamp path
        return {
          collateral: userCollateral + 60n * 10n ** 18n,
          debt: 120n * 10n ** 18n,
          shares: userCollateral + 60n * 10n ** 18n,
          tokenFee: 0n,
          treasuryFee: 0n,
        }
      },
    ),
  }
})

// Decimals are now passed as parameters instead of being fetched on-chain

vi.mock('@/lib/prices/coingecko', () => ({
  fetchCoingeckoTokenUsdPrices: vi.fn(async () => ({
    [COLLATERAL.toLowerCase()]: 1, // Use $1 for small test amounts
    [BASE_WETH.toLowerCase()]: 1, // Use $1 for small test amounts
  })),
}))

describe('planMint final clamp + re-quote', () => {
  it('clamps when final previewed debt < sized flash loan and re-quotes once', async () => {
    const inputAsset = COLLATERAL
    const equityInInputAsset = 100n * 10n ** 18n

    // Router previews are mocked above; no ManagerPort now

    const quotedForAmountIn: Array<bigint> = []
    const quoteDebtToCollateral = vi.fn(async (req: any) => {
      if (req.intent === 'exactOut') {
        return {
          out: req.amountOut as bigint,
          minOut: req.amountOut as bigint,
          maxIn: 140n * 10n ** 18n, // sized larger than final previewed debt to trigger clamp
          approvalTarget: '0x9999999999999999999999999999999999999999' as Address,
          calldata: '0xdeadbeef' as `0x${string}`,
        }
      }
      // record amounts used in re-quote path
      quotedForAmountIn.push(req.amountIn as bigint)
      return {
        out: (req.amountIn as bigint) - 5n * 10n ** 18n, // arbitrary positive out
        approvalTarget: '0x9999999999999999999999999999999999999999' as Address,
        calldata: '0xfeedbeef' as `0x${string}`,
      }
    })

    const plan = await planMint({
      config: {} as any,
      token: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address,
      inputAsset,
      equityInInputAsset,
      slippageBps: 500, // Increased for tiny test amounts
      quoteDebtToCollateral,
      chainId: 8453,
      collateralAsset: COLLATERAL,
      debtAsset: BASE_WETH,
      collateralAssetDecimals: 18,
      debtAssetDecimals: 18,
    })

    // Re-quote must be called at least once with the clamped amount (120e18)
    expect(quotedForAmountIn.some((a) => a === 120n * 10n ** 18n)).toBe(true)
    // ERC20 path: approve then swap with value 0 (no native value needed)
    expect(plan.calls.length).toBe(2)
    expect(plan.calls[0]?.target).toBe(BASE_WETH)
    expect(plan.calls[1]?.value).toBe(0n)
  })
})
