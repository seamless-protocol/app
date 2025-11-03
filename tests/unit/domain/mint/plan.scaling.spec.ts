import type { Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'
import type { Config } from 'wagmi'
import { planMint } from '@/domain/mint/planner/plan'

const DUMMY_CONFIG = {} as unknown as Config
const TOKEN = '0x0000000000000000000000000000000000000001' as Address
const COLLATERAL = '0x0000000000000000000000000000000000000002' as Address
const DEBT = '0x0000000000000000000000000000000000000003' as Address

// Mock router.previewDeposit to drive scaling math
const routerPreview = vi.fn(async ({ args }: { args: [Address, bigint] }) => {
  const userCollateral = args[1]
  return {
    collateral: userCollateral * 2n,
    debt: 4_463_830_821n,
    shares: 1_000_000_000_000_000_000n,
    tokenFee: 0n,
    treasuryFee: 0n,
  }
})

// Patch manager getters via dynamic import mocking pattern (local override)
vi.mock('@/lib/contracts/generated', () => ({
  readLeverageManagerV2GetLeverageTokenCollateralAsset: () => COLLATERAL,
  readLeverageManagerV2GetLeverageTokenDebtAsset: () => DEBT,
  readLeverageManagerV2PreviewDeposit: (_config: any, { args }: { args: [Address, bigint] }) => ({
    collateral: args[1],
    debt: 9_999_999_999n,
    shares: args[1],
    tokenFee: 0n,
    treasuryFee: 0n,
  }),
  readLeverageRouterV2PreviewDeposit: (_config: any, params: any) => routerPreview(params),
}))

vi.mock('wagmi/actions', () => ({
  getPublicClient: vi.fn(() => ({
    readContract: vi.fn(async () => 18n), // Mock decimals as 18
  })),
}))

vi.mock('@/lib/prices/coingecko', () => ({
  fetchCoingeckoTokenUsdPrices: vi.fn(async () => ({
    [COLLATERAL.toLowerCase()]: 2000, // collateral (ETH)
    [DEBT.toLowerCase()]: 1, // debt (USDC)
  })),
}))

describe('planner scaling under underfill', () => {
  it('scales flash loan when quotedOut < neededFromSwap', async () => {
    // User brings 1.0 collateral
    const equityInInputAsset = 1_000_000_000_000_000_000n

    // Quote function that underfills first, then matches scaled amount
    let first = true
    const quoteDebtToCollateral = async (_args: {
      inToken: Address
      outToken: Address
      amountIn: bigint
    }) => {
      if (first) {
        first = false
        // Initial quote out: 0.997357108403566456 collateral
        return {
          out: 997_357_108_403_566_456n,
          approvalTarget: '0x0000000000000000000000000000000000000004' as Address,
          calldata: '0x',
        }
      }
      // After scaling, final quote out: 0.994020891474923263 collateral
      return {
        out: 994_020_891_474_923_263n,
        approvalTarget: '0x0000000000000000000000000000000000000004' as Address,
        calldata: '0x',
      }
    }

    const plan = await planMint({
      config: DUMMY_CONFIG,
      token: TOKEN,
      inputAsset: COLLATERAL,
      equityInInputAsset,
      slippageBps: 50,
      quoteDebtToCollateral: quoteDebtToCollateral as any,
      chainId: 8453,
    })

    expect(plan.expectedTotalCollateral).toBe(1_994_020_891_474_923_263n)
    expect(plan.expectedDebt >= 4_450_453_945n).toBe(true)
    expect(plan.minShares > 0n).toBe(true)
  })
})
