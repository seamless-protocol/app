import type { Address, Hex } from 'viem'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'

vi.mock('@/domain/redeem/planner/plan', async () => {
  const actual = await vi.importActual<typeof import('@/domain/redeem/planner/plan')>(
    '@/domain/redeem/planner/plan',
  )
  return actual
})

import { planRedeem } from '@/domain/redeem/planner/plan'
import type { LeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import {
  readLeverageManagerV2ConvertToAssets,
  readLeverageManagerV2GetLeverageTokenState,
  readLeverageManagerV2PreviewRedeem,
} from '@/lib/contracts/generated'

vi.mock('@/lib/contracts/generated', () => ({
  readLeverageManagerV2GetLeverageTokenState: vi.fn(),
  readLeverageManagerV2PreviewRedeem: vi.fn(),
  readLeverageManagerV2ConvertToAssets: vi.fn(),
}))

const collateralAsset = '0xcccccccccccccccccccccccccccccccccccccccc' as Address
const debtAsset = '0xdddddddddddddddddddddddddddddddddddddddd' as Address
const leverageTokenConfig: LeverageTokenConfig = {
  address: '0x1111111111111111111111111111111111111111' as Address,
  chainId: 1,
  collateralAsset: { address: collateralAsset, decimals: 18 },
  debtAsset: { address: debtAsset, decimals: 6 },
} as LeverageTokenConfig
const blockNumber = 1n

const readState = readLeverageManagerV2GetLeverageTokenState as Mock
const readPreviewRedeem = readLeverageManagerV2PreviewRedeem as Mock
const readConvertToAssets = readLeverageManagerV2ConvertToAssets as Mock

describe('planRedeem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    readState.mockResolvedValue({ collateralRatio: 3n * 10n ** 18n })
    readPreviewRedeem.mockResolvedValue({
      collateral: 1_000n,
      debt: 300n,
      shares: 100n,
      tokenFee: 0n,
      treasuryFee: 0n,
    })
    readConvertToAssets.mockResolvedValue(800n)
  })

  it('builds a plan with leverage-adjusted slippage and approvals', async () => {
    const quote = vi.fn(async () => ({
      out: 350n,
      minOut: 330n,
      approvalTarget: debtAsset,
      calls: [{ target: debtAsset, data: '0x1234' as Hex, value: 0n }],
    }))

    const plan = await planRedeem({
      wagmiConfig: {} as any,
      blockNumber,
      leverageTokenConfig,
      sharesToRedeem: 100n,
      slippageBps: 100,
      quoteCollateralToDebt: quote as any,
    })

    expect(plan.minCollateralForSender).toBe(792n) // 800 * 0.99
    expect(plan.previewCollateralForSender).toBe(792n)
    expect(plan.previewExcessDebt).toBe(50n) // 350 - 300
    expect(plan.minExcessDebt).toBe(30n) // 330 - 300
    expect(plan.calls[0]?.target).toBe(collateralAsset) // approval first
    expect(plan.calls.length).toBeGreaterThanOrEqual(1)

    // slippage scales with leverage: collateralRatio 3 → leverage 1.5 → 100/(1.5-1)=200 bps
    expect(quote).toHaveBeenCalledWith(
      expect.objectContaining({
        slippageBps: 200,
        amountIn: 208n, // 1000 - 792
      }),
    )
  })

  it('throws when swap output is below required debt', async () => {
    const quote = vi.fn(async () => ({
      out: 200n,
      minOut: 200n,
      approvalTarget: debtAsset,
      calls: [{ target: debtAsset, data: '0x1234' as Hex, value: 0n }],
    }))

    await expect(
      planRedeem({
        wagmiConfig: {} as any,
        blockNumber,
        leverageTokenConfig,
        sharesToRedeem: 100n,
        slippageBps: 100,
        quoteCollateralToDebt: quote as any,
      }),
    ).rejects.toThrow(/less than preview debt/i)
  })

  it('throws when minOut is below required debt', async () => {
    const quote = vi.fn(async () => ({
      out: 400n,
      minOut: 100n,
      approvalTarget: debtAsset,
      calls: [{ target: debtAsset, data: '0x1234' as Hex, value: 0n }],
    }))

    await expect(
      planRedeem({
        wagmiConfig: {} as any,
        blockNumber,
        leverageTokenConfig,
        sharesToRedeem: 100n,
        slippageBps: 100,
        quoteCollateralToDebt: quote as any,
      }),
    ).rejects.toThrow(/minimum output .* less than preview debt/i)
  })
})
