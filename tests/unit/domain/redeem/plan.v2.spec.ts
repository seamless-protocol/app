import type { Address } from 'viem'
import { decodeFunctionData, erc20Abi } from 'viem'
import { describe, expect, it, vi } from 'vitest'

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
    })

    expect(plan.expectedTotalCollateral).toBe(100n)

    const spentCollateral = plan.expectedTotalCollateral - plan.expectedCollateral
    expect(spentCollateral).toBe(53n)

    expect(plan.payoutAsset.toLowerCase()).toBe('0xcccccccccccccccccccccccccccccccccccccccc')
    expect(plan.payoutAmount).toBe(plan.expectedCollateral)
    expect(plan.expectedDebtPayout).toBe(0n)

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
    })

    expect(plan.payoutAsset.toLowerCase()).toBe('0xdddddddddddddddddddddddddddddddddddddddd')
    expect(plan.expectedCollateral).toBe(0n)
    expect(plan.payoutAmount).toBe(plan.expectedDebtPayout)
    expect(plan.payoutAmount > 0n).toBe(true)
    expect(plan.expectedExcessCollateral - plan.payoutAmount).toBe(1n)
    expect(plan.calls.length).toBeGreaterThan(2)
  })
})
