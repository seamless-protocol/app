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

const leverageTokenConfigRedeemWithVelora = {
  ...leverageTokenConfig,
  swaps: {
    collateralToDebt: {
      type: 'balmy',
      sourceWhitelist: ['paraswap'],
      sourceConfig: {
        custom: {
          paraswap: {
            includeContractMethods: ['swapExactAmountOut'],
          },
        },
      },
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
      out: 350n,
      minOut: 330n,
      approvalTarget: debtAsset,
      calls: [{ target: debtAsset, data: '0x1234' as Hex, value: 0n }],
    }))

    const plan = await planRedeem({
      publicClient,
      leverageTokenConfig,
      sharesToRedeem: 100n,
      collateralSlippageBps: 100,
      swapSlippageBps: 100,
      collateralSwapAdjustmentBps: 100,
      quoteCollateralToDebt: quote as any,
    })

    // exchange rate becomes (quote.out * 1e18 / (preview.collateral - previewEquity)) = (350 * 1e18) / (1000 - 800) = 1.75e18
    // so minCollateralToSpend becomes (preview.debt * exchangeRateScale) / exchangeRate = (300 * 1e18) / 1.75e18 = 171
    // so collateralToSpend becomes minCollateralToSpend * 1.01 = 171 * 1.01 = 172
    // thus minCollateralForSender becomes (preview.collateral - collateralToSpend) * 0.99 = (1000 - 172) * 0.99 = 819
    expect(plan.minCollateralForSender).toBe(819n)
    expect(plan.previewCollateralForSender).toBe(828n) // preview.collateral - collateralToSpend = 1000 - 172 = 827
    expect(plan.previewExcessDebt).toBe(50n) // 350 - 300
    expect(plan.minExcessDebt).toBe(30n) // 330 - 300
    expect(plan.calls[0]?.target).toBe(collateralAsset) // approval first
    expect(plan.calls.length).toBeGreaterThanOrEqual(1)

    // first quote
    expect(quote).toHaveBeenCalledWith(
      expect.objectContaining({
        slippageBps: 100,
        amountIn: 200n, // preview.collateral - convertToAssets(netShares) = 1000 - 800 = 200
        intent: 'exactIn',
        inToken: collateralAsset,
        outToken: debtAsset,
      }),
    )

    // second quote
    expect(quote).toHaveBeenCalledWith(
      expect.objectContaining({
        slippageBps: 100,
        amountIn: 172n, // collateralToSpend
        intent: 'exactIn',
        inToken: collateralAsset,
        outToken: debtAsset,
      }),
    )
  })

  it('builds a plan with slippage and approvals for balmy redemptions using exact amount out velora quote', async () => {
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
      leverageTokenConfig: leverageTokenConfigRedeemWithVelora,
      sharesToRedeem: 100n,
      collateralSlippageBps: 50,
      swapSlippageBps: 10,
      collateralSwapAdjustmentBps: 100,
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

  it('throws when preview collateral minus max input amount is less than min collateral for sender for balmy redemptions using exact amount out velora quote', async () => {
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
        leverageTokenConfig: leverageTokenConfigRedeemWithVelora,
        sharesToRedeem: 100n,
        collateralSlippageBps: 50,
        swapSlippageBps: 10,
        collateralSwapAdjustmentBps: 100,
        quoteCollateralToDebt: quote as any,
      }),
    ).rejects.toThrow(
      /Collateral slippage tolerance is too low. Try increasing your collateral slippage tolerance/i,
    )
  })

  it('throws when preview collateral minus min collateral to spend is less than 0', async () => {
    const quote = vi.fn(async () => ({
      out: 10n,
      minOut: 5n,
    }))

    await expect(
      planRedeem({
        publicClient,
        leverageTokenConfig,
        sharesToRedeem: 100n,
        collateralSlippageBps: 50,
        swapSlippageBps: 10,
        collateralSwapAdjustmentBps: 100,
        quoteCollateralToDebt: quote as any,
      }),
    ).rejects.toThrow(/Insufficient DEX liquidity to redeem 100 shares/i)
  })

  it('throws when min collateral for sender is less than 0', async () => {
    readContract.mockReset()
    readContract.mockResolvedValueOnce({
      collateral: 40n,
      debt: 300n,
      shares: 100n,
      tokenFee: 0n,
      treasuryFee: 0n,
    })
    readContract.mockResolvedValueOnce(30n)

    const quote = vi.fn(async () => ({
      out: 100n,
      minOut: 99n,
      approvalTarget: debtAsset,
      calls: [{ target: debtAsset, data: '0x1234' as Hex, value: 0n }],
    }))

    await expect(
      planRedeem({
        publicClient,
        leverageTokenConfig,
        sharesToRedeem: 100n,
        collateralSlippageBps: 50,
        swapSlippageBps: 10,
        collateralSwapAdjustmentBps: 5000,
        quoteCollateralToDebt: quote as any,
      }),
    ).rejects.toThrow(/Try decreasing your collateral swap adjustment/i)
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
        collateralSlippageBps: 100,
        swapSlippageBps: 100,
        collateralSwapAdjustmentBps: 100,
        quoteCollateralToDebt: quote as any,
      }),
    ).rejects.toThrow(/Try increasing your collateral swap adjustment/i)
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
        collateralSlippageBps: 100,
        swapSlippageBps: 100,
        collateralSwapAdjustmentBps: 100,
        quoteCollateralToDebt: quote as any,
      }),
    ).rejects.toThrow(
      /Try decreasing your swap slippage tolerance. If you cannot further decrease it, try increasing your collateral swap adjustment/i,
    )
  })

  it('builds a plan with zero collateral slippage tolerance', async () => {
    const quote = vi.fn()
    quote.mockResolvedValueOnce({
      out: 290n,
      minOut: 280n,
      approvalTarget: debtAsset,
      calls: [{ target: debtAsset, data: '0x1234' as Hex, value: 0n }],
    })

    quote.mockResolvedValueOnce({
      out: 310n,
      minOut: 305n,
      approvalTarget: debtAsset,
      calls: [{ target: debtAsset, data: '0x1234' as Hex, value: 0n }],
    })

    const plan = await planRedeem({
      publicClient,
      leverageTokenConfig,
      sharesToRedeem: 100n,
      collateralSlippageBps: 0,
      swapSlippageBps: 100,
      collateralSwapAdjustmentBps: 100,
      quoteCollateralToDebt: quote as any,
    })

    expect(plan.minCollateralForSender).toBe(792n)
    expect(plan.previewCollateralForSender).toBe(792n)
    expect(plan.previewExcessDebt).toBe(10n)
    expect(plan.minExcessDebt).toBe(5n)
    expect(plan.calls[0]?.target).toBe(collateralAsset) // approval first
    expect(plan.calls.length).toBeGreaterThanOrEqual(1)

    expect(quote).toHaveBeenCalledWith(
      expect.objectContaining({
        slippageBps: 100,
        amountIn: 200n,
        intent: 'exactIn',
        inToken: collateralAsset,
        outToken: debtAsset,
      }),
    )

    expect(quote).toHaveBeenCalledWith(
      expect.objectContaining({
        slippageBps: 100,
        amountIn: 208n,
        intent: 'exactIn',
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
        collateralSwapAdjustmentBps: 100,
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
        collateralSwapAdjustmentBps: 100,
        quoteCollateralToDebt: vi.fn() as any,
      }),
    ).rejects.toThrow(/Swap slippage cannot be less than 0.01%/i)
  })
})
