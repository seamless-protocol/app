import type { Address } from 'viem'
import { decodeFunctionData, erc20Abi } from 'viem'
import { describe, expect, it, vi } from 'vitest'
import type { Config } from 'wagmi'
import type { RedeemPlanV2 } from '@/domain/redeem/planner/plan.v2'
import type { QuoteFn, QuoteRequest } from '@/domain/shared/adapters/types'
import type { readLeverageManagerV2PreviewRedeem } from '@/lib/contracts/generated'

// Unmock the function we want to test
vi.unmock('@/domain/redeem/planner/plan.v2')

type PreviewRedeemResult = Awaited<ReturnType<typeof readLeverageManagerV2PreviewRedeem>>

vi.mock('@/lib/contracts/generated', () => ({
  readLeverageManagerV2GetLeverageTokenCollateralAsset: vi.fn(
    async () => '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC' as Address,
  ),
  readLeverageManagerV2GetLeverageTokenDebtAsset: vi.fn(
    async () => '0xdDdDddDdDDdDdDdDdDdDddDdDDdDdDDDdDDDdDDD' as Address,
  ),
  readLeverageManagerV2PreviewRedeem: vi.fn(
    async (): Promise<PreviewRedeemResult> =>
      ({
        collateral: 100n,
        debt: 50n,
        shares: 50n,
        tokenFee: 0n,
        treasuryFee: 0n,
      }) as PreviewRedeemResult,
  ),
}))

import { planRedeemV2 } from '@/domain/redeem/planner/plan.v2'

const dummyQuoteTarget = '0x0000000000000000000000000000000000000aAa' as Address
const mockConfig = {} as Config

const quoteWithFloor: QuoteFn = async ({ amountIn }) => {
  const out = amountIn === 0n ? 0n : amountIn - 1n
  return {
    out,
    minOut: out,
    approvalTarget: dummyQuoteTarget,
    calldata: '0x1234' as `0x${string}`,
  }
}

describe('planRedeemV2 basic functionality', () => {
  it('pads collateral used for debt swaps to avoid rounding shortfalls', async () => {
    const plan = await planRedeemV2({
      config: mockConfig,
      token: '0x1111111111111111111111111111111111111111' as Address,
      sharesToRedeem: 50n,
      slippageBps: 50,
      quoteCollateralToDebt: quoteWithFloor,
      managerAddress: '0x2222222222222222222222222222222222222222' as Address,
      chainId: 1,
    })

    expect(plan.expectedTotalCollateral).toBe(100n)

    const spentCollateral = plan.expectedTotalCollateral - plan.expectedCollateral
    expect(spentCollateral).toBe(53n)

    expect(plan.payoutAsset.toLowerCase()).toBe('0xcccccccccccccccccccccccccccccccccccccccc')
    expect(plan.payoutAmount).toBe(plan.expectedCollateral)
    // quoteWithFloor returns (53n - 1n) = 52n debt, we need 50n, so 2n excess
    expect(plan.expectedDebtPayout).toBe(2n)

    const approvalCall = plan.calls[0]
    expect(approvalCall).toBeDefined()
    if (!approvalCall) throw new Error('approval call missing')
    expect(approvalCall.target.toLowerCase()).toBe('0xcccccccccccccccccccccccccccccccccccccccc')

    const decoded = decodeFunctionData({ abi: erc20Abi, data: approvalCall.data })
    expect(decoded.functionName).toBe('approve')
    expect(decoded.args?.[1]).toBe(53n)
  })

  it('supports redeeming into the debt asset when requested', async () => {
    const plan = await planRedeemV2({
      config: mockConfig,
      token: '0x1111111111111111111111111111111111111111' as Address,
      sharesToRedeem: 50n,
      slippageBps: 50,
      quoteCollateralToDebt: quoteWithFloor,
      managerAddress: '0x2222222222222222222222222222222222222222' as Address,
      outputAsset: '0xdDdDddDdDDdDdDdDdDdDddDdDDdDdDDDdDDDdDDD' as Address,
      chainId: 1,
    })

    expect(plan.payoutAsset.toLowerCase()).toBe('0xdddddddddddddddddddddddddddddddddddddddd')
    expect(plan.expectedCollateral).toBe(0n)
    expect(plan.payoutAmount).toBe(46n)
    expect(plan.payoutAmount > 0n).toBe(true)
    expect(plan.expectedExcessCollateral - plan.payoutAmount).toBe(1n)
    expect(plan.calls.length).toBeGreaterThan(2)
  })
})

