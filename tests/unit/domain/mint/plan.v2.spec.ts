import type { Address, Hex } from 'viem'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import type { Config } from 'wagmi'
import { planMint } from '@/domain/mint/planner/plan'
import type { LeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import {
  readLeverageManagerV2GetLeverageTokenState,
  readLeverageManagerV2PreviewDeposit,
  readLeverageRouterV2PreviewDeposit,
} from '@/lib/contracts/generated'

vi.mock('@/lib/contracts/generated', () => ({
  readLeverageManagerV2GetLeverageTokenState: vi.fn(),
  readLeverageRouterV2PreviewDeposit: vi.fn(),
  readLeverageManagerV2PreviewDeposit: vi.fn(),
}))

const wagmiConfig = {} as Config
const leverageToken = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address
const collateral = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as Address
const debt = '0xcccccccccccccccccccccccccccccccccccccccc' as Address

const leverageTokenConfig: LeverageTokenConfig = {
  address: leverageToken,
  name: 'Test Leverage Token',
  symbol: 'tLT',
  description: 'Test leverage token config',
  chainId: 8453,
  chainName: 'Base',
  chainLogo: () => null,
  leverageRatio: 2,
  decimals: 18,
  collateralAsset: {
    address: collateral,
    symbol: 'COLL',
    name: 'Collateral',
    description: 'Collateral asset',
    decimals: 18,
  },
  debtAsset: {
    address: debt,
    symbol: 'DEBT',
    name: 'Debt',
    decimals: 6,
  },
  swaps: {},
  test: {
    mintIntegrationTest: {
      equityInCollateralAsset: 1n ** 18n,
    },
  },
}

const readState = readLeverageManagerV2GetLeverageTokenState as Mock
const readRouterPreview = readLeverageRouterV2PreviewDeposit as Mock
const readManagerPreview = readLeverageManagerV2PreviewDeposit as Mock

describe('planMint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    readState.mockResolvedValue({ collateralRatio: 3n * 10n ** 18n })
    readRouterPreview.mockResolvedValue({
      collateral: 2_000n,
      debt: 1_000n,
      shares: 1_000n,
      tokenFee: 0n,
      treasuryFee: 0n,
    })
    readManagerPreview.mockResolvedValue({
      collateral: 2_500n,
      debt: 1_300n,
      shares: 1_600n,
      tokenFee: 0n,
      treasuryFee: 0n,
    })
  })

  it('builds a plan with leverage-adjusted slippage and approvals', async () => {
    const quote = vi.fn(async ({ slippageBps }: { slippageBps: number }) => ({
      out: 1_200n,
      minOut: 1_100n,
      approvalTarget: debt,
      calls: [{ target: debt, data: '0x01' as Hex, value: 0n }],
      slippageBps,
    }))

    readManagerPreview.mockResolvedValueOnce({
      collateral: 2_500n,
      debt: 1_300n,
      shares: 1_600n,
      tokenFee: 0n,
      treasuryFee: 0n,
    })
    // managerMin response for minOut path
    readManagerPreview.mockResolvedValueOnce({
      collateral: 2_400n,
      debt: 1_100n,
      shares: 1_500n,
      tokenFee: 0n,
      treasuryFee: 0n,
    })

    const plan = await planMint({
      wagmiConfig,
      leverageTokenConfig,
      equityInCollateralAsset: 500n,
      slippageBps: 100,
      quoteDebtToCollateral: quote as any,
    })

    // flash loan and shares are slippage-adjusted from router preview
    expect(plan.flashLoanAmount).toBe(990n)
    expect(plan.minShares).toBe(990n)
    expect(plan.previewShares).toBe(1_600n)
    expect(plan.previewExcessDebt).toBe(310n) // 1300 - 990
    expect(plan.minExcessDebt).toBe(110n) // 1100 - 990
    expect(plan.calls[0]?.target).toBe(debt) // approval first
    expect(plan.calls.length).toBeGreaterThanOrEqual(1)

    // quote slippage scales with leverage using a 50% factor:
    // collateralRatio 3 → leverage 1.5 → (100 * 0.5)/(1.5-1)=100 bps
    expect(quote).toHaveBeenCalledWith(
      expect.objectContaining({
        slippageBps: 100,
        amountIn: 990n,
        intent: 'exactIn',
        inToken: debt,
        outToken: collateral,
      }),
    )
  })

  it('throws when manager previewed debt is below flash loan amount', async () => {
    readManagerPreview.mockResolvedValueOnce({
      collateral: 2_500n,
      debt: 800n,
      shares: 1_600n,
      tokenFee: 0n,
      treasuryFee: 0n,
    })

    const quote = vi.fn(async () => ({
      out: 1_200n,
      minOut: 1_100n,
      approvalTarget: debt,
      calls: [{ target: debt, data: '0x01' as Hex, value: 0n }],
    }))

    await expect(
      planMint({
        wagmiConfig,
        leverageTokenConfig,
        equityInCollateralAsset: 500n,
        slippageBps: 100,
        quoteDebtToCollateral: quote as any,
      }),
    ).rejects.toThrow(/previewed debt 800.*flash loan amount 990/i)
  })

  it('throws when minimum shares from manager are below slippage floor', async () => {
    readManagerPreview.mockResolvedValueOnce({
      collateral: 2_500n,
      debt: 1_300n,
      shares: 1_600n,
      tokenFee: 0n,
      treasuryFee: 0n,
    })
    readManagerPreview.mockResolvedValueOnce({
      collateral: 2_400n,
      debt: 1_000n,
      shares: 800n, // below minShares of 990n
      tokenFee: 0n,
      treasuryFee: 0n,
    })

    const quote = vi.fn(async () => ({
      out: 1_200n,
      minOut: 1_100n,
      approvalTarget: debt,
      calls: [{ target: debt, data: '0x01' as Hex, value: 0n }],
    }))

    await expect(
      planMint({
        wagmiConfig,
        leverageTokenConfig,
        equityInCollateralAsset: 500n,
        slippageBps: 100,
        quoteDebtToCollateral: quote as any,
      }),
    ).rejects.toThrow(/minimum shares.*less than min shares/i)
  })
})
