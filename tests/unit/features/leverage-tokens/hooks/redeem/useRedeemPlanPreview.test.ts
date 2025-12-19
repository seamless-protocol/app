import { waitFor } from '@testing-library/react'
import type { Address, Hex } from 'viem'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import type { Config } from 'wagmi'
import { getQuoteIntentForAdapter } from '@/domain/redeem/orchestrate'
import { planRedeem } from '@/domain/redeem/planner/plan'
import type { QuoteFn } from '@/domain/redeem/planner/types'
import { useRedeemPlanPreview } from '@/features/leverage-tokens/hooks/redeem/useRedeemPlanPreview'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { hookTestUtils, makeAddr, mockSetup } from '../../../../../utils.tsx'

// Mock dependencies
vi.mock('@/domain/redeem/planner/plan', () => ({
  planRedeem: vi.fn(),
}))

vi.mock('@/domain/redeem/orchestrate', () => ({
  getQuoteIntentForAdapter: vi.fn(),
}))

vi.mock('@/features/leverage-tokens/leverageTokens.config', () => ({
  getLeverageTokenConfig: vi.fn(),
}))

vi.mock('@/features/leverage-tokens/hooks/useLeverageTokenManagerAssets', () => ({
  useLeverageTokenManagerAssets: vi.fn(() => ({
    collateralAsset: makeAddr('collateral'),
    debtAsset: makeAddr('debt'),
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
}))

const mockPlanRedeem = planRedeem as Mock
const mockGetQuoteIntentForAdapter = getQuoteIntentForAdapter as Mock
const mockGetLeverageTokenConfig = getLeverageTokenConfig as Mock

describe('useRedeemPlanPreview', () => {
  const MOCK_CONFIG = {} as Config
  const CHAIN_ID = 8453
  const TOKEN_ADDRESS: Address = makeAddr('token')
  const SHARES_TO_REDEEM = 1000000000000000000n // 1 token (18 decimals)

  const mockQuote: QuoteFn = vi.fn(async () => ({
    out: 1000000000000000000n,
    approvalTarget: makeAddr('approval'),
    calls: [{ target: makeAddr('approval'), data: '0xabcdef' as Hex, value: 0n }],
  }))

  const mockPlan = {
    token: TOKEN_ADDRESS,
    sharesToRedeem: SHARES_TO_REDEEM,
    collateralAsset: makeAddr('collateral'),
    debtAsset: makeAddr('debt'),
    slippageBps: 50,
    previewCollateral: 2000000000000000000n,
    previewDebt: 500000000000000000n,
    collateralSpent: 1000000000000000000n,
    previewCollateralForSender: 1000000000000000000n,
    minCollateralForSender: 900000000000000000n, // 0.9 tokens
    expectedCollateral: 1000000000000000000n, // 1 token
    expectedDebt: 500000000000000000n, // 0.5 tokens
    collateralToDebtQuote: {
      out: 500000000000000000n,
      approvalTarget: makeAddr('approval'),
      calls: [{ target: makeAddr('approval'), data: '0xabcdef' as Hex, value: 0n }],
    },
    expectedTotalCollateral: 2000000000000000000n, // 2 tokens
    expectedExcessCollateral: 1000000000000000000n, // 1 token
    expectedDebtPayout: 0n,
    payoutAsset: makeAddr('collateral'),
    payoutAmount: 1000000000000000000n, // 1 token
    calls: [
      {
        target: makeAddr('swap'),
        value: 0n,
        data: '0xabcdef1234567890' as `0x${string}`,
      },
    ],
  }

  beforeEach(() => {
    mockSetup.clearAllMocks()
    mockSetup.setupWagmiMocks(makeAddr('account'), CHAIN_ID)

    // Setup default mocks
    mockPlanRedeem.mockResolvedValue(mockPlan)
    mockGetQuoteIntentForAdapter.mockReturnValue('exactOut')
    mockGetLeverageTokenConfig.mockReturnValue({
      swaps: {
        collateralToDebt: {
          type: 'velora',
        },
      },
    })
    vi.mocked(mockQuote).mockResolvedValue({
      out: 1000000000000000000n,
      approvalTarget: makeAddr('approval'),
      calls: [{ target: makeAddr('approval'), data: '0xabcdef' as Hex, value: 0n }],
    })
  })

  describe('Hook Initialization and Query Conditions', () => {
    it('should initialize with loading state when enabled with valid inputs', () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemPlanPreview({
          config: MOCK_CONFIG,
          token: TOKEN_ADDRESS,
          sharesToRedeem: SHARES_TO_REDEEM,
          slippageBps: 50,
          chainId: CHAIN_ID,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          enabled: true,
          quote: mockQuote,
          collateralDecimals: 18,
        }),
      )

      expect(result.current.isLoading).toBe(true)
      expect(result.current.plan).toBeUndefined()
      expect(result.current.error).toBeNull()
    })

    it('should not query when sharesToRedeem is undefined or zero', async () => {
      const { result: resultUndefined } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemPlanPreview({
          config: MOCK_CONFIG,
          token: TOKEN_ADDRESS,
          sharesToRedeem: undefined,
          slippageBps: 50,
          chainId: CHAIN_ID,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          enabled: true,
          quote: mockQuote,
          collateralDecimals: 18,
        }),
      )

      // Wait a bit to ensure query doesn't run
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(resultUndefined.current.plan).toBeUndefined()
      expect(mockPlanRedeem).not.toHaveBeenCalled()

      const { result: resultZero } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemPlanPreview({
          config: MOCK_CONFIG,
          token: TOKEN_ADDRESS,
          sharesToRedeem: 0n,
          slippageBps: 50,
          chainId: CHAIN_ID,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          enabled: true,
          quote: mockQuote,
          collateralDecimals: 18,
        }),
      )

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(resultZero.current.plan).toBeUndefined()
      expect(mockPlanRedeem).not.toHaveBeenCalled()
    })

    it('should not query when quote is not provided', async () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemPlanPreview({
          config: MOCK_CONFIG,
          token: TOKEN_ADDRESS,
          sharesToRedeem: SHARES_TO_REDEEM,
          slippageBps: 50,
          chainId: CHAIN_ID,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          enabled: true,
          collateralDecimals: 18,
        }),
      )

      // Wait a bit to ensure query doesn't run
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(result.current.plan).toBeUndefined()
      expect(mockPlanRedeem).not.toHaveBeenCalled()
    })

    it('should not query when enabled is false', async () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemPlanPreview({
          config: MOCK_CONFIG,
          token: TOKEN_ADDRESS,
          sharesToRedeem: SHARES_TO_REDEEM,
          slippageBps: 50,
          chainId: CHAIN_ID,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          enabled: false,
          quote: mockQuote,
          collateralDecimals: 18,
        }),
      )

      // Wait a bit to ensure query doesn't run
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(result.current.plan).toBeUndefined()
      expect(mockPlanRedeem).not.toHaveBeenCalled()
    })
  })

  describe('Successful Execution', () => {
    it('should fetch and return plan successfully with correct parameters', async () => {
      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemPlanPreview({
          config: MOCK_CONFIG,
          token: TOKEN_ADDRESS,
          sharesToRedeem: SHARES_TO_REDEEM,
          slippageBps: 75,
          chainId: CHAIN_ID,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          enabled: true,
          quote: mockQuote,
          collateralDecimals: 18,
        }),
      )

      await waitFor(() => {
        expect(result.current.plan).toBeDefined()
      })

      expect(result.current.plan).toEqual(mockPlan)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(mockPlanRedeem).toHaveBeenCalledWith({
        config: MOCK_CONFIG,
        token: TOKEN_ADDRESS,
        sharesToRedeem: SHARES_TO_REDEEM,
        slippageBps: 75,
        quoteCollateralToDebt: mockQuote,
        chainId: CHAIN_ID,
        collateralAsset: makeAddr('collateral'),
        debtAsset: makeAddr('debt'),
        collateralAssetDecimals: 18,
        debtAssetDecimals: 18,
        intent: 'exactOut',
        blockNumber: 12345678n,
      })
    })

    it('should pass optional parameters when provided', async () => {
      const managerAddress = makeAddr('manager')

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemPlanPreview({
          config: MOCK_CONFIG,
          token: TOKEN_ADDRESS,
          sharesToRedeem: SHARES_TO_REDEEM,
          slippageBps: 50,
          chainId: CHAIN_ID,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          enabled: true,
          quote: mockQuote,
          managerAddress,
          collateralDecimals: 18,
        }),
      )

      await waitFor(() => {
        expect(result.current.plan).toBeDefined()
      })

      expect(mockPlanRedeem).toHaveBeenCalledWith(
        expect.objectContaining({
          wagmiConfig: MOCK_CONFIG,
          leverageTokenConfig: expect.any(Object),
          sharesToRedeem: SHARES_TO_REDEEM,
          slippageBps: 50,
          quoteCollateralToDebt: mockQuote,
          intent: 'exactOut',
        }),
      )
    })

    it('should use correct intent based on adapter type', async () => {
      mockGetLeverageTokenConfig.mockReturnValue({
        swaps: {
          collateralToDebt: {
            type: 'lifi',
          },
        },
      })
      mockGetQuoteIntentForAdapter.mockReturnValue('exactIn')

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemPlanPreview({
          config: MOCK_CONFIG,
          token: TOKEN_ADDRESS,
          sharesToRedeem: SHARES_TO_REDEEM,
          slippageBps: 50,
          chainId: CHAIN_ID,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          enabled: true,
          quote: mockQuote,
          collateralDecimals: 18,
        }),
      )

      await waitFor(() => {
        expect(result.current.plan).toBeDefined()
      })

      expect(mockGetQuoteIntentForAdapter).toHaveBeenCalledWith('lifi')
      expect(mockPlanRedeem).toHaveBeenCalledWith(
        expect.objectContaining({
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          collateralAssetDecimals: 18,
          debtAssetDecimals: 18,
          intent: 'exactIn',
        }),
      )
    })

    it('should default to velora adapter type when config is missing', async () => {
      mockGetLeverageTokenConfig.mockReturnValue(null)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemPlanPreview({
          config: MOCK_CONFIG,
          token: TOKEN_ADDRESS,
          sharesToRedeem: SHARES_TO_REDEEM,
          slippageBps: 50,
          chainId: CHAIN_ID,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          enabled: true,
          quote: mockQuote,
          collateralDecimals: 18,
        }),
      )

      await waitFor(() => {
        expect(result.current.plan).toBeDefined()
      })

      expect(mockGetQuoteIntentForAdapter).toHaveBeenCalledWith('velora')
    })
  })

  describe('USD Calculations', () => {
    it('should calculate expectedUsdOutScaled when all USD price data is provided', async () => {
      const planWithUsdData: typeof mockPlan = {
        ...mockPlan,
        expectedCollateral: 2000000000000000000n, // 2 tokens
      }
      mockPlanRedeem.mockResolvedValueOnce(planWithUsdData)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemPlanPreview({
          config: MOCK_CONFIG,
          token: TOKEN_ADDRESS,
          sharesToRedeem: SHARES_TO_REDEEM,
          slippageBps: 50,
          chainId: CHAIN_ID,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          enabled: true,
          quote: mockQuote,
          collateralUsdPrice: 2000, // $2000 per token
          collateralDecimals: 18,
        }),
      )

      await waitFor(() => {
        expect(result.current.plan).toBeDefined()
      })

      // Expected: 1 token collateral out at $2000 -> 2_000 * 1e6
      expect(result.current.expectedUsdOutScaled).toBeDefined()
      expect(result.current.expectedUsdOutStr).toBeDefined()
    })

    it('should calculate guaranteedUsdOutScaled using minCollateralForSender', async () => {
      const planWithWorstCase: typeof mockPlan = {
        ...mockPlan,
        minCollateralForSender: 1500000000000000000n, // 1.5 tokens
      }
      mockPlanRedeem.mockResolvedValueOnce(planWithWorstCase)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemPlanPreview({
          config: MOCK_CONFIG,
          token: TOKEN_ADDRESS,
          sharesToRedeem: SHARES_TO_REDEEM,
          slippageBps: 50,
          chainId: CHAIN_ID,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          enabled: true,
          quote: mockQuote,
          collateralUsdPrice: 2000,
          collateralDecimals: 18,
        }),
      )

      await waitFor(() => {
        expect(result.current.plan).toBeDefined()
      })

      // Guaranteed: (1.5 * 2000) + (0.5 * 1000) = 3000 + 500 = 3500
      expect(result.current.guaranteedUsdOutScaled).toBeDefined()
      expect(result.current.guaranteedUsdOutStr).toBeDefined()
    })

    it('should return undefined for USD calculations when prices or decimals are missing', async () => {
      const { result: resultNoPrices } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemPlanPreview({
          config: MOCK_CONFIG,
          token: TOKEN_ADDRESS,
          sharesToRedeem: SHARES_TO_REDEEM,
          slippageBps: 50,
          chainId: CHAIN_ID,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          enabled: true,
          quote: mockQuote,
          collateralDecimals: 18,
        }),
      )

      await waitFor(() => {
        expect(resultNoPrices.current.plan).toBeDefined()
      })

      expect(resultNoPrices.current.expectedUsdOutScaled).toBeUndefined()
      expect(resultNoPrices.current.guaranteedUsdOutScaled).toBeUndefined()
      expect(resultNoPrices.current.expectedUsdOutStr).toBeUndefined()
      expect(resultNoPrices.current.guaranteedUsdOutStr).toBeUndefined()

      const { result: resultNoDecimals } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemPlanPreview({
          config: MOCK_CONFIG,
          token: TOKEN_ADDRESS,
          sharesToRedeem: SHARES_TO_REDEEM,
          slippageBps: 50,
          chainId: CHAIN_ID,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          enabled: true,
          quote: mockQuote,
          collateralUsdPrice: 2000,
          collateralDecimals: undefined,
        }),
      )

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(resultNoDecimals.current.plan).toBeUndefined()
      expect(resultNoDecimals.current.expectedUsdOutScaled).toBeUndefined()
      expect(resultNoDecimals.current.guaranteedUsdOutScaled).toBeUndefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle planRedeem errors', async () => {
      const planError = new Error('Planning failed: insufficient collateral')
      mockPlanRedeem.mockRejectedValue(planError)

      const { result } = hookTestUtils.renderHookWithQuery(() =>
        useRedeemPlanPreview({
          config: MOCK_CONFIG,
          token: TOKEN_ADDRESS,
          sharesToRedeem: SHARES_TO_REDEEM,
          slippageBps: 50,
          chainId: CHAIN_ID,
          collateralAsset: makeAddr('collateral'),
          debtAsset: makeAddr('debt'),
          enabled: true,
          quote: mockQuote,
          collateralDecimals: 18,
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
