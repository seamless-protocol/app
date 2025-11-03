import type { APYBreakdownData } from './APYBreakdown'
import { APYBreakdown } from './APYBreakdown'
import { Skeleton } from './ui/skeleton'
import { cn } from './ui/utils'

interface APYBreakdownTooltipProps {
  apyData?: APYBreakdownData | undefined
  isLoading?: boolean
  isError?: boolean
  compact?: boolean
  className?: string
}

/**
 * APY Breakdown tooltip - purely presentational component that displays APY data.
 * All data fetching should be done by parent components to ensure consistency.
 */
export function APYBreakdownTooltip({
  apyData,
  isLoading = false,
  isError = false,
  compact = false,
  className,
}: APYBreakdownTooltipProps) {
  if (isLoading) {
    return (
      <div className="min-w-[240px] space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="text-sm font-semibold text-foreground">APY Breakdown</div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    )
  }

  if (isError || !apyData) {
    return (
      <div className="min-w-[240px] space-y-2 rounded-lg border border-border bg-card p-4">
        <div className="text-sm font-semibold text-foreground">APY Breakdown</div>
        <div className="text-sm text-[var(--state-error-text)]">Error loading yield data</div>
      </div>
    )
  }

  return (
    <APYBreakdown
      data={apyData}
      compact={compact}
      className={cn('min-w-[240px] rounded-lg border border-border bg-card', className)}
    />
  )
}
