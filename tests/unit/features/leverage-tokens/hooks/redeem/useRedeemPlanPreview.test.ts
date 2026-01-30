import { waitFor } from '@testing-library/react'
import type { Address } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { planRedeem } from '@/domain/redeem/planner/plan'
import { useRedeemPlanPreview } from '@/features/leverage-tokens/hooks/redeem/useRedeemPlanPreview'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { hookTestUtils, makeAddr, mockSetup } from '../../../../../utils.tsx'

vi.mock('@/domain/redeem/planner/plan', () => ({
  planRedeem: vi.fn(),
}))

vi.mock('@/features/leverage-tokens/leverageTokens.config', () => ({
  getLeverageTokenConfig: vi.fn(),
}))

const mockPlanRedeem = planRedeem as unknown as ReturnType<typeof vi.fn>
const mockGetLeverageTokenConfig = getLeverageTokenConfig as unknown as ReturnType<typeof vi.fn>

describe('useRedeemPlanPreview', () => {
  const CHAIN_ID = 8453
  const TOKEN_ADDRESS: Address = makeAddr('token')
  const SHARES_TO_REDEEM = 1_000n

  const mockPlan = {
    minCollateralForSender: 900n,
    minExcessDebt: 10n,
    previewCollateralForSender: 950n,
    previewExcessDebt: 25n,
    sharesToRedeem: SHARES_TO_REDEEM,
    calls: [{ target: makeAddr('swap'), data: '0x01', value: 0n }],
  }

  beforeEach(() => {
    mockSetup.clearAllMocks()
    mockSetup.setupWagmiMocks(makeAddr('account'), CHAIN_ID)
    mockPlanRedeem.mockReset()
    mockPlanRedeem.mockResolvedValue(mockPlan)
    mockGetLeverageTokenConfig.mockReturnValue({
      address: TOKEN_ADDRESS,
      chainId: CHAIN_ID,
      decimals: 18,
      collateralAsset: { address: makeAddr('collateral'), decimals: 18 },
      debtAsset: { address: makeAddr('debt'), decimals: 6 },
    })
  })

  it('fetches a plan when enabled with valid inputs', async () => {
    const quote = vi.fn()
    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useRedeemPlanPreview({
        token: TOKEN_ADDRESS,
        sharesToRedeem: SHARES_TO_REDEEM,
        slippageBps: 50,
        chainId: CHAIN_ID,
        enabled: true,
        quote,
        debounceMs: 0,
      }),
    )

    await waitFor(() => expect(result.current.plan).toEqual(mockPlan))
    expect(mockPlanRedeem).toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('does not fetch when shares are missing', async () => {
    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useRedeemPlanPreview({
        token: TOKEN_ADDRESS,
        sharesToRedeem: undefined,
        slippageBps: 50,
        chainId: CHAIN_ID,
        enabled: true,
        quote: vi.fn(),
        debounceMs: 0,
      }),
    )

    await waitFor(() => expect(result.current.plan).toBeUndefined())
    expect(mockPlanRedeem).not.toHaveBeenCalled()
  })

  it('surfaces errors from planRedeem', async () => {
    const error = new Error('redeem failed')
    mockPlanRedeem.mockReset()
    mockPlanRedeem.mockImplementation(async () => {
      throw error
    })

    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useRedeemPlanPreview({
        token: TOKEN_ADDRESS,
        sharesToRedeem: SHARES_TO_REDEEM,
        slippageBps: 50,
        chainId: CHAIN_ID,
        enabled: true,
        quote: vi.fn(),
        debounceMs: 0,
      }),
    )

    await waitFor(() => expect(mockPlanRedeem).toHaveBeenCalled())
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 10000 })
    expect(result.current.plan).toBeUndefined()
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message ?? '').toContain('redeem failed')
  })
})
