import type { Address } from 'viem'
import { decodeFunctionData, erc20Abi } from 'viem'
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
}))

import { planRedeemV2 } from '@/domain/redeem/planner/plan.v2'

const dummyQuoteTarget = '0x0000000000000000000000000000000000000aAa' as Address

async function quoteWithFloor({ amountIn }: { amountIn: bigint }) {
  const out = amountIn === 0n ? 0n : amountIn - 1n
  return {
    out,
    minOut: out,
    approvalTarget: dummyQuoteTarget,
    calldata: '0x1234' as `0x${string}`,
  }
}

describe('planRedeemV2 collateral padding', () => {
  it('pads collateral used for debt swaps to avoid rounding shortfalls', async () => {
    const plan = await planRedeemV2({
      config: {} as any,
      token: '0x1111111111111111111111111111111111111111' as Address,
      sharesToRedeem: 50n,
      slippageBps: 50,
      quoteCollateralToDebt: quoteWithFloor as any,
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
      config: {} as any,
      token: '0x1111111111111111111111111111111111111111' as Address,
      sharesToRedeem: 50n,
      slippageBps: 50,
      quoteCollateralToDebt: quoteWithFloor as any,
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

describe('planRedeemV2 exact-out + sizing edge cases', () => {
  it('uses exact-out preQuote and sets expectedDebtPayout when quote out > debt', async () => {
    const plan = await planRedeemV2({
      config: {} as any,
      token: '0x1111111111111111111111111111111111111111' as Address,
      sharesToRedeem: 50n,
      slippageBps: 50,
      // exact-out preQuote: maxIn provided, out > debt
      quoteCollateralToDebt: (async (req: any) => {
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
      }) as any,
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

  it('uses exact-in path and sets expectedDebtPayout when swap returns excess debt', async () => {
    const plan = await planRedeemV2({
      config: {} as any,
      token: '0x1111111111111111111111111111111111111111' as Address,
      sharesToRedeem: 50n,
      slippageBps: 50,
      // Force exact-in path by making exact-out throw
      quoteCollateralToDebt: (async (req: any) => {
        if (req.intent === 'exactOut') {
          throw new Error('exact-out not supported')
        }
        // exact-in sizing: return slightly more debt than needed due to padding/buffer
        return {
          out: 53n, // repay 50, 3 returned as excess (from padding + buffer)
          approvalTarget: dummyQuoteTarget,
          calldata: '0xabcd' as `0x${string}`,
        }
      }) as any,
      managerAddress: '0x2222222222222222222222222222222222222222' as Address,
      chainId: 1,
    })

    expect(plan.expectedDebt).toBe(50n)
    expect(plan.expectedDebtPayout).toBe(3n) // Captured from actual swap output!
    expect(plan.calls.length).toBeGreaterThan(0)
    const hasApprove = plan.calls.some((c) => c.data.startsWith('0x095ea7b3'))
    expect(hasApprove).toBe(true)
  })

  it('throws when quote returns zero output while sizing', async () => {
    const badQuote = (async (req: any) => {
      if (req.intent === 'exactOut') throw new Error('no exact-out support')
      return {
        out: 0n,
        approvalTarget: dummyQuoteTarget,
        calldata: '0xdead' as `0x${string}`,
      }
    }) as any

    await expect(
      planRedeemV2({
        config: {} as any,
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
    const trickyQuote = (async (req: any) => {
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
    }) as any

    await expect(
      planRedeemV2({
        config: {} as any,
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
    const smallOutQuote = (async (req: any) => {
      if (req.intent === 'exactOut') throw new Error('no exact-out support')
      return {
        out: 20n, // required = ceil(2500/20)=125 > upperBound 100
        approvalTarget: dummyQuoteTarget,
        calldata: '0xbeef' as `0x${string}`,
      }
    }) as any

    await expect(
      planRedeemV2({
        config: {} as any,
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
