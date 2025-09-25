import type { LeverageToken } from '@/features/leverage-tokens/components/leverage-token-table'
import { useLeverageTokenAPY } from '@/features/leverage-tokens/hooks/useLeverageTokenAPY'
import type { APYBreakdownData } from './APYBreakdown'
import { APYBreakdown } from './APYBreakdown'
import { Skeleton } from './ui/skeleton'

interface APYBreakdownTooltipProps {
  token: LeverageToken
  apyData?: APYBreakdownData
  isLoading?: boolean
  isError?: boolean
  compact?: boolean
  className?: string
}

/**
 * APY Breakdown tooltip that uses the hook to fetch real yield data
 */
export function APYBreakdownTooltip({
  token,
  apyData,
  isLoading: preloadedIsLoading = false,
  isError: preloadedIsError = false,
  compact = false,
  className,
}: APYBreakdownTooltipProps) {
  // Use preloaded data if provided, otherwise fetch on demand
  const {
    data: onDemandApyData,
    isLoading: onDemandIsLoading,
    isError: onDemandIsError,
  } = useLeverageTokenAPY({
    tokenAddress: token.address,
    leverageToken: token,
    enabled: !apyData, // Only fetch if no preloaded data provided
  })

  // Use preloaded data if provided, otherwise use on-demand data
  const finalApyData = apyData || onDemandApyData
  const finalIsLoading = apyData ? false : preloadedIsLoading || onDemandIsLoading
  const finalIsError = apyData ? false : preloadedIsError || onDemandIsError

  if (finalIsLoading) {
    return (
      <div className="p-4 min-w-[240px]">
        <div className="text-sm font-semibold text-white mb-3">APY Breakdown</div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    )
  }

  if (finalIsError || !finalApyData) {
    return (
      <div className="p-4 min-w-[240px]">
        <div className="text-sm font-semibold text-white mb-3">APY Breakdown</div>
        <div className="text-sm text-slate-500">N/A</div>
      </div>
    )
  }

  return <APYBreakdown data={finalApyData} compact={compact} {...(className && { className })} />
}
