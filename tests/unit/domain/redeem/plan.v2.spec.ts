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
    collateral: 100n,
    debt: 50n,
    sharesRedeemed: 50n,
    maxSharesRedeemable: 50n,
    fee: 0n,
    borrowShares: 0n,
    borrowAssets: 0n,
  })),
  readLeverageManagerV2GetLeverageTokenLendingAdapter: vi.fn(
    async () => '0x2222222222222222222222222222222222222222' as Address,
  ),
}))

vi.mock('wagmi/actions', () => ({
  getPublicClient: vi.fn(() => ({
    readContract: vi.fn(async () => 50n),
  })),
}))

vi.mock('@/lib/prices/coingecko', () => ({
  fetchCoingeckoTokenUsdPrices: vi.fn(async () => ({
    '0xcccccccccccccccccccccccccccccccccccccccc': 2000, // collateral (ETH)
    '0xdddddddddddddddddddddddddddddddddddddddd': 1.001, // debt (USDC)
  })),
}))

import { planRedeemV2 } from '@/domain/redeem/planner/plan.v2'

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

  // For exactOut, pretend the router needs 1 unit more collateral than the debt required
  if (intent === 'exactOut') {
    return {
      out: amountOut,
      minOut: amountOut,
      maxIn: amountOut + 1n,
      approvalTarget: dummyQuoteTarget,
      calldata: '0x1234' as `0x${string}`,
    }
  }

  // For exactIn, return 1 less unit than provided to simulate fees/slippage
  const out = amountIn - 1n
  return {
    out,
    minOut: out,
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

    expect(plan.expectedTotalCollateral).toBe(100n)
    expect(plan.expectedCollateral).toBe(98n) // Realistic swap: minimal collateral swapped for debt
    expect(plan.expectedDebt).toBe(50n)
    expect(plan.expectedDebtPayout).toBe(3950n) // Excess debt from swap: 2 ETH -> ~4000 USDC, minus 50 debt
    expect(plan.payoutAsset.toLowerCase()).toBe('0xcccccccccccccccccccccccccccccccccccccccc')
    expect(plan.payoutAmount).toBe(98n)
  })

  it('should revert if the debt output from the swap is below the required debt', async () => {
    await expect(
      planRedeemV2({
        config: {} as any,
        token: '0x1111111111111111111111111111111111111111' as Address,
        sharesToRedeem: 50n,
        slippageBps: 50,
        quoteCollateralToDebt: createMockQuoteFunction({
          outValue: 0n,
          minOutValue: 0n,
          maxInValue: 50n,
        }) as any,
        chainId: 1,
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
          outValue: 50n,
          minOutValue: 50n,
          maxInValue: 99n,
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
    expect(plan.expectedDebtPayout).toBe(199950n) // Realistic: 100 ETH -> 200000 USDC, minus 50 debt = 199950
    expect(plan.payoutAmount).toBe(199950n)
    expect(plan.payoutAmount > 0n).toBe(true)
    expect(plan.expectedExcessCollateral).toBe(0n) // Full debt output, no excess collateral
    expect(plan.calls.length).toBeGreaterThan(2)
  })
})
