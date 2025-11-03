import type { Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'

// Unmock the function we want to test
vi.unmock('@/domain/redeem/planner/plan.v2')

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

// Import mocked functions for type-safe mocking
import {
  readLeverageManagerV2GetLeverageTokenCollateralAsset,
  readLeverageManagerV2PreviewRedeem,
} from '@/lib/contracts/generated'

vi.mock('wagmi/actions', () => ({
  getPublicClient: vi.fn(() => ({
    readContract: vi.fn(async (args: any) => {
      const address = args.address?.toLowerCase()
      // Return realistic decimals: 18 for ETH-like collateral, 6 for USDC-like debt
      if (address === '0xcccccccccccccccccccccccccccccccccccccccc') {
        return 18n // ETH/WETH decimals
      }
      if (address === '0xdddddddddddddddddddddddddddddddddddddddd') {
        return 6n // USDC decimals
      }
      return 18n // default
    }),
  })),
}))

vi.mock('@/lib/prices/coingecko', () => ({
  fetchCoingeckoTokenUsdPrices: vi.fn(async () => ({
    '0xcccccccccccccccccccccccccccccccccccccccc': 2000, // collateral (ETH)
    '0xdddddddddddddddddddddddddddddddddddddddd': 1.001, // debt (USDC)
  })),
}))

import {
  planRedeemV2,
  type RedeemPlanV2,
  validateRedeemPlan,
} from '@/domain/redeem/planner/plan.v2'
import { BASE_WETH } from '@/lib/contracts/addresses'

const dummyQuoteTarget = '0x0000000000000000000000000000000000000aAa' as Address

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
      calldata: '0x1234' as `0x${string}`,
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
      calldata: '0x1234' as `0x${string}`,
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
    calldata: '0x1234' as `0x${string}`,
  }
}

