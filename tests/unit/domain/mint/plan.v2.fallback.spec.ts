import type { Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'
import { planMintV2 } from '@/domain/mint/planner/plan.v2'

const COLLATERAL = '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address

vi.mock('@/lib/contracts/generated', async () => {
  return {
    readLeverageManagerV2GetLeverageTokenCollateralAsset: vi.fn(async () => COLLATERAL),
    readLeverageManagerV2GetLeverageTokenDebtAsset: vi.fn(
      async () => '0x2222222222222222222222222222222222222222' as Address,
    ),
    readLeverageManagerV2PreviewDeposit: vi.fn(async (_config: any, { args }: any) => {
      const totalCollateral = args[1] as bigint
      // Return lower requiredDebt to trigger clamp + re-quote
      return {
        collateral: totalCollateral,
        debt: 120n,
        shares: totalCollateral,
        tokenFee: 0n,
        treasuryFee: 0n,
      }
    }),
    readLeverageRouterV2PreviewDeposit: vi.fn(async (_config: any, { args }: any) => {
      const equity = args[1] as bigint
      // needs +50 collateral from debt, and shares ~= total collateral
      return {
        collateral: equity + 50n,
        debt: 200n,
        shares: equity + 50n,
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
    '0xcccccccccccccccccccccccccccccccccccccccc': 2000, // collateral (ETH)
    '0x2222222222222222222222222222222222222222': 1, // debt (USDC)
  })),
}))

describe('planMintV2 fallback exact-in sizing and non-native path', () => {
  it('falls back to exact-in refinement when exact-out lacks maxIn and uses approve + non-payable swap for ERC-20 debt', async () => {
    const inputAsset = COLLATERAL
    const equityInInputAsset = 100n
    let calls = 0
    const quoteDebtToCollateral = vi.fn(async (req: any) => {
      calls += 1
      // Force fallback: exact-out returns no maxIn and out smaller than needed
      if (req.intent === 'exactOut') {
        return {
          out: (req.amountOut as bigint) - 1n,
          approvalTarget: '0x9999999999999999999999999999999999999999' as Address,
          calldata: '0xdeadbeef' as `0x${string}`,
        }
      }
      // exact-in refinement: return gradually closer outs; keep it simple and sufficient
      return {
        out: 50n,
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

    expect(calls).toBeGreaterThan(1)
    // expectedTotalCollateral = 100 + 50
    expect(plan.expectedTotalCollateral).toBe(150n)
    // Non-native path: approve then swap with value = 0
    expect(plan.calls.length).toBe(2)
    expect(plan.calls[0]?.target).toBe('0x2222222222222222222222222222222222222222')
    expect(plan.calls[0]?.value).toBe(0n)
    expect(plan.calls[1]?.target).toBe('0x9999999999999999999999999999999999999999')
    expect(plan.calls[1]?.value).toBe(0n)
  })
})
