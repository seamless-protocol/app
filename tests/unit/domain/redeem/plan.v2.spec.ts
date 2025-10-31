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
})
