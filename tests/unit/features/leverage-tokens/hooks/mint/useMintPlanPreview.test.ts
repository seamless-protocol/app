import { waitFor } from '@testing-library/react'
import type { Address } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Config } from 'wagmi'
import { useMintPlanPreview } from '@/features/leverage-tokens/hooks/mint/useMintPlanPreview'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { hookTestUtils, makeAddr, mockSetup } from '../../../../../utils.tsx'

const planMint = vi.fn()
vi.mock('@/domain/mint/planner/plan', () => ({
  planMint: (...args: Array<unknown>) => planMint(...args),
}))

vi.mock('@/features/leverage-tokens/leverageTokens.config', () => ({
  getLeverageTokenConfig: vi.fn(),
}))

const MOCK_CONFIG = {} as Config
const TOKEN: Address = makeAddr('token')
const CHAIN_ID = 8453
const mockGetLeverageTokenConfig = getLeverageTokenConfig as unknown as ReturnType<typeof vi.fn>

describe('useMintPlanPreview', () => {
  beforeEach(() => {
    mockSetup.clearAllMocks()
    mockSetup.setupWagmiMocks(makeAddr('account'), CHAIN_ID)
    planMint.mockReset()
    planMint.mockResolvedValue({
      minShares: 1n,
      previewShares: 2n,
      previewExcessDebt: 0n,
      minExcessDebt: 0n,
      flashLoanAmount: 10n,
      equityInCollateralAsset: 5n,
      calls: [],
    })
    mockGetLeverageTokenConfig.mockReturnValue({
      address: TOKEN,
      chainId: CHAIN_ID,
      decimals: 18,
      collateralAsset: { address: makeAddr('collateral'), decimals: 18 },
      debtAsset: { address: makeAddr('debt'), decimals: 6 },
    })
  })

  it('fetches a plan when enabled with valid inputs', async () => {
    const quote = vi.fn()
    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useMintPlanPreview({
        config: MOCK_CONFIG,
        token: TOKEN,
        equityInCollateralAsset: 5n,
        slippageBps: 50,
        chainId: CHAIN_ID,
        enabled: true,
        quote,
        debounceMs: 0,
      }),
    )

    await waitFor(() => expect(result.current.plan).toBeDefined())
    expect(planMint).toHaveBeenCalled()
    expect(result.current.plan?.previewShares).toBe(2n)
  })

  it('does not fetch when equity is missing', async () => {
    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useMintPlanPreview({
        config: MOCK_CONFIG,
        token: TOKEN,
        equityInCollateralAsset: undefined,
        slippageBps: 50,
        chainId: CHAIN_ID,
        enabled: true,
        quote: vi.fn(),
      }),
    )

    await waitFor(() => expect(result.current.plan).toBeUndefined())
    expect(planMint).not.toHaveBeenCalled()
  })
})
