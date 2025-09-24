import { useMemo } from 'react'
import { formatUnits } from 'viem'
import type { LeverageTokenUserMetricsData } from './useLeverageTokenUserMetrics'

interface UseLeverageTokenEarningsParams {
  metrics?: LeverageTokenUserMetricsData
  equityDebt?: bigint
  equityUsd?: number
  collateralDecimals: number
  debtDecimals: number
  collateralPrice?: number
  debtPrice?: number
}

interface LeverageTokenEarningsResult {
  mintedDebt?: number
  mintedCollateral?: number
  mintedUsd?: number
  earnedDebt?: number
  earnedUsd?: number
}

export function useLeverageTokenEarnings({
  metrics,
  equityDebt,
  equityUsd,
  collateralDecimals,
  debtDecimals,
  collateralPrice,
  debtPrice,
}: UseLeverageTokenEarningsParams): LeverageTokenEarningsResult {
  return useMemo(() => {
    if (!metrics) {
      return {}
    }

    const mintedDebt =
      metrics.depositedDebt > 0n
        ? Number(formatUnits(metrics.depositedDebt, debtDecimals))
        : undefined

    const mintedCollateral =
      metrics.depositedCollateral > 0n
        ? Number(formatUnits(metrics.depositedCollateral, collateralDecimals))
        : undefined

    const equityDebtAmount =
      typeof equityDebt === 'bigint' ? Number(formatUnits(equityDebt, debtDecimals)) : undefined

    const mintedUsdFromDebt =
      typeof mintedDebt === 'number' && Number.isFinite(mintedDebt)
        ? typeof debtPrice === 'number' && Number.isFinite(debtPrice)
          ? mintedDebt * debtPrice
          : undefined
        : undefined

    const mintedUsdFromCollateral =
      typeof mintedCollateral === 'number' && Number.isFinite(mintedCollateral)
        ? typeof collateralPrice === 'number' && Number.isFinite(collateralPrice)
          ? mintedCollateral * collateralPrice
          : undefined
        : undefined

    const mintedUsd = mintedUsdFromDebt ?? mintedUsdFromCollateral

    const earnedDebt =
      typeof equityDebtAmount === 'number' &&
      Number.isFinite(equityDebtAmount) &&
      typeof mintedDebt === 'number' &&
      Number.isFinite(mintedDebt)
        ? equityDebtAmount - mintedDebt
        : undefined

    const earnedUsd =
      typeof equityUsd === 'number' &&
      Number.isFinite(equityUsd) &&
      typeof mintedUsd === 'number' &&
      Number.isFinite(mintedUsd)
        ? equityUsd - mintedUsd
        : undefined

    return {
      ...(typeof mintedDebt === 'number' && Number.isFinite(mintedDebt) ? { mintedDebt } : {}),
      ...(typeof mintedCollateral === 'number' && Number.isFinite(mintedCollateral)
        ? { mintedCollateral }
        : {}),
      ...(typeof mintedUsd === 'number' && Number.isFinite(mintedUsd) ? { mintedUsd } : {}),
      ...(typeof earnedDebt === 'number' && Number.isFinite(earnedDebt) ? { earnedDebt } : {}),
      ...(typeof earnedUsd === 'number' && Number.isFinite(earnedUsd) ? { earnedUsd } : {}),
    }
  }, [metrics, equityDebt, equityUsd, collateralDecimals, debtDecimals, collateralPrice, debtPrice])
}
