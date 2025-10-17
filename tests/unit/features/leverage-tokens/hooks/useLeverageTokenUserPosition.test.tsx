import { waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAccount, useChainId } from 'wagmi'
import * as useStateMod from '@/features/leverage-tokens/hooks/useLeverageTokenState'
import { useLeverageTokenUserPosition } from '@/features/leverage-tokens/hooks/useLeverageTokenUserPosition'
import * as useTokenBalanceMod from '@/lib/hooks/useTokenBalance'
import * as pricesMod from '@/lib/prices/useUsdPrices'
import { hookTestUtils, makeAddr } from '../../../../utils'

vi.mock('@/features/leverage-tokens/hooks/useLeverageTokenState')
vi.mock('@/lib/hooks/useTokenBalance')
vi.mock('@/lib/prices/useUsdPrices')

describe('useLeverageTokenUserPosition', () => {
  const token = makeAddr('token')
  const owner = makeAddr('owner')
  const debtAsset = makeAddr('debt')
  const debtDecimals = 18

  beforeEach(() => {
    vi.clearAllMocks()
    // Setup account and chain mocks
    ;(useAccount as any).mockReturnValue({ address: owner, isConnected: true })
    ;(useChainId as any).mockReturnValue(8453)
  })

  it('computes user equity and USD value from shares, equity, totalSupply and price', async () => {
    // State: equity = 1,000e18 debt units, totalSupply = 2,000e18 shares
    ;(useStateMod as any).useLeverageTokenState.mockReturnValue({
      data: {
        totalSupply: 2000n * 10n ** 18n,
        collateralInDebtAsset: 0n,
        debt: 0n,
        equity: 1000n * 10n ** 18n,
        collateralRatio: 0n,
      },
      isLoading: false,
      isError: false,
      error: undefined,
    })

    // Balance: 500e18 shares
    ;(useTokenBalanceMod as any).useTokenBalance.mockReturnValue({
      balance: 500n * 10n ** 18n,
      isLoading: false,
      isError: false,
      error: undefined,
    })

    // Price: $25 per debt asset
    ;(pricesMod as any).useUsdPrices.mockReturnValue({
      data: { [debtAsset.toLowerCase()]: 25 },
    })

    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useLeverageTokenUserPosition({
        tokenAddress: token,
        chainIdOverride: 8453,
        debtAssetAddress: debtAsset,
        debtAssetDecimals: debtDecimals,
      }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // equityInDebt = (500/2000) * 1000 = 250 debt units => 250e18 wei
    expect(result.current.data?.equityInDebt).toBe(250n * 10n ** 18n)
    // USD = 250 * 25 = 6250
    expect(result.current.data?.equityUsd).toBeCloseTo(6250)
  })

  it('handles zero totalSupply by returning zero equity in USD when price is known', async () => {
    ;(useStateMod as any).useLeverageTokenState.mockReturnValue({
      data: {
        totalSupply: 0n,
        collateralInDebtAsset: 0n,
        debt: 0n,
        equity: 1000n * 10n ** 18n,
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
    ;(pricesMod as any).useUsdPrices.mockReturnValue({
      data: { [debtAsset.toLowerCase()]: 25 },
    })

    const { result } = hookTestUtils.renderHookWithQuery(() =>
      useLeverageTokenUserPosition({
        tokenAddress: token,
        chainIdOverride: 8453,
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