describe('planRedeemV2 exact-out path', () => {
  it('uses exact-out preQuote and sets expectedDebtPayout when quote out > debt', async () => {
    const plan = await planRedeemV2({
      config: mockConfig,
      token: '0x1111111111111111111111111111111111111111' as Address,
      sharesToRedeem: 50n,
      slippageBps: 50,
      // exact-out preQuote: maxIn provided, out > debt
      quoteCollateralToDebt: (async (req: QuoteRequest) => {
        if (req.intent === 'exactOut') {
          return {
            maxIn: 20n,
            out: 55n, // repay 50, 5 returned as excess debt payout
            approvalTarget: dummyQuoteTarget,
            calldata: '0x1234' as `0x${string}`,
          }
        }
        // Fallback shouldn't be used in this path; return sane defaults
        return {
          out: 55n,
          approvalTarget: dummyQuoteTarget,
          calldata: '0x1234' as `0x${string}`,
        }
      }) satisfies QuoteFn,
      managerAddress: '0x2222222222222222222222222222222222222222' as Address,
      chainId: 1,
    })

    expect(plan.expectedDebt).toBe(50n)
    expect(plan.expectedDebtPayout).toBe(5n)
    expect(plan.calls.length).toBeGreaterThan(0)
    // ERC-20 approve path should be present (no native withdraw)
    const hasApprove = plan.calls.some((c) => c.data.startsWith('0x095ea7b3'))
    expect(hasApprove).toBe(true)
  })
})

describe('planRedeemV2 exact-in path', () => {
  it('uses exact-in path and sets expectedDebtPayout when swap returns excess debt', async () => {
    const plan = await planRedeemV2({
      config: mockConfig,
      token: '0x1111111111111111111111111111111111111111' as Address,
      sharesToRedeem: 50n,
      slippageBps: 50,
      // Force exact-in path by making exact-out throw
      quoteCollateralToDebt: (async (req: QuoteRequest) => {
        if (req.intent === 'exactOut') {
          throw new Error('exact-out not supported')
        }
        // exact-in sizing: return slightly more debt than needed due to padding/buffer
        return {
          out: 53n, // repay 50, 3 returned as excess (from padding + buffer)
          approvalTarget: dummyQuoteTarget,
          calldata: '0xabcd' as `0x${string}`,
        }
      }) satisfies QuoteFn,
      managerAddress: '0x2222222222222222222222222222222222222222' as Address,
      chainId: 1,
    })

    expect(plan.expectedDebt).toBe(50n)
    expect(plan.expectedDebtPayout).toBe(3n) // Captured from actual swap output!
    expect(plan.calls.length).toBeGreaterThan(0)
    const hasApprove = plan.calls.some((c) => c.data.startsWith('0x095ea7b3'))
    expect(hasApprove).toBe(true)
  })
})

describe('planRedeemV2 sizing errors', () => {
  it('throws when quote returns zero output while sizing', async () => {
    const badQuote = (async (req: QuoteRequest) => {
      if (req.intent === 'exactOut') throw new Error('no exact-out support')
      return {
        out: 0n,
        approvalTarget: dummyQuoteTarget,
        calldata: '0xdead' as `0x${string}`,
      }
    }) satisfies QuoteFn

    await expect(
      planRedeemV2({
        config: mockConfig,
        token: '0x1111111111111111111111111111111111111111' as Address,
        sharesToRedeem: 50n,
        slippageBps: 50,
        quoteCollateralToDebt: badQuote,
        managerAddress: '0x2222222222222222222222222222222222222222' as Address,
        chainId: 1,
      }),
    ).rejects.toThrow('Quote returned zero output while sizing collateral swap')
  })

  it('throws when output < debt at upper bound during sizing', async () => {
    let calls = 0
    const trickyQuote = (async (req: QuoteRequest) => {
      if (req.intent === 'exactOut') throw new Error('no exact-out support')
      calls += 1
      // First iteration: drive required to upperBound
      if (calls === 1) {
        return {
          out: 25n, // required -> 100n == upperBound
          approvalTarget: dummyQuoteTarget,
          calldata: '0xface' as `0x${string}`,
        }
      }
      // Second iteration: attempt === upperBound, force out < debt
      return {
        out: 49n,
        approvalTarget: dummyQuoteTarget,
        calldata: '0xface' as `0x${string}`,
      }
    }) satisfies QuoteFn

    await expect(
      planRedeemV2({
        config: mockConfig,
        token: '0x1111111111111111111111111111111111111111' as Address,
        sharesToRedeem: 50n,
        slippageBps: 50,
        quoteCollateralToDebt: trickyQuote,
        managerAddress: '0x2222222222222222222222222222222222222222' as Address,
        chainId: 1,
      }),
    ).rejects.toThrow('Collateral swap output is less than debt to repay; increase slippage')
  })

  it('throws when required collateral exceeds max available', async () => {
    const smallOutQuote = (async (req: QuoteRequest) => {
      if (req.intent === 'exactOut') throw new Error('no exact-out support')
      return {
        out: 20n, // required = ceil(2500/20)=125 > upperBound 100
        approvalTarget: dummyQuoteTarget,
        calldata: '0xbeef' as `0x${string}`,
      }
    }) satisfies QuoteFn

    await expect(
      planRedeemV2({
        config: mockConfig,
        token: '0x1111111111111111111111111111111111111111' as Address,
        sharesToRedeem: 50n,
        slippageBps: 50,
        quoteCollateralToDebt: smallOutQuote,
        managerAddress: '0x2222222222222222222222222222222222222222' as Address,
        chainId: 1,
      }),
    ).rejects.toThrow('Required collateral is greater than max collateral available')
  })
})

