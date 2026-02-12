import type { Address, Hex, PublicClient } from 'viem'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { planMint, solveFlashLoanAmountFromImpliedRates } from '@/domain/mint/planner/plan'
import type { LeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'

const publicClient = {
  multicall: vi.fn(),
  readContract: vi.fn(),
} as unknown as PublicClient

const leverageToken = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address
const collateral = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as Address
const debt = '0xcccccccccccccccccccccccccccccccccccccccc' as Address

const leverageTokenConfig: LeverageTokenConfig = {
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
  test: {
    mintIntegrationTest: {
      equityInCollateralAsset: 1n ** 18n,
    },
  },
}

const multicall = publicClient.multicall as Mock
const readContract = publicClient.readContract as Mock

describe('planMint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // router previewDeposit
    readContract.mockResolvedValueOnce({ collateral: 2_000n, debt: 1_000n, shares: 1_000n })
  })

  it('builds a plan with slippage and approvals', async () => {
    const quote = vi.fn()

    // Initial quote
    quote.mockImplementationOnce(async ({ slippageBps }: { slippageBps: number }) => ({
      out: 1_200n,
      minOut: 1_100n,
      approvalTarget: debt,
      calls: [{ target: debt, data: '0x01' as Hex, value: 0n }],
      slippageBps,
    }))

    // Initial manager preview
    readContract.mockImplementationOnce(async () => ({
      debt: 950n,
      shares: 1_200n,
    }))

    // Second quote
    quote.mockImplementationOnce(async ({ slippageBps }: { slippageBps: number }) => ({
      out: 1_200n,
      minOut: 1_100n,
      approvalTarget: debt,
      calls: [{ target: debt, data: '0x01' as Hex, value: 0n }],
      slippageBps,
    }))

    // manager previewDeposit (with out) + manager previewDeposit (with minOut)
    multicall.mockResolvedValueOnce([
      {
        debt: 1_300n,
        shares: 1_600n,
      },
      {
        debt: 1_100n,
        shares: 1_584n,
      },
    ])

    const plan = await planMint({
      publicClient,
      leverageTokenConfig,
      equityInCollateralAsset: 500n,
      shareSlippageBps: 100,
      swapSlippageBps: 10,
      flashLoanAdjustmentBps: 100,
      quoteDebtToCollateral: quote as any,
    })

    expect(plan.flashLoanAmount).toBe(839n)
    expect(plan.minShares).toBe(1584n)
    expect(plan.previewShares).toBe(1600n)
    expect(plan.previewExcessDebt).toBe(461n)
    expect(plan.minExcessDebt).toBe(261n)
    expect(plan.calls[0]?.target).toBe(debt) // approval first
    expect(plan.calls.length).toBeGreaterThanOrEqual(1)

    expect(quote).toHaveBeenCalledWith(
      expect.objectContaining({
        slippageBps: 10,
        amountIn: 1000n,
        intent: 'exactIn',
        inToken: debt,
        outToken: collateral,
      }),
    )

    expect(quote).toHaveBeenCalledWith(
      expect.objectContaining({
        slippageBps: 10,
        amountIn: 839n,
        intent: 'exactIn',
        inToken: debt,
        outToken: collateral,
      }),
    )
  })

  it('throws when manager previewed debt is below flash loan amount', async () => {
    const quote = vi.fn()

    // Initial quote
    quote.mockImplementationOnce(async ({ slippageBps }: { slippageBps: number }) => ({
      out: 1_200n,
      minOut: 1_100n,
      approvalTarget: debt,
      calls: [{ target: debt, data: '0x01' as Hex, value: 0n }],
      slippageBps,
    }))

    // Initial manager preview
    readContract.mockImplementationOnce(async () => ({
      debt: 950n,
      shares: 1_200n,
    }))

    // Second quote
    quote.mockImplementationOnce(async ({ slippageBps }: { slippageBps: number }) => ({
      out: 1_200n,
      minOut: 1_100n,
      approvalTarget: debt,
      calls: [{ target: debt, data: '0x01' as Hex, value: 0n }],
      slippageBps,
    }))

    // manager previewDeposit returns debt below flash loan amount
    multicall.mockResolvedValueOnce([
      {
        debt: 800n,
        shares: 1_600n,
      },
      {
        debt: 800n,
        shares: 1_600n,
      },
    ])

    await expect(
      planMint({
        publicClient,
        leverageTokenConfig,
        equityInCollateralAsset: 500n,
        shareSlippageBps: 100,
        swapSlippageBps: 10,
        flashLoanAdjustmentBps: 100,
        quoteDebtToCollateral: quote as any,
      }),
    ).rejects.toThrow(/Flash loan too large. Try increasing the flash loan adjustment parameter./i)
  })

  it('throws when manager minimum debt is below flash loan amount', async () => {
    const quote = vi.fn()

    // Initial quote
    quote.mockImplementationOnce(async ({ slippageBps }: { slippageBps: number }) => ({
      out: 1_200n,
      minOut: 1_100n,
      approvalTarget: debt,
      calls: [{ target: debt, data: '0x01' as Hex, value: 0n }],
      slippageBps,
    }))

    // Initial manager preview
    readContract.mockImplementationOnce(async () => ({
      debt: 950n,
      shares: 1_200n,
    }))

    // Second quote
    quote.mockImplementationOnce(async ({ slippageBps }: { slippageBps: number }) => ({
      out: 1_200n,
      minOut: 1_100n,
      approvalTarget: debt,
      calls: [{ target: debt, data: '0x01' as Hex, value: 0n }],
      slippageBps,
    }))

    multicall.mockResolvedValueOnce([
      {
        debt: 1000n,
        shares: 1_600n,
      },
      {
        debt: 800n,
        shares: 1_600n,
      },
    ])

    await expect(
      planMint({
        publicClient,
        leverageTokenConfig,
        equityInCollateralAsset: 500n,
        shareSlippageBps: 100,
        swapSlippageBps: 10,
        flashLoanAdjustmentBps: 100,
        quoteDebtToCollateral: quote as any,
      }),
    ).rejects.toThrow(
      /Flash loan too large. Try decreasing the swap slippage tolerance or increasing the flash loan adjustment./i,
    )
  })

  it('throws when minimum shares from manager are below slippage floor', async () => {
    const quote = vi.fn()

    // Initial quote
    quote.mockImplementationOnce(async ({ slippageBps }: { slippageBps: number }) => ({
      out: 1_200n,
      minOut: 1_100n,
      approvalTarget: debt,
      calls: [{ target: debt, data: '0x01' as Hex, value: 0n }],
      slippageBps,
    }))

    // Initial manager preview
    readContract.mockImplementationOnce(async () => ({
      debt: 950n,
      shares: 1_200n,
    }))

    // Second quote
    quote.mockImplementationOnce(async ({ slippageBps }: { slippageBps: number }) => ({
      out: 1_200n,
      minOut: 1_100n,
      approvalTarget: debt,
      calls: [{ target: debt, data: '0x01' as Hex, value: 0n }],
      slippageBps,
    }))

    // manager previewDeposit (minOut path) returns shares below minShares
    multicall.mockResolvedValueOnce([
      {
        debt: 1_300n,
        shares: 1_600n,
      },
      {
        debt: 1_000n,
        shares: 800n, // below minShares of 990n
      },
    ])

    await expect(
      planMint({
        publicClient,
        leverageTokenConfig,
        equityInCollateralAsset: 500n,
        shareSlippageBps: 100,
        swapSlippageBps: 10,
        flashLoanAdjustmentBps: 100,
        quoteDebtToCollateral: quote as any,
      }),
    ).rejects.toThrow(
      /Mint preview resulted in less Leverage Tokens than the allowed slippage tolerance. Try reducing the swap slippage tolerance, or increasing the Leverage Token slippage tolerance./i,
    )
  })

  it('builds a plan with zero flash loan adjustment', async () => {
    const quote = vi.fn()

    // Initial quote
    quote.mockImplementationOnce(async ({ slippageBps }: { slippageBps: number }) => ({
      out: 1_200n,
      minOut: 1_100n,
      approvalTarget: debt,
      calls: [{ target: debt, data: '0x01' as Hex, value: 0n }],
      slippageBps,
    }))

    // Initial manager preview
    readContract.mockImplementationOnce(async () => ({
      debt: 950n,
      shares: 1_200n,
    }))

    // Second quote
    quote.mockImplementationOnce(async ({ slippageBps }: { slippageBps: number }) => ({
      out: 1_200n,
      minOut: 1_100n,
      approvalTarget: debt,
      calls: [{ target: debt, data: '0x01' as Hex, value: 0n }],
      slippageBps,
    }))

    // manager previewDeposit (with out) + manager previewDeposit (with minOut)
    multicall.mockResolvedValueOnce([
      {
        debt: 1_300n,
        shares: 1_600n,
      },
      {
        debt: 1_100n,
        shares: 1_600n,
      },
    ])

    const plan = await planMint({
      publicClient,
      leverageTokenConfig,
      equityInCollateralAsset: 500n,
      shareSlippageBps: 100,
      swapSlippageBps: 10,
      flashLoanAdjustmentBps: 0,
      quoteDebtToCollateral: quote as any,
    })

    expect(plan.flashLoanAmount).toBe(848n)
    expect(plan.minShares).toBe(1584n)
    expect(plan.previewShares).toBe(1600n)
    expect(plan.previewExcessDebt).toBe(452n)
    expect(plan.minExcessDebt).toBe(252n)
    expect(plan.calls[0]?.target).toBe(debt) // approval first
    expect(plan.calls.length).toBeGreaterThanOrEqual(1)

    expect(quote).toHaveBeenCalledWith(
      expect.objectContaining({
        slippageBps: 10,
        amountIn: 1000n,
        intent: 'exactIn',
        inToken: debt,
        outToken: collateral,
      }),
    )

    expect(quote).toHaveBeenCalledWith(
      expect.objectContaining({
        slippageBps: 10,
        amountIn: 848n,
        intent: 'exactIn',
        inToken: debt,
        outToken: collateral,
      }),
    )
  })

  it('builds a plan with negative flash loan adjustment', async () => {
    const quote = vi.fn()

    // Initial quote
    quote.mockImplementationOnce(async ({ slippageBps }: { slippageBps: number }) => ({
      out: 1_200n,
      minOut: 1_100n,
      approvalTarget: debt,
      calls: [{ target: debt, data: '0x01' as Hex, value: 0n }],
      slippageBps,
    }))

    // Initial manager preview
    readContract.mockImplementationOnce(async () => ({
      debt: 950n,
      shares: 1_200n,
    }))

    // Second quote
    quote.mockImplementationOnce(async ({ slippageBps }: { slippageBps: number }) => ({
      out: 1_200n,
      minOut: 1_100n,
      approvalTarget: debt,
      calls: [{ target: debt, data: '0x01' as Hex, value: 0n }],
      slippageBps,
    }))

    // manager previewDeposit (with out) + manager previewDeposit (with minOut)
    multicall.mockResolvedValueOnce([
      {
        debt: 1_300n,
        shares: 1_600n,
      },
      {
        debt: 1_100n,
        shares: 1_600n,
      },
    ])

    const plan = await planMint({
      publicClient,
      leverageTokenConfig,
      equityInCollateralAsset: 500n,
      shareSlippageBps: 100,
      swapSlippageBps: 10,
      flashLoanAdjustmentBps: -100,
      quoteDebtToCollateral: quote as any,
    })

    expect(plan.flashLoanAmount).toBe(856n)
    expect(plan.minShares).toBe(1584n)
    expect(plan.previewShares).toBe(1_600n)
    expect(plan.previewExcessDebt).toBe(444n)
    expect(plan.minExcessDebt).toBe(244n)
    expect(plan.calls[0]?.target).toBe(debt) // approval first
    expect(plan.calls.length).toBeGreaterThanOrEqual(1)

    expect(quote).toHaveBeenCalledWith(
      expect.objectContaining({
        slippageBps: 10,
        amountIn: 1000n,
        intent: 'exactIn',
        inToken: debt,
        outToken: collateral,
      }),
    )

    expect(quote).toHaveBeenCalledWith(
      expect.objectContaining({
        slippageBps: 10,
        amountIn: 856n,
        intent: 'exactIn',
        inToken: debt,
        outToken: collateral,
      }),
    )
  })

  it('throws error when share slippage is negative', async () => {
    await expect(
      planMint({
        publicClient,
        leverageTokenConfig,
        equityInCollateralAsset: 500n,
        shareSlippageBps: -100,
        swapSlippageBps: 10,
        flashLoanAdjustmentBps: 100,
        quoteDebtToCollateral: vi.fn() as any,
      }),
    ).rejects.toThrow(/Leverage token slippage tolerance cannot be less than 0/i)
  })

  it('throws error when swap slippage is less than 0.01%', async () => {
    await expect(
      planMint({
        publicClient,
        leverageTokenConfig,
        equityInCollateralAsset: 500n,
        shareSlippageBps: 100,
        swapSlippageBps: 0,
        flashLoanAdjustmentBps: 100,
        quoteDebtToCollateral: vi.fn() as any,
      }),
    ).rejects.toThrow(/Swap slippage cannot be less than 0.01%/i)
  })
})