describe('planRedeemV2', () => {
  it('should plan a redeem', async () => {
    const plan = await planRedeemV2({
      config: {} as any,
      token: '0x1111111111111111111111111111111111111111' as Address,
      sharesToRedeem: 50n,
      slippageBps: 50,
      quoteCollateralToDebt: mockQuote as any,
      chainId: 1,
      intent: 'exactOut',
    })

    expect(plan.expectedTotalCollateral).toBe(100000000000000000000n) // 100 ETH
    expect(plan.expectedDebt).toBe(50000000n) // 50 USDC
    // With realistic prices: need ~0.025 ETH to buy 50 USDC, so ~99.975 ETH remains
    expect(plan.expectedCollateral).toBeGreaterThan(99900000000000000000n) // > 99.9 ETH
    expect(plan.expectedCollateral).toBeLessThan(100000000000000000000n) // < 100 ETH
    expect(plan.expectedDebtPayout).toBe(0n) // No excess debt in collateral mode
    expect(plan.payoutAsset.toLowerCase()).toBe('0xcccccccccccccccccccccccccccccccccccccccc')
    expect(plan.payoutAmount).toBe(plan.expectedCollateral)
  })

  it('should revert if the debt output from the swap is below the required debt', async () => {
    await expect(
      planRedeemV2({
        config: {} as any,
        token: '0x1111111111111111111111111111111111111111' as Address,
        sharesToRedeem: 50n,
        slippageBps: 50,
        quoteCollateralToDebt: createMockQuoteFunction({
          outValue: 0n, // No USDC output (less than required 50 USDC)
          minOutValue: 0n,
          maxInValue: 100000000000000000n, // 0.1 ETH
        }) as any,
        chainId: 1,
        intent: 'exactOut',
      }),
    ).rejects.toThrow(
      'Try increasing slippage: swap of collateral to repay debt for the leveraged position is below the required debt.',
    )
  })

  it('should revert if the collateral required for the swap is above the allowed amount wrt slippage', async () => {
    await expect(
      planRedeemV2({
        config: {} as any,
        token: '0x1111111111111111111111111111111111111111' as Address,
        sharesToRedeem: 50n,
        slippageBps: 50,
        quoteCollateralToDebt: createMockQuoteFunction({
          outValue: 50000000n, // 50 USDC
          minOutValue: 50000000n,
          maxInValue: 1000000000000000000n, // 1 ETH (more than available ~0.525 ETH)
        }) as any,
        chainId: 1,
        intent: 'exactOut',
      }),
    ).rejects.toThrow(
      'Try increasing slippage: the transaction will likely revert due to unmet minimum collateral received',
    )
  })

  it('supports redeeming into the debt asset when requested', async () => {
    const plan = await planRedeemV2({
      config: {} as any,
      token: '0x1111111111111111111111111111111111111111' as Address,
      sharesToRedeem: 50n,
      slippageBps: 50,
      quoteCollateralToDebt: mockQuote as any,
      outputAsset: '0xdDdDddDdDDdDdDdDdDdDddDdDDdDdDDDdDDDdDDD' as Address,
      chainId: 1,
      intent: 'exactOut',
    })

    expect(plan.payoutAsset.toLowerCase()).toBe('0xdddddddddddddddddddddddddddddddddddddddd')
    expect(plan.expectedCollateral).toBe(0n)
    // 100 ETH = $200k, at $1.001/USDC = ~199,800 USDC, minus 50 USDC debt = ~199,750 USDC
    expect(plan.expectedDebtPayout).toBeGreaterThan(199700000000n) // > 199,700 USDC
    expect(plan.expectedDebtPayout).toBeLessThan(199900000000n) // < 199,900 USDC
    expect(plan.payoutAmount).toBe(plan.expectedDebtPayout)
    expect(plan.payoutAmount).toBeGreaterThan(0n)
    expect(plan.expectedExcessCollateral).toBe(0n) // Full debt output, no excess collateral
    expect(plan.calls.length).toBeGreaterThan(2)
  })

  it('should handle native collateral (WETH) redemption', async () => {
    // Override mock to return WETH as collateral
    vi.mocked(readLeverageManagerV2GetLeverageTokenCollateralAsset).mockResolvedValueOnce(BASE_WETH)

    // Mock price for WETH
    const { fetchCoingeckoTokenUsdPrices } = await import('@/lib/prices/coingecko')
    vi.mocked(fetchCoingeckoTokenUsdPrices).mockResolvedValueOnce({
      [BASE_WETH.toLowerCase()]: 2000, // WETH price
      '0xdddddddddddddddddddddddddddddddddddddddd': 1.001, // debt (USDC)
    })

    const plan = await planRedeemV2({
      config: {} as any,
      token: '0x1111111111111111111111111111111111111111' as Address,
      sharesToRedeem: 50n,
      slippageBps: 50,
      quoteCollateralToDebt: mockQuote as any,
      chainId: 1,
      intent: 'exactOut',
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
    vi.mocked(readLeverageManagerV2PreviewRedeem).mockResolvedValueOnce({
      collateral: 25126582278481012n, // Very small collateral (just enough for debt)
      debt: 50000000n,
      shares: 50n,
      tokenFee: 0n,
      treasuryFee: 0n,
    })

    const plan = await planRedeemV2({
      config: {} as any,
      token: '0x1111111111111111111111111111111111111111' as Address,
      sharesToRedeem: 50n,
      slippageBps: 50,
      quoteCollateralToDebt: mockQuote as any,
      outputAsset: '0xdDdDddDdDDdDdDdDdDdDddDdDDdDdDDDdDDDdDDD' as Address,
      chainId: 1,
      intent: 'exactOut',
    })

    // When converting to debt with zero remaining collateral
    expect(plan.payoutAsset.toLowerCase()).toBe('0xdddddddddddddddddddddddddddddddddddddddd')
    expect(plan.expectedCollateral).toBe(0n)
    // Payout should be zero or minimal
    expect(plan.payoutAmount).toBeLessThanOrEqual(1000000n) // <= 1 USDC
  })

  it('should handle zero-debt scenario (no swap needed)', async () => {
    // Scenario: Position has no debt, so redemption just returns all collateral
    vi.mocked(readLeverageManagerV2PreviewRedeem).mockResolvedValueOnce({
      collateral: 100000000000000000000n, // 100 ETH
      debt: 0n, // No debt to repay
      shares: 50n,
      tokenFee: 0n,
      treasuryFee: 0n,
    })

    const plan = await planRedeemV2({
      config: {} as any,
      token: '0x1111111111111111111111111111111111111111' as Address,
      sharesToRedeem: 50n,
      slippageBps: 50,
      quoteCollateralToDebt: mockQuote as any,
      chainId: 1,
      intent: 'exactOut',
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
    const plan = await planRedeemV2({
      config: {} as any,
      token: '0x1111111111111111111111111111111111111111' as Address,
      sharesToRedeem: 50n,
      slippageBps: 9000, // 90% slippage tolerance
      quoteCollateralToDebt: mockQuote as any,
      chainId: 1,
      intent: 'exactOut',
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
    vi.mocked(readLeverageManagerV2PreviewRedeem).mockResolvedValueOnce({
      collateral: 1000n, // Very small amount
      debt: 1n, // 1 wei of debt
      shares: 1n,
      tokenFee: 0n,
      treasuryFee: 0n,
    })

    // Planner should reject this as the collateral is insufficient for the swap
    await expect(
      planRedeemV2({
        config: {} as any,
        token: '0x1111111111111111111111111111111111111111' as Address,
        sharesToRedeem: 1n,
        slippageBps: 50,
        quoteCollateralToDebt: mockQuote as any,
        chainId: 1,
        intent: 'exactOut',
      }),
    ).rejects.toThrow(
      'Try increasing slippage: the transaction will likely revert due to unmet minimum collateral received',
    )
  })

  it('should handle small but realistic collateral amounts', async () => {
    // Test with small amounts that are still realistic (0.001 ETH)
    vi.mocked(readLeverageManagerV2PreviewRedeem).mockResolvedValueOnce({
      collateral: 1000000000000000n, // 0.001 ETH (15 decimals)
      debt: 500n, // 0.0005 USDC (6 decimals)
      shares: 100n,
      tokenFee: 0n,
      treasuryFee: 0n,
    })

    const plan = await planRedeemV2({
      config: {} as any,
      token: '0x1111111111111111111111111111111111111111' as Address,
      sharesToRedeem: 100n,
      slippageBps: 50,
      quoteCollateralToDebt: mockQuote as any,
      chainId: 1,
      intent: 'exactOut',
    })

    // Should successfully plan with small but realistic amounts
    expect(plan.sharesToRedeem).toBe(100n)
    expect(plan.expectedTotalCollateral).toBe(1000000000000000n)
    expect(plan.expectedCollateral).toBeGreaterThan(0n)
  })

  it('should reject when public client is unavailable', async () => {
    // Mock getPublicClient to return undefined
    const { getPublicClient } = await import('wagmi/actions')
    vi.mocked(getPublicClient).mockReturnValueOnce(undefined as any)

    await expect(
      planRedeemV2({
        config: {} as any,
        token: '0x1111111111111111111111111111111111111111' as Address,
        sharesToRedeem: 50n,
        slippageBps: 50,
        quoteCollateralToDebt: mockQuote as any,
        chainId: 1,
        intent: 'exactOut',
      }),
    ).rejects.toThrow('Public client unavailable for redeem plan')
  })
})

describe('validateRedeemPlan', () => {
  const validPlan: RedeemPlanV2 = {
    token: '0x1111111111111111111111111111111111111111' as Address,
    sharesToRedeem: 1000000000000000000n,
    collateralAsset: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address,
    debtAsset: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as Address,
    slippageBps: 50,
    minCollateralForSender: 900000000000000000n,
    expectedCollateral: 950000000000000000n,
    expectedDebt: 50000000n,
    collateralToDebtQuote: {
      out: 50000000n,
      minOut: 49000000n,
      maxIn: 100000000000000000n,
      approvalTarget: '0xcccccccccccccccccccccccccccccccccccccccc' as Address,
      calldata: '0x1234' as `0x${string}`,
    },
    expectedTotalCollateral: 1000000000000000000n,
    expectedExcessCollateral: 50000000000000000n,
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
