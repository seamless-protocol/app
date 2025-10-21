import { motion } from 'framer-motion'
import { Info, Zap } from 'lucide-react'
import type { APYBreakdownData } from '@/components/APYBreakdown'
import { formatAPY, formatPercentage, formatPoints } from '@/lib/utils/formatting'
import { AssetDisplay } from '../../../components/ui/asset-display'
import { Card, CardContent } from '../../../components/ui/card'
import { Skeleton } from '../../../components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip'
import type { LeverageToken } from './leverage-token-table'

export type { LeverageToken }

interface FeaturedLeverageTokenProps {
  token: LeverageToken
  onClick?: (token: LeverageToken) => void
  className?: string
  apyData?: APYBreakdownData | undefined
  isApyLoading?: boolean
  isApyError?: boolean | undefined
}

export function FeaturedLeverageToken({
  token,
  onClick,
  className = '',
  apyData,
  isApyLoading = false,
  isApyError = false,
}: FeaturedLeverageTokenProps) {
  const handleClick = () => {
    onClick?.(token)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card
        className="w-full min-w-0 cursor-pointer transform transition-all duration-300 border border-border bg-card hover:border-border hover:bg-accent "
        onClick={handleClick}
      >
        <CardContent className="p-3 sm:p-4">
          {/* Header with Asset Display */}
          <div className="flex items-center mb-3 min-w-0">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <div className="flex -space-x-1 flex-shrink-0">
                <AssetDisplay asset={token.collateralAsset} size="sm" variant="logo-only" />
                <AssetDisplay asset={token.debtAsset} size="sm" variant="logo-only" />
              </div>
              <h3 className="font-medium text-sm truncate min-w-0 text-[var(--text-primary)]">
                {token.name}
              </h3>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="space-y-2">
            {/* Sub-APY breakdown (hierarchical, inline, fixed rows for consistent height) */}
            <div className="space-y-1">
              {isApyLoading || !apyData ? (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Staking</span>
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Restaking</span>
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Borrow</span>
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Rewards APR</span>
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Points</span>
                    <Skeleton className="h-3 w-12" />
                  </div>
                </>
              ) : isApyError ? (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Staking</span>
                    <span className="text-[var(--text-muted)]">—</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Restaking</span>
                    <span className="text-[var(--text-muted)]">—</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Borrow</span>
                    <span className="text-[var(--text-muted)]">—</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Rewards APR</span>
                    <span className="text-[var(--text-muted)]">—</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Points</span>
                    <span className="text-[var(--text-muted)]">—</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Staking</span>
                    <span className="font-medium text-[var(--state-success-text)]">
                      {apyData.stakingYield !== 0
                        ? formatPercentage(apyData.stakingYield, { decimals: 2, showSign: true })
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Restaking</span>
                    <span className="font-medium text-[var(--brand-primary)]">
                      {apyData.restakingYield !== 0
                        ? formatPercentage(apyData.restakingYield, { decimals: 2, showSign: true })
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Borrow</span>
                    <span className="font-medium text-[var(--state-error-text)]">
                      {apyData.borrowRate !== 0
                        ? formatPercentage(apyData.borrowRate, { decimals: 2, showSign: true })
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Rewards APR</span>
                    <span className="font-medium text-[var(--accent-1)]">
                      {apyData.rewardsAPR !== 0
                        ? formatPercentage(apyData.rewardsAPR, { decimals: 2, showSign: true })
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Points</span>
                    <span className="font-medium text-[var(--state-warning-text)]">
                      {apyData.points !== 0 ? formatPoints(apyData.points) : '—'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Total Net APY summary row */}
            <div className="flex justify-between items-center pt-2 border-t border-[var(--divider-line)]">
              <div className="flex items-center gap-1">
                <span className="text-sm text-[var(--text-secondary)]">Total Net APY</span>
                {apyData?.metadata &&
                  (apyData.metadata.yieldAveragingPeriod ||
                    apyData.metadata.borrowAveragingPeriod) && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Info className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="text-xs text-[var(--text-muted)]">
                          {apyData.metadata.yieldAveragingPeriod && (
                            <p>Yield: {apyData.metadata.yieldAveragingPeriod}</p>
                          )}
                          {apyData.metadata.borrowAveragingPeriod && (
                            <p>Borrow: {apyData.metadata.borrowAveragingPeriod}</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
              </div>
              {isApyError ? (
                <span className="text-[var(--text-muted)] font-medium">N/A</span>
              ) : isApyLoading || !apyData ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                <span className="text-[var(--state-success-text)] font-medium">
                  {formatAPY(apyData.totalAPY, 2)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface FeaturedLeverageTokensProps {
  tokens: Array<LeverageToken>
  onTokenClick?: (token: LeverageToken) => void
  className?: string
  apyDataMap?: Map<string, APYBreakdownData> | undefined
  isApyLoading?: boolean
  isApyError?: boolean
}

export function FeaturedLeverageTokens({
  tokens,
  onTokenClick,
  className = '',
  apyDataMap,
  isApyLoading,
  isApyError,
}: FeaturedLeverageTokensProps) {
  return (
    <motion.div
      className={`space-y-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] flex items-center space-x-2">
          <Zap className="h-5 w-5 text-[var(--state-warning-text)]" />
          <span>Featured</span>
        </h2>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 w-full">
        {tokens.map((token, index) => (
          <FeaturedLeverageToken
            key={token.address}
            token={{
              ...token,
              rank: index + 1,
            }}
            apyData={apyDataMap?.get(token.address)}
            isApyLoading={isApyLoading ?? false}
            isApyError={
              isApyError ||
              (!isApyLoading && apyDataMap !== undefined && !apyDataMap.has(token.address))
            }
            {...(onTokenClick && { onClick: onTokenClick })}
          />
        ))}
      </div>
    </motion.div>
  )
}
