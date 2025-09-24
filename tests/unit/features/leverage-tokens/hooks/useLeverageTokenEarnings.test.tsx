import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useLeverageTokenEarnings } from '@/features/leverage-tokens/hooks/useLeverageTokenEarnings'
import type { LeverageTokenUserMetricsData } from '@/features/leverage-tokens/hooks/useLeverageTokenUserMetrics'

describe('useLeverageTokenEarnings', () => {
  const makeMetrics = (
    params: Partial<LeverageTokenUserMetricsData>,
  ): LeverageTokenUserMetricsData => ({
    depositedCollateral: 0n,
    depositedCollateralFormatted: '0',
    depositedDebt: 0n,
    ...params,
  })

  it('prefers debt-denominated deposits for minted USD and derives earnings', () => {
    const metrics = makeMetrics({ depositedDebt: 100n * 10n ** 6n })

    const { result } = renderHook(() =>
      useLeverageTokenEarnings({
        metrics,
        equityDebt: 110n * 10n ** 6n,
        equityUsd: 110,
        collateralDecimals: 18,
        debtDecimals: 6,
        debtPrice: 1,
      }),
    )

    expect(result.current.mintedDebt).toBeCloseTo(100)
    expect(result.current.mintedUsd).toBeCloseTo(100)
    expect(result.current.earnedDebt).toBeCloseTo(10)
    expect(result.current.earnedUsd).toBeCloseTo(10)
  })

  it('falls back to collateral deposits when debt totals are missing', () => {
    const metrics = makeMetrics({ depositedCollateral: 2n * 10n ** 18n })

    const { result } = renderHook(() =>
      useLeverageTokenEarnings({
        metrics,
        equityUsd: 210,
        collateralDecimals: 18,
        debtDecimals: 6,
        collateralPrice: 100,
      }),
    )

    expect(result.current.mintedDebt).toBeUndefined()
    expect(result.current.mintedCollateral).toBeCloseTo(2)
    expect(result.current.mintedUsd).toBeCloseTo(200)
    expect(result.current.earnedUsd).toBeCloseTo(10)
  })

  it('returns undefined values when metrics are not available', () => {
    const { result } = renderHook(() =>
      useLeverageTokenEarnings({
        equityUsd: 100,
        collateralDecimals: 18,
        debtDecimals: 6,
      }),
    )

    expect(result.current.mintedDebt).toBeUndefined()
    expect(result.current.mintedUsd).toBeUndefined()
    expect(result.current.earnedUsd).toBeUndefined()
  })
})
