import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import type { APYBreakdownData } from '@/components/APYBreakdown'
import { formatAPY, formatPercentage } from '@/lib/utils/formatting'
import { AssetDisplay } from '../../../components/ui/asset-display'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent } from '../../../components/ui/card'
import { Skeleton } from '../../../components/ui/skeleton'
import type { LeverageToken } from './leverage-token-table'

export type { LeverageToken }

interface FeaturedLeverageTokenProps {
  token: LeverageToken
  onClick?: (token: LeverageToken) => void
  className?: string
  apyData?: APYBreakdownData
}

export function FeaturedLeverageToken({
  token,
  onClick,
  className = '',
  apyData,
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
        className="w-full min-w-0 cursor-pointer transform transition-all duration-300 border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] hover:border-[var(--nav-border-active)] hover:bg-[color-mix(in_srgb,var(--surface-elevated) 45%,transparent)] hover:scale-[1.01] hover:shadow-lg hover:shadow-purple-500/10"
        onClick={handleClick}
      >
        <CardContent className="p-3 sm:p-4">
          {/* Header with Asset Display and Rank Badge */}
          <div className="flex items-center justify-between mb-3 min-w-0">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <div className="flex -space-x-1 flex-shrink-0">
                <AssetDisplay asset={token.collateralAsset} size="sm" variant="logo-only" />
                <AssetDisplay asset={token.debtAsset} size="sm" variant="logo-only" />
              </div>
              <h3 className="font-medium text-sm truncate min-w-0 text-[var(--text-primary)]">
                {token.name}
              </h3>
            </div>
            {token.rank && (
              <Badge className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/30 text-xs flex-shrink-0">
                #{token.rank}
              </Badge>
            )}
          </div>

          {/* Stats Grid */}
          <div className="space-y-2">
            {/* APY Row */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-secondary)]">APY</span>
              {apyData?.totalAPY !== undefined ? (
                <span className="text-[var(--state-success-text)] font-medium">
                  {formatAPY(apyData.totalAPY, 2)}
                </span>
              ) : (
                <Skeleton className="h-4 w-16" />
              )}
            </div>

            {/* Reward APR Row */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-secondary)]">Reward APR</span>
              {apyData?.rewardsAPR !== undefined ? (
                <span className="text-[var(--accent-1)] font-medium">
                  {formatPercentage(apyData.rewardsAPR, { decimals: 2 })}
                </span>
              ) : (
                <Skeleton className="h-4 w-16" />
              )}
            </div>

            {/* Points Row */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-secondary)]">Points</span>
              {apyData?.points !== undefined ? (
                <span className="text-yellow-500 font-medium">
                  {`${apyData.points.toLocaleString()} x`}
                </span>
              ) : (
                <Skeleton className="h-4 w-16" />
              )}
            </div>

            {/* Leverage Row with Divider */}
            <div className="flex justify-between items-center pt-2 border-t border-[var(--divider-line)]">
              <span className="text-sm text-[var(--text-secondary)]">Leverage</span>
              <span className="text-purple-400 font-medium">{token.leverageRatio}x</span>
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
  apyData?: APYBreakdownData // APY data for the first token
  isApyLoading?: boolean
  isApyError?: boolean
}

export function FeaturedLeverageTokens({
  tokens,
  onTokenClick,
  className = '',
  apyData,
  isApyLoading: _isApyLoading,
  isApyError: _isApyError,
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
          <Zap className="h-5 w-5 text-yellow-400" />
          <span>Featured High-Reward Tokens</span>
        </h2>
        <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 bg-yellow-500/10">
          Top Rewards
        </Badge>
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
            {...(apyData && { apyData })} // Pass APY data to all tokens
            {...(onTokenClick && { onClick: onTokenClick })}
          />
        ))}
      </div>
    </motion.div>
  )
}