describe('planRedeemV2 no-debt early return', () => {
  it('returns all collateral when there is no debt to repay', async () => {
    // Mock preview with zero debt
    const { readLeverageManagerV2PreviewRedeem } = await import('@/lib/contracts/generated')
    vi.mocked(readLeverageManagerV2PreviewRedeem).mockResolvedValueOnce({
      collateral: 100n,
      debt: 0n, // No debt!
      shares: 50n,
      tokenFee: 0n,
      treasuryFee: 0n,
    } as PreviewRedeemResult)

    const plan = await planRedeemV2({
      config: mockConfig,
      token: '0x1111111111111111111111111111111111111111' as Address,
      sharesToRedeem: 50n,
      slippageBps: 50,
      quoteCollateralToDebt: quoteWithFloor,
      managerAddress: '0x2222222222222222222222222222222222222222' as Address,
      chainId: 1,
    })

    expect(plan.expectedDebt).toBe(0n)
    expect(plan.expectedCollateral).toBe(100n)
    expect(plan.expectedTotalCollateral).toBe(100n)
    expect(plan.expectedExcessCollateral).toBe(100n)
    expect(plan.expectedDebtPayout).toBe(0n)
    expect(plan.calls).toEqual([]) // No swaps needed
    expect(plan.payoutAmount).toBe(100n)
  })
})

describe('planRedeemV2 WETH native path', () => {
  it('uses WETH withdraw instead of ERC20 approve for WETH collateral', async () => {
    const { BASE_WETH } = await import('@/lib/contracts/addresses')
    const {
      readLeverageManagerV2GetLeverageTokenCollateralAsset,
      readLeverageManagerV2GetLeverageTokenDebtAsset,
    } = await import('@/lib/contracts/generated')

    // Mock WETH as collateral
    vi.mocked(readLeverageManagerV2GetLeverageTokenCollateralAsset).mockResolvedValueOnce(BASE_WETH)
    vi.mocked(readLeverageManagerV2GetLeverageTokenDebtAsset).mockResolvedValueOnce(
      '0xdDdDddDdDDdDdDdDdDdDddDdDDdDdDDDdDDDdDDD' as Address,
    )

    const plan = await planRedeemV2({
      config: mockConfig,
      token: '0x1111111111111111111111111111111111111111' as Address,
      sharesToRedeem: 50n,
      slippageBps: 50,
      quoteCollateralToDebt: quoteWithFloor,
      managerAddress: '0x2222222222222222222222222222222222222222' as Address,
      chainId: 8453, // Base
    })

    expect(plan.calls.length).toBeGreaterThan(0)
    // First call should be WETH withdraw, not ERC20 approve
    const firstCall = plan.calls[0]
    expect(firstCall?.target.toLowerCase()).toBe(BASE_WETH.toLowerCase())
    // WETH withdraw signature: 0x2e1a7d4d
    expect(firstCall?.data.startsWith('0x2e1a7d4d')).toBe(true)
  })
})

describe('planRedeemV2 validation', () => {
  it('validateRedeemPlan rejects invalid plans', async () => {
    const { validateRedeemPlan } = await import('@/domain/redeem/planner/plan.v2')

    // Invalid: zero shares
    expect(
      validateRedeemPlan({
        sharesToRedeem: 0n,
        expectedCollateral: 100n,
        minCollateralForSender: 95n,
        expectedDebtPayout: 0n,
        payoutAmount: 100n,
        slippageBps: 50,
      } as RedeemPlanV2),
    ).toBe(false)

    // Invalid: negative expected collateral
    expect(
      validateRedeemPlan({
        sharesToRedeem: 50n,
        expectedCollateral: -1n,
        minCollateralForSender: 95n,
        expectedDebtPayout: 0n,
        payoutAmount: 100n,
        slippageBps: 50,
      } as RedeemPlanV2),
    ).toBe(false)

    // Invalid: slippage > 10000
    expect(
      validateRedeemPlan({
        sharesToRedeem: 50n,
        expectedCollateral: 100n,
        minCollateralForSender: 95n,
        expectedDebtPayout: 0n,
        payoutAmount: 100n,
        slippageBps: 10001,
      } as RedeemPlanV2),
    ).toBe(false)

    // Invalid: minCollateralForSender > expectedCollateral
    expect(
      validateRedeemPlan({
        sharesToRedeem: 50n,
        expectedCollateral: 100n,
        minCollateralForSender: 101n,
        expectedDebtPayout: 0n,
        payoutAmount: 100n,
        slippageBps: 50,
      } as RedeemPlanV2),
    ).toBe(false)

    // Valid plan
    expect(
      validateRedeemPlan({
        sharesToRedeem: 50n,
        expectedCollateral: 100n,
        minCollateralForSender: 95n,
        expectedDebtPayout: 0n,
        payoutAmount: 100n,
        slippageBps: 50,
      } as RedeemPlanV2),
    ).toBe(true)
  })
})
