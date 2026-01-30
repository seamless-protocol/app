import type { Address, Hex, PublicClient } from 'viem'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { planRedeem } from '@/domain/redeem/planner/plan'
import type { LeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'

// Override the global mock from tests/setup.ts which doesn't include leverageManagerV2Abi.
// We need the actual ABI export since planRedeem uses it directly (not mocked read functions).
vi.mock('@/lib/contracts/generated', async () => {
  const actual = await vi.importActual<typeof import('@/lib/contracts/generated')>(
    '@/lib/contracts/generated',
  )
  return actual
})

const publicClient = {
  multicall: vi.fn().mockResolvedValue([{ status: 'success' }, { status: 'success' }]),
  readContract: vi.fn(),
} as unknown as PublicClient

const collateralAsset = '0xcccccccccccccccccccccccccccccccccccccccc' as Address
const debtAsset = '0xdddddddddddddddddddddddddddddddddddddddd' as Address
const leverageTokenConfig: LeverageTokenConfig = {
  address: '0x1111111111111111111111111111111111111111' as Address,
  chainId: 1,
  collateralAsset: { address: collateralAsset, decimals: 18 },
  debtAsset: { address: debtAsset, decimals: 6 },
} as LeverageTokenConfig

const multicall = publicClient.multicall as Mock
const readContract = publicClient.readContract as Mock

describe('planRedeem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default multicall: getLeverageTokenState + previewRedeem
    multicall.mockResolvedValueOnce([
      { collateralRatio: 3n * 10n ** 18n },
      { collateral: 1_000n, debt: 300n, shares: 100n, tokenFee: 0n, treasuryFee: 0n },
    ])
    // Default readContract: convertToAssets
    readContract.mockResolvedValue(800n)
  })

  it('builds a plan with leverage-adjusted slippage and approvals', async () => {
    const quote = vi.fn(async () => ({
      out: 350n,
      minOut: 330n,
      approvalTarget: debtAsset,
      calls: [{ target: debtAsset, data: '0x1234' as Hex, value: 0n }],
    }))

    const plan = await planRedeem({
      publicClient,
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

    // slippage scales with leverage using a 50% factor: collateralRatio 3 -> leverage 1.5 -> floor(100*0.5/(1.5-1)) = 100 bps
    expect(quote).toHaveBeenCalledWith(
      expect.objectContaining({
        slippageBps: 100,
        amountIn: 208n, // 1000 - 792
        intent: 'exactIn',
        inToken: collateralAsset,
        outToken: debtAsset,
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
        publicClient,
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
        publicClient,
        leverageTokenConfig,
        sharesToRedeem: 100n,
        slippageBps: 100,
        quoteCollateralToDebt: quote as any,
      }),
    ).rejects.toThrow(/minimum output .* less than preview debt/i)
  })
})
