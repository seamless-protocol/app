import type { RewardTokenApr } from '@/features/leverage-tokens/utils/apy-calculations/rewards-providers/types'
import { formatPercentage, formatPoints } from '@/lib/utils/formatting'
import { getTokenLogoComponent } from '@/lib/utils/token-logos'
import { cn } from './ui/utils'

export interface APYBreakdownData {
  stakingYield: number
  restakingYield: number
  borrowRate: number
  rewardsAPR: number
  rewardTokens?: Array<RewardTokenApr>
  points: number
  totalAPY: number
  utilization?: number | undefined
  raw?: {
    // Raw market rates without leverage adjustment
    rawBorrowRate: number
    rawStakingYield: number
    rawRestakingYield: number
  }
  metadata?: {
    // Averaging periods for transparency
    yieldAveragingPeriod?: string
    borrowAveragingPeriod?: string
  }
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
        {/* Staking Yield - only show if not zero */}
        {data.stakingYield !== 0 && (
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Staking Yield:</span>
            <span className="font-medium text-[var(--state-success-text)]">
              {formatPercentage(data.stakingYield, { decimals: 2, showSign: true })}
            </span>
          </div>
        )}

        {/* Restaking Yield - only show if not zero */}
        {data.restakingYield !== 0 && (
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Restaking Yield:</span>
            <span className="font-medium text-[var(--brand-primary)]">
              {formatPercentage(data.restakingYield, { decimals: 2, showSign: true })}
            </span>
          </div>
        )}

        {/* Borrow Rate - only show if not zero */}
        {data.borrowRate !== 0 && (
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Borrow Rate:</span>
            <span className="font-medium text-[var(--state-error-text)]">
              {formatPercentage(data.borrowRate, { decimals: 2, showSign: true })}
            </span>
          </div>
        )}

        {/* Individual Reward Tokens - show breakdown if available */}
        {data.rewardTokens && data.rewardTokens.length > 0
          ? data.rewardTokens.map((rewardToken) => (
              <div key={rewardToken.tokenAddress} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 flex-shrink-0">
                    {getTokenLogoComponent(rewardToken.tokenSymbol)}
                  </div>
                  <span className="text-[var(--text-secondary)]">
                    {rewardToken.tokenSymbol} APR:
                  </span>
                </div>
                <span className="font-medium text-[var(--accent-1)]">
                  {formatPercentage(rewardToken.apr, { decimals: 2, showSign: true })}
                </span>
              </div>
            ))
          : // Fallback: show total rewards APR if no breakdown available
            data.rewardsAPR !== 0 && (
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Rewards APR:</span>
                <span className="font-medium text-[var(--accent-1)]">
                  {formatPercentage(data.rewardsAPR, { decimals: 2, showSign: true })}
                </span>
              </div>
            )}

        {/* Points - only show if not zero */}
        {data.points !== 0 && (
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Points:</span>
            <span className="font-medium text-yellow-500">{formatPoints(data.points)}</span>
          </div>
        )}

        {/* Total APY - Separated */}
        <div className="mt-3 border-t border-[var(--divider-line)] pt-3">
          <div className="flex justify-between font-semibold">
            <span className="text-[var(--text-primary)]">Total APY:</span>
            <span
              className={
                data.totalAPY < 0
                  ? 'text-[var(--state-error-text)]'
                  : 'text-[var(--state-success-text)]'
              }
            >
              {formatPercentage(data.totalAPY, { decimals: 2, showSign: true })}
            </span>
          </div>
        </div>

        {/* Averaging Period Disclosure */}
        {data.metadata &&
          (data.metadata.yieldAveragingPeriod || data.metadata.borrowAveragingPeriod) && (
            <div className="mt-3 border-t border-[var(--divider-line)] pt-3">
              <div className="text-xs text-[var(--text-muted)]">
                {data.metadata.yieldAveragingPeriod && (
                  <p>Yield: {data.metadata.yieldAveragingPeriod}</p>
                )}
                {data.metadata.borrowAveragingPeriod && (
                  <p>Borrow: {data.metadata.borrowAveragingPeriod}</p>
                )}
              </div>
            </div>
          )}
      </div>
    </div>
  )
}
