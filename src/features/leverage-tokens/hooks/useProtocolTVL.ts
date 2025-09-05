import { useMemo } from 'react'
import { STALE_TIME } from '../utils/constants'
import { useLeverageTokensTableData } from './useLeverageTokensTableData'

export function useProtocolTVL() {
  const { data: tokens, isLoading, isError, error } = useLeverageTokensTableData()

  const tvl = useMemo(() => {
    if (!tokens || tokens.length === 0) return 0
    return tokens.reduce((sum, t) => sum + (t.tvl || 0), 0)
  }, [tokens])

  // Expose interval and staleTime semantics via dependency hook
  return {
    tvl,
    isLoading,
    isError,
    error,
    staleTime: STALE_TIME.supply,
  }
}
