import type { Address, Hex } from 'viem'
import { describe, expect, it, type Mock, vi } from 'vitest'

vi.mock('@/lib/contracts/generated', () => ({
  readLeverageManagerV2GetLeverageTokenCollateralAsset: vi.fn(
    async () => '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC' as Address,
  ),
  readLeverageManagerV2GetLeverageTokenDebtAsset: vi.fn(
    async () => '0xdDdDddDdDDdDdDdDdDdDddDdDDdDdDDDdDDDdDDD' as Address,
  ),
  readLeverageManagerV2PreviewRedeem: vi.fn(async () => ({
    collateral: 100000000000000000000n, // 100 ETH (18 decimals)
    debt: 50000000n, // 50 USDC (6 decimals)
    shares: 50n,
    tokenFee: 0n,
    treasuryFee: 0n,
  })),
  readLeverageManagerV2GetLeverageTokenLendingAdapter: vi.fn(
    async () => '0x2222222222222222222222222222222222222222' as Address,
  ),
}))

import { planRedeem, type RedeemPlan, validateRedeemPlan } from '@/domain/redeem/planner/plan'
import type { LeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { BASE_WETH } from '@/lib/contracts/addresses'
// Import mocked functions for type-safe mocking
import {
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2PreviewRedeem,
} from '@/lib/contracts/generated'

const dummyQuoteTarget = '0x0000000000000000000000000000000000000aAa' as Address
const mockCollateralAsset = '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC' as Address
const mockDebtAsset = '0xdDdDddDdDDdDdDdDdDdDddDdDDdDdDDDdDDDdDDD' as Address
const mockPreviewRedeem = readLeverageManagerV2PreviewRedeem as unknown as Mock
const mockGetCollateralAsset =
  readLeverageManagerV2GetLeverageTokenCollateralAsset as unknown as Mock
const leverageTokenConfig = {
  address: '0x1111111111111111111111111111111111111111' as Address,
  chainId: 1,
  collateralAsset: { address: mockCollateralAsset, decimals: 18 },
  debtAsset: { address: mockDebtAsset, decimals: 6 },
} as unknown as LeverageTokenConfig
const blockNumber = 1n

function createMockQuoteFunction({
  outValue,
  minOutValue,
  maxInValue,
}: {
  outValue: bigint
  minOutValue: bigint
  maxInValue: bigint
}) {
  return async function mockQuote() {
    return {
      out: outValue,
      minOut: minOutValue,
      maxIn: maxInValue,
      approvalTarget: dummyQuoteTarget,
      calls: [{ target: dummyQuoteTarget, data: '0x1234' as Hex, value: 0n }],
    }
  }
}

async function mockQuote(args: {
  amountIn: bigint
  amountOut: bigint
  intent: 'exactOut' | 'exactIn'
}) {
  const { amountIn, amountOut, intent } = args

  // Mock prices: ETH = $2000, USDC = $1.001
  const ETH_PRICE = 2000
  const USDC_PRICE = 1.001
  const ETH_DECIMALS = 18
  const USDC_DECIMALS = 6

  if (intent === 'exactOut') {
    // Convert debt (USDC) to collateral (ETH) using prices
    // amountOut is in USDC (6 decimals)
    const usdcAmount = Number(amountOut) / 10 ** USDC_DECIMALS
    const usdValue = usdcAmount * USDC_PRICE
    const ethNeeded = usdValue / ETH_PRICE
    const ethInUnits = BigInt(Math.ceil(ethNeeded * 10 ** ETH_DECIMALS))

    return {
      out: amountOut,
      minOut: amountOut,
      maxIn: ethInUnits,
      approvalTarget: dummyQuoteTarget,
      calls: [{ target: dummyQuoteTarget, data: '0x1234' as Hex, value: 0n }],
    }
  }

  // For exactIn, convert collateral (ETH) to debt (USDC)
  const ethAmount = Number(amountIn) / 10 ** ETH_DECIMALS
  const usdValue = ethAmount * ETH_PRICE
  const usdcOut = usdValue / USDC_PRICE
  const usdcInUnits = BigInt(Math.floor(usdcOut * 10 ** USDC_DECIMALS))

  return {
    out: usdcInUnits,
    minOut: usdcInUnits,
    maxIn: amountIn,
    approvalTarget: dummyQuoteTarget,
    calls: [{ target: dummyQuoteTarget, data: '0x1234' as Hex, value: 0n }],
  }
}

describe('planRedeem', () => {
  it('should plan a redeem', async () => {
    const plan = await planRedeem({
      wagmiConfig: {} as any,
      leverageTokenConfig,
      sharesToRedeem: 50n,
      slippageBps: 50,
      quoteCollateralToDebt: mockQuote as any,
      intent: 'exactOut',
      blockNumber,
    })

    expect(plan.expectedTotalCollateral).toBe(100000000000000000000n) // 100 ETH
    expect(plan.expectedDebt).toBe(50000000n) // 50 USDC
    expect(plan.expectedCollateral).toBeLessThan(plan.expectedTotalCollateral)
    expect(plan.expectedDebtPayout).toBe(0n)
    expect(plan.payoutAsset.toLowerCase()).toBe(mockCollateralAsset.toLowerCase())
    expect(plan.payoutAmount).toBe(plan.expectedCollateral)
  })

  it('should revert if the debt output from the swap is below the required debt', async () => {
    await expect(
      planRedeem({
        wagmiConfig: {} as any,
        leverageTokenConfig,
        sharesToRedeem: 50n,
        slippageBps: 50,
        quoteCollateralToDebt: createMockQuoteFunction({
          outValue: 0n, // No USDC output (less than required 50 USDC)
          minOutValue: 0n,
          maxInValue: 100000000000000000n, // 0.1 ETH
        }) as any,
        intent: 'exactOut',
        blockNumber,
      }),
    ).rejects.toThrow(
      'Try increasing slippage: swap of collateral to repay debt for the leveraged position is below the required debt.',
    )
  })

  it('should revert if the collateral required for the swap is above the allowed amount wrt slippage', async () => {
    mockPreviewRedeem.mockResolvedValueOnce({
      collateral: 500000000000000000n, // 0.5 ETH
      debt: 50000000n,
      shares: 50n,
      tokenFee: 0n,
      treasuryFee: 0n,
    })
    await expect(
      planRedeem({
        wagmiConfig: {} as any,
        leverageTokenConfig,
        sharesToRedeem: 50n,
        slippageBps: 50,
        quoteCollateralToDebt: createMockQuoteFunction({
          outValue: 50000000n, // 50 USDC
          minOutValue: 50000000n,
          maxInValue: 1000000000000000000n, // 1 ETH (more than available ~0.525 ETH)
        }) as any,
        intent: 'exactOut',
        blockNumber,
      }),
    ).rejects.toThrow(
      'Try increasing slippage: the transaction will likely revert due to unmet minimum collateral received',
    )
  })

  it('always returns collateral as payout asset', async () => {
    const plan = await planRedeem({
      wagmiConfig: {} as any,
      leverageTokenConfig,
      sharesToRedeem: 50n,
      slippageBps: 50,
      quoteCollateralToDebt: mockQuote as any,
      intent: 'exactOut',
      blockNumber,
    })

    expect(plan.payoutAsset.toLowerCase()).toBe(mockCollateralAsset.toLowerCase())
    expect(plan.expectedDebtPayout).toBe(0n)
    expect(plan.payoutAmount).toBe(plan.expectedCollateral)
  })

  it('should handle native collateral (WETH) redemption', async () => {
    // Override mock to return WETH as collateral
    mockGetCollateralAsset.mockResolvedValueOnce(BASE_WETH)
    const plan = await planRedeem({
      wagmiConfig: {} as any,
      leverageTokenConfig: {
        ...leverageTokenConfig,
        collateralAsset: { address: BASE_WETH, decimals: 18 },
      } as LeverageTokenConfig,
      sharesToRedeem: 50n,
      slippageBps: 50,
      quoteCollateralToDebt: mockQuote as any,
      intent: 'exactOut',
      blockNumber,
    })

    // Should have at least 2 calls: WETH withdraw + swap
    expect(plan.calls.length).toBeGreaterThanOrEqual(2)

    // First call should be WETH withdraw
    const firstCall = plan.calls[0]
    expect(firstCall?.target.toLowerCase()).toBe(BASE_WETH.toLowerCase())
    // Withdraw function signature: 0x2e1a7d4d
    expect(firstCall?.data.startsWith('0x2e1a7d4d')).toBe(true)
    expect(firstCall?.value).toBe(0n)

    // Second call should have value set (native ETH for swap)
    const secondCall = plan.calls[1]
    expect(secondCall?.value).toBeGreaterThan(0n)
  })

  it('should handle debt output when remaining collateral is zero', async () => {
    // Create a scenario where all collateral is consumed
    mockPreviewRedeem.mockResolvedValueOnce({
      collateral: 25126582278481012n, // Very small collateral (just enough for debt)
      debt: 50000000n,
      shares: 50n,
      tokenFee: 0n,
      treasuryFee: 0n,
    })

    const plan = await planRedeem({
      wagmiConfig: {} as any,
      leverageTokenConfig,
      sharesToRedeem: 50n,
      slippageBps: 50,
      quoteCollateralToDebt: mockQuote as any,
      intent: 'exactOut',
      blockNumber,
    })

    expect(plan.payoutAsset.toLowerCase()).toBe(mockCollateralAsset.toLowerCase())
    expect(plan.expectedCollateral).toBeGreaterThanOrEqual(0n)
  })

  it('should handle zero-debt scenario (no swap needed)', async () => {
    // Scenario: Position has no debt, so redemption just returns all collateral
    mockPreviewRedeem.mockResolvedValueOnce({
      collateral: 100000000000000000000n, // 100 ETH
      debt: 0n, // No debt to repay
      shares: 50n,
      tokenFee: 0n,
      treasuryFee: 0n,
    })

    const plan = await planRedeem({
      wagmiConfig: {} as any,
      leverageTokenConfig,
      sharesToRedeem: 50n,
      slippageBps: 50,
      quoteCollateralToDebt: mockQuote as any,
      intent: 'exactOut',
      blockNumber,
    })

    // With zero debt, no swap should occur
    expect(plan.expectedDebt).toBe(0n)
    expect(plan.expectedCollateral).toBe(100000000000000000000n) // Full collateral
    expect(plan.expectedTotalCollateral).toBe(100000000000000000000n)
    expect(plan.payoutAsset.toLowerCase()).toBe('0xcccccccccccccccccccccccccccccccccccccccc')
    expect(plan.payoutAmount).toBe(100000000000000000000n)
  })

  it('should handle extreme slippage tolerance (90%)', async () => {
    // Test with very high slippage (9000 bps = 90%)
    const plan = await planRedeem({
      wagmiConfig: {} as any,
      leverageTokenConfig,
      sharesToRedeem: 50n,
      slippageBps: 9000, // 90% slippage tolerance
      quoteCollateralToDebt: mockQuote as any,
      intent: 'exactOut',
      blockNumber,
    })

    // With 90% slippage, minimum collateral should be 10% of expected
    expect(plan.expectedCollateral).toBeGreaterThan(0n)
    const minCollateral = plan.minCollateralForSender
    const expectedCollateral = plan.expectedCollateral

    // minCollateral should be approximately 10% of expectedCollateral
    expect(minCollateral).toBeLessThanOrEqual((expectedCollateral * 11n) / 100n)
    expect(minCollateral).toBeGreaterThanOrEqual((expectedCollateral * 9n) / 100n)
  })

  it('should reject unrealistic tiny collateral amounts', async () => {
    // Test with minimal collateral that cannot cover swap costs
    mockPreviewRedeem.mockResolvedValueOnce({
      collateral: 1000n, // Very small amount
      debt: 1n, // 1 wei of debt
      shares: 1n,
      tokenFee: 0n,
      treasuryFee: 0n,
    })

    // Planner should reject this as the collateral is insufficient for the swap
    await expect(
      planRedeem({
        wagmiConfig: {} as any,
        leverageTokenConfig,
        sharesToRedeem: 1n,
        slippageBps: 50,
        quoteCollateralToDebt: mockQuote as any,
        intent: 'exactOut',
        blockNumber,
      }),
    ).rejects.toThrow(
      'Try increasing slippage: the transaction will likely revert due to unmet minimum collateral received',
    )
  })

  it('should handle small but realistic collateral amounts', async () => {
    // Test with small amounts that are still realistic (0.001 ETH)
    mockPreviewRedeem.mockResolvedValueOnce({
      collateral: 1000000000000000n, // 0.001 ETH (15 decimals)
      debt: 500n, // 0.0005 USDC (6 decimals)
      shares: 100n,
      tokenFee: 0n,
      treasuryFee: 0n,
    })

    const plan = await planRedeem({
      wagmiConfig: {} as any,
      leverageTokenConfig,
      sharesToRedeem: 100n,
      slippageBps: 50,
      quoteCollateralToDebt: mockQuote as any,
      intent: 'exactOut',
      blockNumber,
    })

    // Should successfully plan with small but realistic amounts
    expect(plan.sharesToRedeem).toBe(100n)
    expect(plan.expectedTotalCollateral).toBe(1000000000000000n)
    expect(plan.expectedCollateral).toBeGreaterThan(0n)
  })
})

describe('validateRedeemPlan', () => {
  const validPlan: RedeemPlan = {
    token: '0x1111111111111111111111111111111111111111' as Address,
    sharesToRedeem: 1000000000000000000n,
    collateralAsset: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address,
    debtAsset: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as Address,
    slippageBps: 50,
    previewCollateral: 1000000000000000000n,
    previewDebt: 50000000n,
    collateralSpent: 50000000000000000n,
    previewCollateralForSender: 950000000000000000n,
    minCollateralForSender: 900000000000000000n,
    expectedCollateral: 950000000000000000n,
    expectedDebt: 50000000n,
    collateralToDebtQuote: {
      out: 50000000n,
      minOut: 49000000n,
      maxIn: 100000000000000000n,
      approvalTarget: '0xcccccccccccccccccccccccccccccccccccccccc' as Address,
      calls: [
        {
          target: '0xcccccccccccccccccccccccccccccccccccccccc' as Address,
          data: '0x1234' as Hex,
          value: 0n,
        },
      ],
    },
    expectedTotalCollateral: 1000000000000000000n,
    expectedExcessCollateral: 950000000000000000n,
    expectedDebtPayout: 0n,
    payoutAsset: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address,
    payoutAmount: 950000000000000000n,
    calls: [],
  }

  it('should return true for valid plan', () => {
    expect(validateRedeemPlan(validPlan)).toBe(true)
  })

  it('should return false if sharesToRedeem is zero', () => {
    const invalidPlan = { ...validPlan, sharesToRedeem: 0n }
    expect(validateRedeemPlan(invalidPlan)).toBe(false)
  })

  it('should return false if expectedCollateral is negative', () => {
    const invalidPlan = { ...validPlan, expectedCollateral: -1n }
    expect(validateRedeemPlan(invalidPlan)).toBe(false)
  })

  it('should return false if minCollateralForSender is negative', () => {
    const invalidPlan = { ...validPlan, minCollateralForSender: -1n }
    expect(validateRedeemPlan(invalidPlan)).toBe(false)
  })

  it('should return false if expectedDebtPayout is negative', () => {
    const invalidPlan = { ...validPlan, expectedDebtPayout: -1n }
    expect(validateRedeemPlan(invalidPlan)).toBe(false)
  })

  it('should return false if payoutAmount is negative', () => {
    const invalidPlan = { ...validPlan, payoutAmount: -1n }
    expect(validateRedeemPlan(invalidPlan)).toBe(false)
  })

  it('should return false if slippageBps is negative', () => {
    const invalidPlan = { ...validPlan, slippageBps: -1 }
    expect(validateRedeemPlan(invalidPlan)).toBe(false)
  })

  it('should return false if slippageBps exceeds 10000', () => {
    const invalidPlan = { ...validPlan, slippageBps: 10001 }
    expect(validateRedeemPlan(invalidPlan)).toBe(false)
  })

  it('should return false if minCollateralForSender exceeds expectedCollateral', () => {
    const invalidPlan = {
      ...validPlan,
      minCollateralForSender: 1000000000000000000n,
      expectedCollateral: 950000000000000000n,
    }
    expect(validateRedeemPlan(invalidPlan)).toBe(false)
  })
})
