import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { getPointsPerDay, getRewardAPY } from '@/lib/utils/apy-calculations'
import { AssetDisplay } from '../../../components/ui/asset-display'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent } from '../../../components/ui/card'
import type { LeverageToken } from './LeverageTokenTable'

export type { LeverageToken }

interface FeaturedLeverageTokenProps {
  token: LeverageToken
  onClick?: (token: LeverageToken) => void
  className?: string
}

export function FeaturedLeverageToken({
  token,
  onClick,
  className = '',
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
        className="bg-gradient-to-br from-slate-800/60 to-slate-900/80 border-slate-700 hover:border-purple-500/50 transition-all duration-300 cursor-pointer transform hover:scale-[1.01] hover:shadow-lg hover:shadow-purple-500/10 w-full min-w-0"
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
              <h3 className="font-medium text-white text-sm truncate min-w-0">{token.name}</h3>
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
              <span className="text-slate-400 text-sm">APY</span>
              <span className="text-green-400 font-medium">{token.apy.toFixed(2)}%</span>
            </div>

            {/* Reward APY Row */}
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Reward APY</span>
              <span className="text-cyan-400 font-medium">+{getRewardAPY(token).toFixed(2)}%</span>
            </div>

            {/* Points Row */}
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Points/Day</span>
              <span className="text-yellow-400 font-medium">
                {getPointsPerDay(token).toLocaleString()}
              </span>
            </div>

            {/* Leverage Row with Divider */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-700">
              <span className="text-slate-400 text-sm">Leverage</span>
              <span className="text-purple-400 font-medium">{token.leverage}x</span>
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
}

export function FeaturedLeverageTokens({
  tokens,
  onTokenClick,
  className = '',
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
        <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
          <Zap className="h-5 w-5 text-yellow-400" />
          <span>Featured High-Reward Tokens</span>
        </h2>
        <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 bg-yellow-400/10">
          Top Rewards
        </Badge>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 w-full">
        {tokens.map((token, index) => (
          <FeaturedLeverageToken
            key={token.id}
            token={{
              ...token,
              rank: index + 1,
            }}
            {...(onTokenClick && { onClick: onTokenClick })}
          />
        ))}
      </div>
    </motion.div>
  )
}
