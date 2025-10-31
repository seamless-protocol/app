import { waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAccount, useChainId, useReadContracts } from 'wagmi'
import { useReadLeverageManagerV2GetLeverageTokenLendingAdapter } from '@/lib/contracts/generated'
import * as useStateMod from '@/features/leverage-tokens/hooks/useLeverageTokenState'
import { useLeverageTokenUserPosition } from '@/features/leverage-tokens/hooks/useLeverageTokenUserPosition'
import * as useTokenBalanceMod from '@/lib/hooks/useTokenBalance'
import * as pricesMod from '@/lib/prices/useUsdPrices'
import { hookTestUtils, makeAddr } from '../../../../utils'

vi.mock('@/features/leverage-tokens/hooks/useLeverageTokenState')
vi.mock('@/lib/hooks/useTokenBalance')
vi.mock('@/lib/prices/useUsdPrices')
vi.mock('@/lib/contracts/generated')
vi.mock('wagmi')

describe('useLeverageTokenUserPosition', () => {
  const token = makeAddr('token')
  const owner = makeAddr('owner')
  const collateralAsset = makeAddr('collateral')
  const collateralDecimals = 18
  const debtAsset = makeAddr('debt')
  const debtDecimals = 18

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAccount as any).mockReturnValue({ address: owner, isConnected: true })
    ;(useChainId as any).mockReturnValue(8453)
    ;(useReadLeverageManagerV2GetLeverageTokenLendingAdapter as any).mockReturnValue({
      data: '0x1234567890123456789012345678901234567890',
    })
    // Total collateral: 1 ETH = 1e18
    ;(useReadContracts as any).mockReturnValue({
      data: [{ result: 1n * 10n ** 18n }],
      isLoading: false,
      isError: false,
    })
  })

  it('computes user equity and USD value from shares, equity, totalSupply and price', async () => {
    // Collateral: 1 ETH ($2000), Debt: 1000 USDC ($1), Equity = $1000
    // Total supply: 2000 shares, User has 500 shares (25%)
    // Expected: User equity = $250 = 250 USDC
    ;(useStateMod as any).useLeverageTokenState.mockReturnValue({
      data: {
        totalSupply: 2000n * 10n ** 18n,
        collateralInDebtAsset: 0n,
        debt: 1000n * 10n ** 18n, // 1000 USDC debt
        equity: 0n,
        collateralRatio: 0n,
      },
      isLoading: false,
      isError: false,
      error: undefined,
    })

    // User balance: 500e18 shares (25% of total)
    ;(useTokenBalanceMod as any).useTokenBalance.mockReturnValue({
      balance: 500n * 10n ** 18n,
      isLoading: false,
      isError: false,
      error: undefined,
    })

    // Prices: ETH = $2000, USDC = $1
    ;(pricesMod as any).useUsdPrices.mockReturnValue({
      data: { [collateralAsset.toLowerCase()]: 2000, [debtAsset.toLowerCase()]: 1 },
    })

    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useLeverageTokenUserPosition({
        tokenAddress: token,
        chainIdOverride: 8453,
        collateralAssetAddress: collateralAsset,
        collateralAssetDecimals: collateralDecimals,
        debtAssetAddress: debtAsset,
        debtAssetDecimals: debtDecimals,
      }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // equityInDebt = 250 USDC = 250e18
    expect(result.current.data?.equityInDebt).toBe(250n * 10n ** 18n)
    // equityUsd = $250
    expect(result.current.data?.equityUsd).toBeCloseTo(250)
  })

  it('handles zero totalSupply by returning zero equity in USD when price is known', async () => {
    // Edge case: totalSupply = 0, should return 0 equity
    ;(useStateMod as any).useLeverageTokenState.mockReturnValue({
      data: {
        totalSupply: 0n,
        collateralInDebtAsset: 0n,
        debt: 1000n * 10n ** 18n,
        equity: 0n,
        collateralRatio: 0n,
      },
      isLoading: false,
      isError: false,
      error: undefined,
    })
    ;(useTokenBalanceMod as any).useTokenBalance.mockReturnValue({
      balance: 500n * 10n ** 18n,
      isLoading: false,
      isError: false,
      error: undefined,
    })
    // Prices: ETH = $2000, USDC = $1
    ;(pricesMod as any).useUsdPrices.mockReturnValue({
      data: { [collateralAsset.toLowerCase()]: 2000, [debtAsset.toLowerCase()]: 1 },
    })

    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useLeverageTokenUserPosition({
        tokenAddress: token,
        chainIdOverride: 8453,
        collateralAssetAddress: collateralAsset,
        collateralAssetDecimals: collateralDecimals,
        debtAssetAddress: debtAsset,
        debtAssetDecimals: debtDecimals,
      }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data?.equityInDebt).toBe(0n)
    expect(result.current.data?.equityUsd).toBe(0)
  })
})
