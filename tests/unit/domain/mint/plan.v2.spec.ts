import type { Address, Hex } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MintPlan } from '@/domain/mint/planner/plan'
import { planMint, validateMintPlan } from '@/domain/mint/planner/plan'

vi.mock('@/lib/contracts/generated', async () => {
  return {
    readLeverageManagerV2GetLeverageTokenCollateralAsset: vi.fn(
      async () => '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address,
    ),
    readLeverageManagerV2GetLeverageTokenDebtAsset: vi.fn(
      async () => '0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD' as Address,
    ),
    readLeverageManagerV2PreviewDeposit: vi.fn(async (_config: any, { args }: any) => {
      const totalCollateral = args[1] as bigint
      return {
        collateral: totalCollateral,
        debt: 1_000n,
        shares: totalCollateral,
        tokenFee: 0n,
        treasuryFee: 0n,
      }
    }),
    readLeverageRouterV2PreviewDeposit: vi.fn(async (_config: any, { args }: any) => {
      const equity = args[1] as bigint
      // For a given equity, router preview reports +10% collateral need and initial debt of 5_000
      // Shares equal equity for simplicity
      return {
        collateral: (equity * 11n) / 10n,
        debt: 5_000n,
        shares: equity,
        tokenFee: 0n,
        treasuryFee: 0n,
      }
    }),
  }
})

vi.mock('@/lib/prices/coingecko', () => ({
  fetchCoingeckoTokenUsdPrices: vi.fn(async () => ({
    '0xcccccccccccccccccccccccccccccccccccccccc': 2000, // collateral (ETH)
    '0xdddddddddddddddddddddddddddddddddddddddd': 1, // debt (USDC)
  })),
}))

describe('planMint', () => {
  const cfg = {} as any
  const token = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as Address

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('input == collateral: no input conversion calls, sizes debt swap, and computes minShares', async () => {
    const inputAsset = '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address // equals mocked collateral
    const equityInInputAsset = 1_000n

    // Quote returns slightly more than neededFromDebtSwap, so no re-quote path
    const quoteDebtToCollateral = vi.fn(async () => {
      // neededFromDebtSwap = collateral - equity = 1100 - 1000 = 100
      // Return more than needed: 150
      return {
        out: 150n,
        approvalTarget: '0x9999999999999999999999999999999999999999' as Address,
        calls: [
          {
            target: '0x9999999999999999999999999999999999999999' as Address,
            data: '0xdeadbeef' as Hex,
            value: 0n,
          },
        ],
      }
    })

    const plan = await planMint({
      config: cfg,
      token,
      inputAsset,
      equityInInputAsset,
      slippageBps: 50,
      quoteDebtToCollateral,
      chainId: 8453,
      collateralAsset: '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address,
      debtAsset: '0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD' as Address,
      collateralAssetDecimals: 18,
      debtAssetDecimals: 18,
    })

    expect(plan.inputAsset).toBe(inputAsset)
    expect(plan.equityInInputAsset).toBe(equityInInputAsset)
    expect(plan.collateralAsset).toBe('0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC')
    expect(plan.debtAsset).toBe('0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD')
    // expectedTotalCollateral = user(1000) + quote.out(150)
    expect(plan.expectedTotalCollateral).toBe(1_150n)
    // minShares is slippage-adjusted 0.5% below expected shares (shares == total collateral via mock)
    expect(plan.minShares).toBeGreaterThan(0n)
    // Calls: approve debt asset then perform aggregator swap
    const calls = plan.calls ?? []
    expect(calls.length).toBe(2)
    expect(calls[0]?.target).toBe(plan.debtAsset)
    expect(calls[0]?.value).toBe(0n)
    expect(calls[1]?.target).toBe('0x9999999999999999999999999999999999999999')
    expect(calls[1]?.value).toBe(0n)
  })
})

describe('validateMintPlan', () => {
  const validPlan: MintPlan = {
    inputAsset: '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address,
    equityInInputAsset: 1000000000000000000n, // 1 token
    collateralAsset: '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' as Address,
    debtAsset: '0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD' as Address,
    flashLoanAmount: 500000000000000000n, // 0.5 tokens
    minShares: 950000000000000000n, // 0.95 tokens
    expectedShares: 1000000000000000000n, // 1 token
    expectedDebt: 1000000000000000000n, // 1 token
    expectedTotalCollateral: 1500000000000000000n, // 1.5 tokens
    expectedExcessDebt: 500000000000000000n, // 0.5 tokens
    worstCaseRequiredDebt: 0n,
    worstCaseShares: 0n,
    swapExpectedOut: 500000000000000000n, // 0.5 tokens
    swapMinOut: 490000000000000000n, // 0.49 tokens
    calls: [],
  }

  it('should return true for valid plan', () => {
    expect(validateMintPlan(validPlan)).toBe(true)
  })

  it('should return false if equityInInputAsset is zero', () => {
    const invalidPlan = { ...validPlan, equityInInputAsset: 0n }
    expect(validateMintPlan(invalidPlan)).toBe(false)
  })

  it('should return false if expectedShares is zero', () => {
    const invalidPlan = { ...validPlan, expectedShares: 0n }
    expect(validateMintPlan(invalidPlan)).toBe(false)
  })

  it('should return false if expectedShares is negative', () => {
    const invalidPlan = { ...validPlan, expectedShares: -1n }
    expect(validateMintPlan(invalidPlan)).toBe(false)
  })

  it('should return false if minShares is negative', () => {
    const invalidPlan = { ...validPlan, minShares: -1n }
    expect(validateMintPlan(invalidPlan)).toBe(false)
  })

  it('should return false if expectedTotalCollateral is negative', () => {
    const invalidPlan = { ...validPlan, expectedTotalCollateral: -1n }
    expect(validateMintPlan(invalidPlan)).toBe(false)
  })

  it('should return false if expectedDebt is negative', () => {
    const invalidPlan = { ...validPlan, expectedDebt: -1n }
    expect(validateMintPlan(invalidPlan)).toBe(false)
  })

  it('should return false if expectedExcessDebt is negative', () => {
    const invalidPlan = { ...validPlan, expectedExcessDebt: -1n }
    expect(validateMintPlan(invalidPlan)).toBe(false)
  })

  it('should return false if swapExpectedOut is negative', () => {
    const invalidPlan = { ...validPlan, swapExpectedOut: -1n }
    expect(validateMintPlan(invalidPlan)).toBe(false)
  })

  it('should return false if swapMinOut is negative', () => {
    const invalidPlan = { ...validPlan, swapMinOut: -1n }
    expect(validateMintPlan(invalidPlan)).toBe(false)
  })
})