describe('solveFlashLoanAmountFromImpliedRates', () => {
  it('returns initial flash loan when quote-implied rate is less than manager-implied rate and sample is feasible', () => {
    const flashLoanAmount = solveFlashLoanAmountFromImpliedRates({
      equityInCollateralAsset: 500n,
      collateralToDebtRateFromQuote: 8_000n,
      collateralToDebtRateFromManager: 9_000n,
      exchangeRateScale: 10_000n,
      flashLoanAmountInitial: 1_000n,
      managerDebtAtInitialSample: 1_100n,
    })

    expect(flashLoanAmount).toBe(1_000n)
  })

  it('returns sampled manager debt when quote-implied rate is less than manager-implied rate and sample is not feasible', () => {
    const flashLoanAmount = solveFlashLoanAmountFromImpliedRates({
      equityInCollateralAsset: 500n,
      collateralToDebtRateFromQuote: 8_000n,
      collateralToDebtRateFromManager: 9_000n,
      exchangeRateScale: 10_000n,
      flashLoanAmountInitial: 1_000n,
      managerDebtAtInitialSample: 900n,
    })

    expect(flashLoanAmount).toBe(900n)
  })

  it('solves the inequality bound when quote-implied rate is greater than manager-implied rate', () => {
    const flashLoanAmount = solveFlashLoanAmountFromImpliedRates({
      equityInCollateralAsset: 500n,
      collateralToDebtRateFromQuote: 8_000n,
      collateralToDebtRateFromManager: 7_000n,
      exchangeRateScale: 10_000n,
      flashLoanAmountInitial: 1_000n,
      managerDebtAtInitialSample: 950n,
    })

    // Formula:
    // F_max = (mScaled * qScaled * E) / (scale * (qScaled - mScaled))
    //       = (7000 * 8000 * 500) / (10000 * (8000 - 7000))
    //       = 28,000,000,000 / 10,000,000
    //       = 2800
    expect(flashLoanAmount).toBe(2_800n)
  })

  it('falls back to initial flash loan when computed inequality bound rounds down to zero', () => {
    const flashLoanAmount = solveFlashLoanAmountFromImpliedRates({
      equityInCollateralAsset: 1n,
      collateralToDebtRateFromQuote: 3n,
      collateralToDebtRateFromManager: 2n,
      exchangeRateScale: 1_000n,
      flashLoanAmountInitial: 1_000n,
      managerDebtAtInitialSample: 900n,
    })

    // Formula:
    // F_max = (2 * 3 * 1) / (1000 * (3 - 2))
    //       = 6 / 1000
    //       = 0 (integer division)
    // Fallback should return flashLoanAmountInitial.
    expect(flashLoanAmount).toBe(1_000n)
  })
})
