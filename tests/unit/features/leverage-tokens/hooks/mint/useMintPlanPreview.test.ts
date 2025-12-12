import { waitFor } from '@testing-library/react'
import type { Address } from 'viem'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import type { Config } from 'wagmi'
import { planMint } from '@/domain/mint/planner/plan'
import type { QuoteFn } from '@/domain/mint/planner/types'
import { useMintPlanPreview } from '@/features/leverage-tokens/hooks/mint/useMintPlanPreview'
import { hookTestUtils, makeAddr, mockSetup } from '../../../../../utils.tsx'

// Mock the planner
vi.mock('@/domain/mint/planner/plan', () => ({
  planMint: vi.fn(),
}))

// Mock the asset manager hook
vi.mock('@/features/leverage-tokens/hooks/useLeverageTokenManagerAssets', () => ({
  useLeverageTokenManagerAssets: vi.fn(() => ({
    collateralAsset: makeAddr('collateral'),
    debtAsset: makeAddr('debt'),
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}))

const mockPlanMint = planMint as Mock

describe('useMintPlanPreview', () => {
  const MOCK_CONFIG = {} as Config
  const CHAIN_ID = 8453
  const TOKEN_ADDRESS: Address = makeAddr('token')
  const INPUT_ASSET: Address = makeAddr('input')
  const EQUITY_AMOUNT = 1000000000000000000n // 1 token (18 decimals)

  const mockQuote: QuoteFn = vi.fn(async () => ({
    out: 1000000000000000000n,
    approvalTarget: makeAddr('approval'),
    calldata: '0xabcdef' as `0x${string}`,
  }))

  const mockPlan = {
    inputAsset: INPUT_ASSET,
    equityInInputAsset: EQUITY_AMOUNT,
    collateralAsset: makeAddr('collateral'),
    debtAsset: makeAddr('debt'),
    minShares: 900000000000000000n,
    expectedShares: 1000000000000000000n,
    expectedDebt: 800000000000000000n,
    expectedTotalCollateral: 1800000000000000000n,
    expectedExcessDebt: 0n,
    worstCaseRequiredDebt: 850000000000000000n,
    worstCaseShares: 950000000000000000n,
    swapExpectedOut: 1000000000000000000n,
    swapMinOut: 900000000000000000n,
    calls: [],
    flashLoanAmount: 800000000000000000n,
  }

  beforeEach(() => {
    mockSetup.clearAllMocks()
    mockSetup.setupWagmiMocks(makeAddr('account'), CHAIN_ID)

    // Setup default planMint mock
    mockPlanMint.mockResolvedValue(mockPlan)
    vi.mocked(mockQuote).mockResolvedValue({
      out: 1000000000000000000n,
      approvalTarget: makeAddr('approval'),
      calldata: '0xabcdef' as `0x${string}`,
    })
  })

  describe('Hook Initialization and Query Conditions', () => {
    it('should initialize with loading state when enabled with valid inputs', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintPlanPreview({
          config: MOCK_CONFIG,
          token: TOKEN_ADDRESS,
          inputAsset: INPUT_ASSET,
          equityInCollateralAsset: EQUITY_AMOUNT,
          slippageBps: 50,
          chainId: CHAIN_ID,
          enabled: true,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          quote: mockQuote,
          debounceMs: 0,
          collateralDecimals: 18,
          debtDecimals: 18,
        }),
      )

      expect(result.current.isLoading).toBe(true)
      expect(result.current.plan).toBeUndefined()
      expect(result.current.error).toBeNull()
    })

    it('should not query when equityInCollateralAsset is undefined or zero', () => {
      const { result: resultUndefined } = hookTestUtils.renderHookWithQuery(() =>
        useMintPlanPreview({
          config: MOCK_CONFIG,
          token: TOKEN_ADDRESS,
          inputAsset: INPUT_ASSET,
          equityInCollateralAsset: undefined,
          slippageBps: 50,
          chainId: CHAIN_ID,
          enabled: true,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          quote: mockQuote,
          debounceMs: 0,
          collateralDecimals: 18,
          debtDecimals: 18,
        }),
      )

      expect(resultUndefined.current.isLoading).toBe(false)
      expect(resultUndefined.current.plan).toBeUndefined()
      expect(mockPlanMint).not.toHaveBeenCalled()

      const { result: resultZero } = hookTestUtils.renderHookWithQuery(() =>
        useMintPlanPreview({
          config: MOCK_CONFIG,
          token: TOKEN_ADDRESS,
          inputAsset: INPUT_ASSET,
          equityInCollateralAsset: 0n,
          slippageBps: 50,
          chainId: CHAIN_ID,
          enabled: true,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          quote: mockQuote,
          debounceMs: 0,
          collateralDecimals: 18,
          debtDecimals: 18,
        }),
      )

      expect(resultZero.current.isLoading).toBe(false)
      expect(resultZero.current.plan).toBeUndefined()
      expect(mockPlanMint).not.toHaveBeenCalled()
    })

    it('should not query when quote is not provided', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintPlanPreview({
          config: MOCK_CONFIG,
          token: TOKEN_ADDRESS,
          inputAsset: INPUT_ASSET,
          equityInCollateralAsset: EQUITY_AMOUNT,
          slippageBps: 50,
          chainId: CHAIN_ID,
          enabled: true,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          debounceMs: 0,
          collateralDecimals: 18,
          debtDecimals: 18,
        }),
      )

      expect(result.current.isLoading).toBe(false)
      expect(result.current.plan).toBeUndefined()
      expect(mockPlanMint).not.toHaveBeenCalled()
    })
  })

  describe('Successful Execution', () => {
    it('should fetch and return plan successfully with correct parameters', async () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintPlanPreview({
          config: MOCK_CONFIG,
          token: TOKEN_ADDRESS,
          inputAsset: INPUT_ASSET,
          equityInCollateralAsset: EQUITY_AMOUNT,
          slippageBps: 75,
          chainId: CHAIN_ID,
          enabled: true,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          quote: mockQuote,
          debounceMs: 0,
          collateralDecimals: 18,
          debtDecimals: 18,
        }),
      )

      await waitFor(() => {
        expect(result.current.plan).toBeDefined()
      })

      expect(result.current.plan).toEqual(mockPlan)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(mockPlanMint).toHaveBeenCalledWith({
        config: MOCK_CONFIG,
        token: TOKEN_ADDRESS,
        inputAsset: INPUT_ASSET,
        equityInInputAsset: EQUITY_AMOUNT,
        slippageBps: 75,
        quoteDebtToCollateral: mockQuote,
        chainId: CHAIN_ID,
        collateralAsset: makeAddr('collateral'),
        debtAsset: makeAddr('debt'),
        collateralAssetDecimals: 18,
        debtAssetDecimals: 18,
        blockNumber: 12345678n,
      })
    })
  })

  describe('Debouncing', () => {
    it('should debounce equity input changes', async () => {
      type Props = { equity: bigint | undefined }
      const { rerender } = hookTestUtils.renderHookWithQuery<
        Props,
        ReturnType<typeof useMintPlanPreview>
      >(
        ({ equity }) =>
          useMintPlanPreview({
            config: MOCK_CONFIG,
            token: TOKEN_ADDRESS,
            inputAsset: INPUT_ASSET,
            equityInCollateralAsset: equity,
            slippageBps: 50,
            chainId: CHAIN_ID,
            enabled: true,
            collateralAsset: makeAddr('collateral'),
            debtAsset: makeAddr('debt'),
            quote: mockQuote,
            debounceMs: 100,
            collateralDecimals: 18,
            debtDecimals: 18,
          }),
        {
          initialProps: { equity: undefined },
        },
      )

      // Rapid changes
      rerender({ equity: 1000000000000000000n })
      rerender({ equity: 2000000000000000000n })
      rerender({ equity: 3000000000000000000n })

      // Should not have called planMint yet due to debouncing
      expect(mockPlanMint).not.toHaveBeenCalled()

      // Wait for debounce to complete
      await waitFor(
        () => {
          expect(mockPlanMint).toHaveBeenCalledTimes(1)
        },
        { timeout: 200 },
      )

      // Should have called with the last value
      expect(mockPlanMint).toHaveBeenCalledWith(
        expect.objectContaining({
          equityInInputAsset: 3000000000000000000n,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          collateralAssetDecimals: 18,
          debtAssetDecimals: 18,
        }),
      )
    })
  })

  describe('USD Calculations', () => {
    it('should calculate expectedUsdOut when all USD price data is provided', async () => {
      const planWithUsdData: typeof mockPlan = {
        ...mockPlan,
        expectedTotalCollateral: 2000000000000000000n, // 2 tokens
        expectedDebt: 1000000000000000000n, // 1 token
      }
      mockPlanMint.mockResolvedValueOnce(planWithUsdData)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintPlanPreview({
          config: MOCK_CONFIG,
          token: TOKEN_ADDRESS,
          inputAsset: INPUT_ASSET,
          equityInCollateralAsset: EQUITY_AMOUNT,
          slippageBps: 50,
          chainId: CHAIN_ID,
          enabled: true,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          quote: mockQuote,
          debounceMs: 0,
          collateralUsdPrice: 2000, // $2000 per token
          debtUsdPrice: 1000, // $1000 per token
          collateralDecimals: 18,
          debtDecimals: 18,
        }),
      )

      await waitFor(() => {
        expect(result.current.plan).toBeDefined()
      })

      // Expected: (2 * 2000) - (1 * 1000) = 4000 - 1000 = 3000
      // Scaled to 8 decimals: 3000 * 10^8 = 300000000000n
      expect(result.current.expectedUsdOutScaled).toBe(300000000000n)
    })

    it('should calculate guaranteedUsdOut using worst-case values', async () => {
      const planWithWorstCase: typeof mockPlan = {
        ...mockPlan,
        equityInInputAsset: 1000000000000000000n, // 1 token
        swapMinOut: 900000000000000000n, // 0.9 tokens
        worstCaseRequiredDebt: 1500000000000000000n, // 1.5 tokens
      }
      mockPlanMint.mockResolvedValueOnce(planWithWorstCase)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintPlanPreview({
          config: MOCK_CONFIG,
          token: TOKEN_ADDRESS,
          inputAsset: INPUT_ASSET,
          equityInCollateralAsset: EQUITY_AMOUNT,
          slippageBps: 50,
          chainId: CHAIN_ID,
          enabled: true,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          quote: mockQuote,
          debounceMs: 0,
          collateralUsdPrice: 2000,
          debtUsdPrice: 1000,
          collateralDecimals: 18,
          debtDecimals: 18,
        }),
      )

      await waitFor(() => {
        expect(result.current.plan).toBeDefined()
      })

      // Worst case: (1 + 0.9) * 2000 - (1.5 * 1000) = 3800 - 1500 = 2300
      // Scaled to 8 decimals: 2300 * 10^8 = 230000000000n
      expect(result.current.guaranteedUsdOutScaled).toBe(230000000000n)
    })

    it('should return undefined for USD calculations when prices or decimals are missing', async () => {
      const { result: resultNoPrices } = hookTestUtils.renderHookWithQuery(() =>
        useMintPlanPreview({
          config: MOCK_CONFIG,
          token: TOKEN_ADDRESS,
          inputAsset: INPUT_ASSET,
          equityInCollateralAsset: EQUITY_AMOUNT,
          slippageBps: 50,
          chainId: CHAIN_ID,
          enabled: true,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          quote: mockQuote,
          debounceMs: 0,
          collateralDecimals: 18,
          debtDecimals: 18,
        }),
      )

      await waitFor(() => {
        expect(resultNoPrices.current.plan).toBeDefined()
      })

      expect(resultNoPrices.current.expectedUsdOutScaled).toBeUndefined()
      expect(resultNoPrices.current.guaranteedUsdOutScaled).toBeUndefined()

      const { result: resultNoDecimals } = hookTestUtils.renderHookWithQuery(() =>
        useMintPlanPreview({
          config: MOCK_CONFIG,
          token: TOKEN_ADDRESS,
          inputAsset: INPUT_ASSET,
          equityInCollateralAsset: EQUITY_AMOUNT,
          slippageBps: 50,
          chainId: CHAIN_ID,
          enabled: true,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          quote: mockQuote,
          debounceMs: 0,
          collateralUsdPrice: 2000,
          debtUsdPrice: 1000,
          collateralDecimals: undefined,
          debtDecimals: undefined,
        }),
      )

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(resultNoDecimals.current.isLoading).toBe(false)
      expect(resultNoDecimals.current.plan).toBeUndefined()
      expect(resultNoDecimals.current.expectedUsdOutScaled).toBeUndefined()
      expect(resultNoDecimals.current.guaranteedUsdOutScaled).toBeUndefined()
    })

    it('should clamp USD calculations to zero when negative', async () => {
      const planWithNegativeEquity: typeof mockPlan = {
        ...mockPlan,
        expectedTotalCollateral: 1000000000000000000n, // 1 token
        expectedDebt: 2000000000000000000n, // 2 tokens
      }
      mockPlanMint.mockResolvedValueOnce(planWithNegativeEquity)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintPlanPreview({
          config: MOCK_CONFIG,
          token: TOKEN_ADDRESS,
          inputAsset: INPUT_ASSET,
          equityInCollateralAsset: EQUITY_AMOUNT,
          slippageBps: 50,
          chainId: CHAIN_ID,
          enabled: true,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          quote: mockQuote,
          debounceMs: 0,
          collateralUsdPrice: 1000,
          debtUsdPrice: 2000,
          collateralDecimals: 18,
          debtDecimals: 18,
        }),
      )

      await waitFor(() => {
        expect(result.current.plan).toBeDefined()
      })

      // Would be negative: (1 * 1000) - (2 * 2000) = 1000 - 4000 = -3000
      // Should be clamped to 0 (usdDiffFloor returns 0 for negative)
      expect(result.current.expectedUsdOutScaled).toBe(0n)
    })
  })

  describe('Error Handling', () => {
    it('should handle contract errors (including RPC failures and quote errors)', async () => {
      const planError = new Error('Planning failed: insufficient liquidity')
      mockPlanMint.mockRejectedValue(planError)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useMintPlanPreview({
          config: MOCK_CONFIG,
          token: TOKEN_ADDRESS,
          inputAsset: INPUT_ASSET,
          equityInCollateralAsset: EQUITY_AMOUNT,
          slippageBps: 50,
          chainId: CHAIN_ID,
          enabled: true,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          quote: mockQuote,
          debounceMs: 0,
          collateralDecimals: 18,
          debtDecimals: 18,
        }),
      )

      await waitFor(
        () => {
          expect(result.current.error).toBeDefined()
          expect(result.current.error).not.toBeNull()
        },
        { timeout: 3000 },
      )

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toContain('Planning failed')
      expect(result.current.plan).toBeUndefined()
      expect(result.current.isLoading).toBe(false)
    })
  })
})
