import type { LeverageToken } from '@/features/leverage-tokens/components/LeverageTokenTable'
import { useLeverageTokenAPY } from '@/features/leverage-tokens/hooks/useLeverageTokenAPY'
import type { APYBreakdownData } from './APYBreakdown'
import { APYBreakdown } from './APYBreakdown'

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
        <div className="text-sm text-slate-400">Loading yield data...</div>
      </div>
    )
  }

  if (finalIsError || !finalApyData) {
    return (
      <div className="p-4 min-w-[240px]">
        <div className="text-sm font-semibold text-white mb-3">APY Breakdown</div>
        <div className="text-sm text-red-400">Error loading yield data</div>
      </div>
    )
  }

  return <APYBreakdown data={finalApyData} compact={compact} {...(className && { className })} />
}
