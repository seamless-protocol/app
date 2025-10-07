import { formatPercentage, formatPoints } from '@/lib/utils/formatting'
import { cn } from './ui/utils'

export interface APYBreakdownData {
  stakingYield: number
  restakingYield: number
  borrowRate: number
  rewardsAPR: number
  points: number
  totalAPY: number
}

interface APYBreakdownProps {
  data: APYBreakdownData
  compact?: boolean
  className?: string
}

export function APYBreakdown({ data, compact = false, className }: APYBreakdownProps) {
  const containerClass = compact
    ? 'space-y-3 p-4 min-w-[240px] rounded-lg border border-[var(--divider-line)] bg-[var(--surface-card)]'
    : 'space-y-4 p-4 min-w-[240px] rounded-lg border border-[var(--divider-line)] bg-[var(--surface-card)]'
  const titleClass = 'text-sm'
  const itemClass = 'text-sm'

  return (
    <div className={cn(containerClass, className)}>
      {/* Header */}
      <div className={cn('font-semibold text-[var(--text-primary)]', titleClass)}>
        APY Breakdown
      </div>

      {/* Breakdown Items */}
      <div className={cn('space-y-3', itemClass)}>
        {/* Staking Yield */}
        <div className="flex justify-between">
          <span className="text-[var(--text-secondary)]">Staking Yield:</span>
          <span className="font-medium text-[var(--state-success-text)]">
            {formatPercentage(data.stakingYield, { decimals: 2, showSign: true })}
          </span>
        </div>

        {/* Restaking Yield */}
        <div className="flex justify-between">
          <span className="text-[var(--text-secondary)]">Restaking Yield:</span>
          <span className="font-medium text-[var(--brand-primary)]">
            {formatPercentage(data.restakingYield, { decimals: 2, showSign: true })}
          </span>
        </div>

        {/* Borrow Rate */}
        <div className="flex justify-between">
          <span className="text-[var(--text-secondary)]">Borrow Rate:</span>
          <span className="font-medium text-[var(--state-error-text)]">
            {formatPercentage(data.borrowRate, { decimals: 2, showSign: true })}
          </span>
        </div>

        {/* Rewards APR */}
        <div className="flex justify-between">
          <span className="text-[var(--text-secondary)]">Rewards APR:</span>
          <span className="font-medium text-[var(--accent-1)]">
            {formatPercentage(data.rewardsAPR, { decimals: 2, showSign: true })}
          </span>
        </div>

        {/* Points */}
        <div className="flex justify-between">
          <span className="text-[var(--text-secondary)]">Points:</span>
          <span className="font-medium text-yellow-500">{formatPoints(data.points)}</span>
        </div>

        {/* Total APY - Separated */}
        <div className="mt-3 border-t border-[var(--divider-line)] pt-3">
          <div className="flex justify-between font-semibold">
            <span className="text-[var(--text-primary)]">Total APY:</span>
            <span className="text-[var(--state-success-text)]">
              {formatPercentage(data.totalAPY, { decimals: 2, showSign: true })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
