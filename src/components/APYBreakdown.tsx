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
  const containerClass = compact ? 'space-y-3 p-4 min-w-[240px]' : 'space-y-4 p-4 min-w-[240px]'
  const titleClass = compact ? 'text-sm' : 'text-sm'
  const itemClass = compact ? 'text-sm' : 'text-sm'

  return (
    <div className={cn(containerClass, className)}>
      {/* Header */}
      <div className={cn('font-semibold text-white', titleClass)}>APY Breakdown</div>

      {/* Breakdown Items */}
      <div className={cn('space-y-3', itemClass)}>
        {/* Staking Yield */}
        <div className="flex justify-between">
          <span className="text-slate-300">Staking Yield:</span>
          <span className="text-green-400 font-medium">
            {formatPercentage(data.stakingYield, { showSign: true })}
          </span>
        </div>

        {/* Restaking Yield */}
        <div className="flex justify-between">
          <span className="text-slate-300">Restaking Yield:</span>
          <span className="text-blue-400 font-medium">
            {formatPercentage(data.restakingYield, { showSign: true })}
          </span>
        </div>

        {/* Borrow Rate */}
        <div className="flex justify-between">
          <span className="text-slate-300">Borrow Rate:</span>
          <span className="text-red-400 font-medium">
            {formatPercentage(data.borrowRate, { showSign: true })}
          </span>
        </div>

        {/* Rewards APR */}
        <div className="flex justify-between">
          <span className="text-slate-300">Rewards APR:</span>
          <span className="text-cyan-400 font-medium">
            {formatPercentage(data.rewardsAPR, { showSign: true })}
          </span>
        </div>

        {/* Points */}
        <div className="flex justify-between">
          <span className="text-slate-300">Points:</span>
          <span className="text-yellow-400 font-medium">{formatPoints(data.points)}</span>
        </div>

        {/* Total APY - Separated */}
        <div className="border-t border-slate-600 pt-3 mt-3">
          <div className="flex justify-between font-semibold">
            <span className="text-white">Total APY:</span>
            <span className="text-green-400">
              {formatPercentage(data.totalAPY, { showSign: true })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
