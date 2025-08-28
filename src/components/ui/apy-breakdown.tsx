import { formatPercentage, formatPoints } from '@/lib/utils/formatting'
import { cn } from './utils'

export interface APYBreakdownData {
  baseYield: number
  leverageMultiplier: number
  borrowCost: number
  rewardAPY: number
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
        {/* Base Yield */}
        <div className="flex justify-between">
          <span className="text-slate-300">Base Yield:</span>
          <span className="text-green-400 font-medium">
            {formatPercentage(data.baseYield, { showSign: true })}
          </span>
        </div>

        {/* Leverage Multiplier */}
        <div className="flex justify-between">
          <span className="text-slate-300">Leverage Multiplier:</span>
          <span className="text-purple-400 font-medium">{data.leverageMultiplier}x</span>
        </div>

        {/* Borrow Cost */}
        <div className="flex justify-between">
          <span className="text-slate-300">Borrow Cost:</span>
          <span className="text-red-400 font-medium">
            {formatPercentage(data.borrowCost, { showSign: true })}
          </span>
        </div>

        {/* Reward APY */}
        <div className="flex justify-between">
          <span className="text-slate-300">Reward APY:</span>
          <span className="text-cyan-400 font-medium">
            {formatPercentage(data.rewardAPY, { showSign: true })}
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
