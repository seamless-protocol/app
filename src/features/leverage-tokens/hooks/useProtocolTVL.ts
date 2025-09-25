import { useMemo } from 'react'
import { STALE_TIME } from '../utils/constants'
import { useLeverageTokensTableData } from './useLeverageTokensTableData'

export function useProtocolTVL() {
  const { data: tokens, isLoading, isError, error } = useLeverageTokensTableData()

  const { tvl, tvlUsd } = useMemo(() => {
    if (!tokens || tokens.length === 0) {
      return { tvl: 0, tvlUsd: undefined as number | undefined }
    }

    let usdSum: number | undefined = 0

    const debtUnitSum = tokens.reduce((sum, token) => {
      const tokenTvl = token.tvl ?? 0
      const nextSum = sum + tokenTvl

      if (usdSum !== undefined) {
        const tokenTvlUsd = token.tvlUsd
        if (typeof tokenTvlUsd === 'number' && Number.isFinite(tokenTvlUsd)) {
          usdSum += tokenTvlUsd
        } else {
          usdSum = undefined
        }
      }

      return nextSum
    }, 0)

    return { tvl: debtUnitSum, tvlUsd: usdSum }
  }, [tokens])

  // Expose interval and staleTime semantics via dependency hook
  return {
    tvl,
    tvlUsd,
    isLoading,
    isError,
    error,
    staleTime: STALE_TIME.supply,
  }
}
