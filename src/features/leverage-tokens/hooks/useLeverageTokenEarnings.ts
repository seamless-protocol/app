import { useMemo } from 'react'
import { formatUnits } from 'viem'
import type { LeverageTokenUserMetricsData } from './useLeverageTokenUserMetrics'

interface UseLeverageTokenEarningsParams {
  metrics?: LeverageTokenUserMetricsData
  equityUsd?: number
  collateralDecimals: number
  debtDecimals: number
  collateralPrice?: number
  debtPrice?: number
}

interface LeverageTokenEarningsResult {
  originallyMintedUsd?: number
  totalEarnedUsd?: number
}

export function useLeverageTokenEarnings({
  metrics,
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

    const debtAmount =
      metrics.depositedDebt > 0n
        ? Number(formatUnits(metrics.depositedDebt, debtDecimals))
        : undefined

    const collateralAmount =
      metrics.depositedCollateral > 0n
        ? Number(formatUnits(metrics.depositedCollateral, collateralDecimals))
        : undefined

    const mintedUsdFromDebt =
      typeof debtAmount === 'number' && Number.isFinite(debtAmount)
        ? typeof debtPrice === 'number' && Number.isFinite(debtPrice)
          ? debtAmount * debtPrice
          : debtAmount
        : undefined

    const mintedUsdFromCollateral =
      typeof collateralAmount === 'number' && Number.isFinite(collateralAmount)
        ? typeof collateralPrice === 'number' && Number.isFinite(collateralPrice)
          ? collateralAmount * collateralPrice
          : undefined
        : undefined

    const mintedUsd =
      typeof mintedUsdFromDebt === 'number' && mintedUsdFromDebt > 0
        ? mintedUsdFromDebt
        : mintedUsdFromCollateral

    if (typeof mintedUsd !== 'number' || !Number.isFinite(mintedUsd)) {
      return {}
    }

    const totalEarnedUsd =
      typeof equityUsd === 'number' && Number.isFinite(equityUsd)
        ? equityUsd - mintedUsd
        : undefined

    return {
      originallyMintedUsd: mintedUsd,
      ...(typeof totalEarnedUsd === 'number' && Number.isFinite(totalEarnedUsd)
        ? { totalEarnedUsd }
        : {}),
    }
  }, [metrics, equityUsd, collateralDecimals, debtDecimals, collateralPrice, debtPrice])
}
