export type DeFiLlamaTVLPoint = { date: number; totalLiquidityUSD: number }
export type DeFiLlamaChainSeries = { tvl?: Array<DeFiLlamaTVLPoint> }
export type DeFiLlamaProtocolResponse = {
  name?: string
  chainTvls?: Record<string, DeFiLlamaChainSeries>
  tvl?: Array<DeFiLlamaTVLPoint>
}

/**
 * Compute the latest aggregate TVL (USD) from a DeFiLlama protocol response.
 * Prefers top-level total; falls back to summing latest points across chains.
 * Throws if a valid numeric TVL cannot be derived.
 */
export function computeProtocolLatestTVL(json: DeFiLlamaProtocolResponse): number {
  const topSeries = json?.tvl ?? []
  const latestFromTop = topSeries.length > 0 ? topSeries[topSeries.length - 1] : undefined
  let tvlUsd: number | undefined = latestFromTop?.totalLiquidityUSD

  if (typeof tvlUsd !== 'number' || !Number.isFinite(tvlUsd)) {
    const chainTvls = json?.chainTvls ?? {}
    const chainLatestSum = Object.values(chainTvls).reduce((acc, series) => {
      const arr = series?.tvl ?? []
      if (arr.length === 0) return acc
      const latestPoint = arr[arr.length - 1]
      const val = latestPoint?.totalLiquidityUSD
      return acc + (typeof val === 'number' && Number.isFinite(val) ? val : 0)
    }, 0)
    tvlUsd = chainLatestSum > 0 ? chainLatestSum : undefined
  }

  if (typeof tvlUsd !== 'number' || !Number.isFinite(tvlUsd)) {
    throw new Error('DeFiLlama payload missing latest totalLiquidityUSD')
  }
  return tvlUsd
}
