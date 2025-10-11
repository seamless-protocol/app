import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import type { APYBreakdownData } from '@/components/APYBreakdown'
import { formatAPY, formatPercentage } from '@/lib/utils/formatting'
import { AssetDisplay } from '../../../components/ui/asset-display'
import { Card, CardContent } from '../../../components/ui/card'
import { Skeleton } from '../../../components/ui/skeleton'
import { LeverageBadge } from './LeverageBadge'
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
            {/* APY Row - only show if not zero */}
            {apyData && apyData.totalAPY !== 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-secondary)]">APY</span>
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
            )}

            {/* Reward APR Row - only show if not zero */}
            {apyData && apyData.rewardsAPR !== 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-secondary)]">Reward APR</span>
                {isApyError ? (
                  <span className="text-[var(--text-muted)] font-medium">N/A</span>
                ) : isApyLoading || !apyData ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  <span className="text-[var(--accent-1)] font-medium">
                    {formatPercentage(apyData.rewardsAPR, { decimals: 2 })}
                  </span>
                )}
              </div>
            )}

            {/* Points Row - always render for consistent card height */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-secondary)]">Points</span>
              {isApyError ? (
                <span className="text-[var(--text-muted)] font-medium">N/A</span>
              ) : isApyLoading || !apyData ? (
                <Skeleton className="h-4 w-16" />
              ) : apyData.points !== 0 ? (
                <span className="font-medium text-[var(--state-warning-text)]">
                  {`${apyData.points.toLocaleString('en-US')} x`}
                </span>
              ) : (
                <span className="text-[var(--text-muted)] font-medium">—</span>
              )}
            </div>

            {/* Leverage Row with Divider */}
            <div className="flex justify-between items-center pt-2 border-t border-[var(--divider-line)]">
              <span className="text-sm text-[var(--text-secondary)]">Leverage</span>
              <LeverageBadge leverage={token.leverageRatio} size="sm" />
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
