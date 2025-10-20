import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import type { BalanceChange, LeverageTokenState, UserPosition } from '@/lib/graphql/types/portfolio'
import type { PortfolioDataPoint } from '../components/portfolio-performance-chart'
import { generatePortfolioPerformanceData } from './portfolio-calculations'

export interface ComputePerformanceParams {
  rawUserPositions: Array<UserPosition>
  leverageTokenStates: Map<string, Array<LeverageTokenState>>
  balanceChanges: Array<BalanceChange>
  timeframe: '7D' | '30D' | '90D' | '1Y'
  usdHistory: Record<number, Record<string, Array<[number, number]>>>
  spotUsdPrices?: Record<string, number>
}

/**
 * Compute performance points from cached data (no network):
 * - Filters positions to those with configs
 * - Builds decimals + chain maps
 * - Creates a nearest-prior USD accessor from prefetched usdHistory
 * - Delegates to generatePortfolioPerformanceData
 */
export function computePerformancePointsFromCache({
  rawUserPositions,
  leverageTokenStates,
  balanceChanges,
  timeframe,
  usdHistory,
  spotUsdPrices,
}: ComputePerformanceParams): Array<PortfolioDataPoint> {
  const filteredUserPositions = rawUserPositions.filter((position) => {
    const leverageTokenAddress = position.leverageToken.id.toLowerCase()
    const tokenConfig = getLeverageTokenConfig(position.leverageToken.id as `0x${string}`)
    return tokenConfig && tokenConfig.address.toLowerCase() === leverageTokenAddress
  })

  const collateralDecimalsByLeverageToken: Record<string, number> = {}
  const chainIdByLeverageToken: Record<string, number> = {}
  for (const pos of filteredUserPositions) {
    const cfg = getLeverageTokenConfig(pos.leverageToken.id as `0x${string}`)
    const keyAddr = pos.leverageToken.id.toLowerCase()
    if (cfg?.collateralAsset?.decimals !== undefined) {
      collateralDecimalsByLeverageToken[keyAddr] = cfg.collateralAsset.decimals
    }
    if (cfg?.chainId !== undefined) {
      chainIdByLeverageToken[keyAddr] = cfg.chainId
    }
  }

  const nearestPrior = (chainId: number, address: string, tsSec: number): number | undefined => {
    const series = usdHistory?.[chainId]?.[address.toLowerCase()]
    if (!series || series.length === 0) return undefined
    let lo = 0
    let hi = series.length - 1
    let best: number | undefined
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2)
      const midVal = series[mid]
      if (!midVal) break
      const [t, p] = midVal
      if (t <= tsSec) {
        best = p
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    return best
  }

  return generatePortfolioPerformanceData(
    filteredUserPositions,
    leverageTokenStates,
    balanceChanges,
    timeframe,
    nearestPrior,
    collateralDecimalsByLeverageToken,
    chainIdByLeverageToken,
    spotUsdPrices,
  )
}
