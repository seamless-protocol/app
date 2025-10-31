import type { Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'
import { planMintV2 } from '@/domain/mint/planner/plan.v2'

const BASE_WETH = '0x4200000000000000000000000000000000000006' as Address
const COLLATERAL = '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address

vi.mock('@/lib/contracts/generated', async () => {
  return {
    readLeverageManagerV2GetLeverageTokenCollateralAsset: vi.fn(
      async () => '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address,
    ),
    readLeverageManagerV2GetLeverageTokenDebtAsset: vi.fn(async () => BASE_WETH),
    readLeverageManagerV2PreviewDeposit: vi.fn(async (_config: any, { args }: any) => {
      const totalCollateral = args[1] as bigint
      // Final preview sizes debt below or equal to flash loan; shares ~= total collateral
      return {
        collateral: totalCollateral,
        debt: 120n * 10n ** 18n,
        shares: totalCollateral,
        tokenFee: 0n,
        treasuryFee: 0n,
      }
    }),
    readLeverageRouterV2PreviewDeposit: vi.fn(async (_config: any, { args }: any) => {
      const equity = args[1] as bigint
      // require +60e18 collateral from debt, and mint shares ~= total collateral
      return {
        collateral: equity + 60n * 10n ** 18n,
        debt: 200n * 10n ** 18n,
        shares: equity + 60n * 10n ** 18n,
        tokenFee: 0n,
        treasuryFee: 0n,
      }
    }),
  }
})

vi.mock('wagmi/actions', () => ({
  getPublicClient: vi.fn(() => ({
    readContract: vi.fn(async () => 18n), // Mock decimals as 18
  })),
}))

vi.mock('@/lib/prices/coingecko', () => ({
  fetchCoingeckoTokenUsdPrices: vi.fn(async () => ({
    [COLLATERAL.toLowerCase()]: 1, // Use $1 for small test amounts
    [BASE_WETH.toLowerCase()]: 1, // Use $1 for small test amounts
  })),
}))

describe('planMintV2 (native path, exact-in)', () => {
  it('uses exact-in quote and emits native path calls (withdraw + payable swap)', async () => {
    const inputAsset = '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address
    const equityInInputAsset = 100n * 10n ** 18n
    // neededFromDebtSwap will be 60e18 (from mock preview)

    const quoteDebtToCollateral = vi.fn(async (req: any) => {
      // exact-in path: return 1:1 for USD validation to pass
      return {
        out: req.amountIn as bigint,
        approvalTarget: '0x9999999999999999999999999999999999999999' as Address,
        calldata: '0xdeadbeef' as `0x${string}`,
      }
    })

    const plan = await planMintV2({
      config: {} as any,
      token: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address,
      inputAsset,
      equityInInputAsset,
      slippageBps: 50, // Reduced to allow USD validation to pass
      quoteDebtToCollateral,
      chainId: 8453,
    })

    expect(quoteDebtToCollateral).toHaveBeenCalled()
    // expectedTotalCollateral = 100e18 + 120e18
    expect(plan.expectedTotalCollateral).toBe(220n * 10n ** 18n)
    // ERC20 path: first call approve(WETH), second is swap (value == 0)
    expect(plan.calls.length).toBe(2)
    expect(plan.calls[0]?.target).toBe(BASE_WETH)
    expect(plan.calls[0]?.value).toBe(0n)
    expect(plan.calls[1]?.value).toBe(0n)
  })
})
