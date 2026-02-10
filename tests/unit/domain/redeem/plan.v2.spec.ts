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

const leverageTokenConfigBalmyVelora = {
  ...leverageTokenConfig,
  swaps: {
    collateralToDebt: {
      type: 'balmy',
      sourceWhitelist: ['paraswap'],
    },
  },
} as LeverageTokenConfig

const readContract = publicClient.readContract as Mock

describe('planRedeem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // previewRedeem
    readContract.mockResolvedValueOnce({
      collateral: 1_000n,
      debt: 300n,
      shares: 100n,
      tokenFee: 0n,
      treasuryFee: 0n,
    })
    // convertToAssets
    readContract.mockResolvedValueOnce(800n)
  })

  it('builds a plan with slippage and approvals', async () => {
    const quote = vi.fn(async () => ({
      in: 200n,
      maxIn: 200n,
      out: 302n,
      minOut: 0n,
      approvalTarget: debtAsset,
      calls: [{ target: debtAsset, data: '0x1234' as Hex, value: 0n }],
    }))

    const plan = await planRedeem({
      publicClient,
      leverageTokenConfig,
      sharesToRedeem: 100n,
      collateralSlippageBps: 100,
      swapSlippageBps: 100,
      quoteCollateralToDebt: quote as any,
    })

    expect(plan.previewCollateralForSender).toBe(800n)
    expect(plan.minCollateralForSender).toBe(792n) // 800 * 0.99
    expect(plan.previewExcessDebt).toBe(2n) // 302 - 300
    expect(plan.minExcessDebt).toBe(0n)
    expect(plan.calls[0]?.target).toBe(collateralAsset) // approval first
    expect(plan.calls.length).toBeGreaterThanOrEqual(1)

    expect(quote).toHaveBeenCalledWith(
      expect.objectContaining({
        slippageBps: 100,
        amountOut: 300n,
        intent: 'exactOut',
        inToken: collateralAsset,
        outToken: debtAsset,
      }),
    )
  })

  it('builds a plan with slippage and approvals for balmy (sourceWhitelist: [paraswap]) redemptions', async () => {
    const quote = vi.fn(async () => ({
      out: 350n,
      minOut: 350n,
      in: 208n,
      maxIn: 210n,
      approvalTarget: debtAsset,
      calls: [{ target: debtAsset, data: '0x1234' as Hex, value: 0n }],
    }))

    const plan = await planRedeem({
      publicClient,
      leverageTokenConfig: leverageTokenConfigBalmyVelora,
      sharesToRedeem: 100n,
      collateralSlippageBps: 50,
      swapSlippageBps: 10,
      quoteCollateralToDebt: quote as any,
    })

    expect(plan.minCollateralForSender).toBe(788n) // (1000 - 208) * 0.995
    expect(plan.previewCollateralForSender).toBe(792n) // 1000 - 208
    expect(plan.previewExcessDebt).toBe(0n)
    expect(plan.minExcessDebt).toBe(0n)
    expect(plan.calls.length).toBeGreaterThanOrEqual(1)

    expect(quote).toHaveBeenCalledWith(
      expect.objectContaining({
        slippageBps: 10,
        amountOut: 300n,
        intent: 'exactOut',
        inToken: collateralAsset,
        outToken: debtAsset,
      }),
    )
  })

  it('builds a plan with slippage and approvals for velora redemptions', async () => {
    const leverageTokenConfigVelora = {
      ...leverageTokenConfig,
      swaps: {
        collateralToDebt: {
          type: 'velora',
        },
      },
    } as LeverageTokenConfig

    const quote = vi.fn(async () => ({
      out: 350n,
      minOut: 350n,
      in: 208n,
      maxIn: 210n,
      approvalTarget: debtAsset,
      calls: [{ target: debtAsset, data: '0x1234' as Hex, value: 0n }],
    }))

    const plan = await planRedeem({
      publicClient,
      leverageTokenConfig: leverageTokenConfigVelora,
      sharesToRedeem: 100n,
      collateralSlippageBps: 50,
      swapSlippageBps: 10,
      quoteCollateralToDebt: quote as any,
    })

    expect(plan.minCollateralForSender).toBe(788n) // (1000 - 208) * 0.995
    expect(plan.previewCollateralForSender).toBe(792n) // 1000 - 208
    expect(plan.previewExcessDebt).toBe(0n)
    expect(plan.minExcessDebt).toBe(0n)
    expect(plan.calls.length).toBeGreaterThanOrEqual(1)

    expect(quote).toHaveBeenCalledWith(
      expect.objectContaining({
        slippageBps: 10,
        amountOut: 300n,
        intent: 'exactOut',
        inToken: collateralAsset,
        outToken: debtAsset,
      }),
    )
  })

  it('throws when preview collateral minus max input amount is less than min collateral for sender for balmy redemptions (sourceWhitelist: [paraswap])', async () => {
    const quote = vi.fn(async () => ({
      out: 350n,
      minOut: 350n,
      in: 208n,
      maxIn: 1000n,
      approvalTarget: debtAsset,
      calls: [{ target: debtAsset, data: '0x1234' as Hex, value: 0n }],
    }))

    await expect(
      planRedeem({
        publicClient,
        leverageTokenConfig: leverageTokenConfigBalmyVelora,
        sharesToRedeem: 100n,
        collateralSlippageBps: 50,
        swapSlippageBps: 10,
        quoteCollateralToDebt: quote as any,
      }),
    ).rejects.toThrow(
      /Collateral slippage tolerance is too low. Try increasing your collateral slippage tolerance/i,
    )
  })

  it('builds a plan with zero collateral slippage tolerance', async () => {
    const quote = vi.fn(async () => ({
      out: 350n,
      minOut: 350n,
      in: 200n,
      maxIn: 200n,
      approvalTarget: debtAsset,
      calls: [{ target: debtAsset, data: '0x1234' as Hex, value: 0n }],
    }))

    const plan = await planRedeem({
      publicClient,
      leverageTokenConfig,
      sharesToRedeem: 100n,
      collateralSlippageBps: 0,
      swapSlippageBps: 100,
      quoteCollateralToDebt: quote as any,
    })

    expect(plan.minCollateralForSender).toBe(800n) // 800 * 1
    expect(plan.previewCollateralForSender).toBe(800n)
    expect(plan.previewExcessDebt).toBe(50n) // 350 - 300
    expect(plan.minExcessDebt).toBe(0n)
    expect(plan.calls[0]?.target).toBe(collateralAsset) // approval first
    expect(plan.calls.length).toBeGreaterThanOrEqual(1)

    expect(quote).toHaveBeenCalledWith(
      expect.objectContaining({
        slippageBps: 100,
        amountOut: 300n,
        intent: 'exactOut',
        inToken: collateralAsset,
        outToken: debtAsset,
      }),
    )
  })

  it('throws error when collateral slippage tolerance is negative', async () => {
    await expect(
      planRedeem({
        publicClient,
        leverageTokenConfig,
        sharesToRedeem: 100n,
        collateralSlippageBps: -100,
        swapSlippageBps: 100,
        quoteCollateralToDebt: vi.fn() as any,
      }),
    ).rejects.toThrow(/Collateral slippage cannot be less than 0/i)
  })

  it('throws error when swap slippage is less than 0.01%', async () => {
    await expect(
      planRedeem({
        publicClient,
        leverageTokenConfig,
        sharesToRedeem: 100n,
        collateralSlippageBps: 100,
        swapSlippageBps: 0,
        quoteCollateralToDebt: vi.fn() as any,
      }),
    ).rejects.toThrow(/Swap slippage cannot be less than 0.01%/i)
  })
})
