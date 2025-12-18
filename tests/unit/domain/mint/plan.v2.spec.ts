import type { Address } from 'viem'
import { describe, expect, it, vi } from 'vitest'
import type { Config } from 'wagmi'
import { planMint, validateMintPlan } from '@/domain/mint/planner/plan'

const wagmiConfig = {} as Config
const leverageToken = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address
const collateral = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as Address
const debt = '0xcccccccccccccccccccccccccccccccccccccccc' as Address

vi.mock('@/lib/contracts/generated', () => ({
  readLeverageRouterV2PreviewDeposit: vi.fn(async () => ({
    collateral: 2000n,
    debt: 1000n,
    shares: 1500n,
    tokenFee: 0n,
    treasuryFee: 0n,
  })),
  readLeverageManagerV2PreviewDeposit: vi.fn(async () => ({
    collateral: 2500n,
    debt: 1000n,
    shares: 1800n,
    tokenFee: 0n,
    treasuryFee: 0n,
  })),
}))

const leverageTokenConfig = {
  address: leverageToken,
  name: 'Test Leverage Token',
  symbol: 'tLT',
  description: 'Test leverage token config',
  chainId: 8453,
  chainName: 'Base',
  chainLogo: () => null,
  leverageRatio: 2,
  decimals: 18,
  collateralAsset: {
    address: collateral,
    symbol: 'COLL',
    name: 'Collateral',
    description: 'Collateral asset',
    decimals: 18,
  },
  debtAsset: {
    address: debt,
    symbol: 'DEBT',
    name: 'Debt',
    decimals: 6,
  },
  swaps: {},
} as const

describe('planMint', () => {
  it('builds a plan with slippage-aware min shares', async () => {
    const quote = vi.fn(async () => ({
      out: 1000n,
      minOut: 980n,
      approvalTarget: debt,
      calls: [],
    }))

    const plan = await planMint({
      wagmiConfig,
      leverageTokenConfig,
      equityInCollateralAsset: 500n,
      slippageBps: 50,
      quoteDebtToCollateral: quote,
      blockNumber: 1n,
    })

    expect(plan.flashLoanAmount).toBe(1000n)
    expect(plan.previewShares).toBe(1800n)
    expect(plan.minShares).toBeGreaterThan(0n)
    expect(plan.equityInCollateralAsset).toBe(500n)
    expect(Array.isArray(plan.calls)).toBe(true)
  })
})

describe('validateMintPlan', () => {
  it('accepts a valid plan', () => {
    const isValid = validateMintPlan({
      minShares: 1n,
      previewShares: 2n,
      expectedExcessDebt: 0n,
      flashLoanAmount: 0n,
      equityInCollateralAsset: 1n,
      calls: [{ target: collateral, data: '0x', value: 0n }],
    })
    expect(isValid).toBe(true)
  })

  it('rejects plans with non-positive minShares', () => {
    const isValid = validateMintPlan({
      minShares: 0n,
      previewShares: 2n,
      expectedExcessDebt: 0n,
      flashLoanAmount: 0n,
      equityInCollateralAsset: 1n,
      calls: [],
    })
    expect(isValid).toBe(false)
  })
})
