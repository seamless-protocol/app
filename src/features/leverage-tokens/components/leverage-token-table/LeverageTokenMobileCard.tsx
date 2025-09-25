import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import type { APYBreakdownData } from '@/components/APYBreakdown'
import { APYBreakdownTooltip } from '@/components/APYBreakdownTooltip'
import { formatAPY, formatCurrency } from '@/lib/utils/formatting'
import { AssetDisplay } from '../../../../components/ui/asset-display'
import { Card, CardContent } from '../../../../components/ui/card'
import { Skeleton } from '../../../../components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../../components/ui/tooltip'
import { LeverageBadge } from '../LeverageBadge'
import { SupplyCap } from '../SupplyCap'
import type { LeverageToken } from './LeverageTokenTable'

interface LeverageTokenMobileCardProps {
  token: LeverageToken
  onTokenClick?: (token: LeverageToken) => void
  apyDataMap?: Map<string, APYBreakdownData> | undefined
  isApyLoading?: boolean | undefined
  isApyError?: boolean | undefined
}

export function LeverageTokenMobileCard({
  token,
  onTokenClick,
  apyDataMap,
  isApyLoading,
  isApyError,
}: LeverageTokenMobileCardProps) {
  const handleClick = () => {
    onTokenClick?.(token)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="bg-gradient-to-br from-slate-800/60 to-slate-900/80 border-slate-700 hover:border-purple-500/50 transition-all duration-300 cursor-pointer transform hover:scale-[1.01] hover:shadow-lg hover:shadow-purple-500/10 w-full"
        onClick={handleClick}
      >
        <CardContent className="p-4">
          {/* Header with Asset Display */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex -space-x-1">
              <AssetDisplay asset={token.collateralAsset} size="sm" variant="logo-only" />
              <AssetDisplay asset={token.debtAsset} size="sm" variant="logo-only" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white text-sm truncate">{token.name}</h3>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-700 mb-4"></div>

          {/* Stats Grid */}
          <div className="space-y-3">
            {/* TVL Row */}
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">TVL</span>
              {typeof token.tvlUsd === 'number' && Number.isFinite(token.tvlUsd) ? (
                <span className="text-slate-300 font-medium text-sm">
                  {formatCurrency(token.tvlUsd)}
                </span>
              ) : (
                <span className="text-slate-500 text-sm">—</span>
              )}
            </div>

            {/* APY Row */}
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">APY</span>
              <div className="flex items-center space-x-1">
                {(() => {
                  const tokenApyData = apyDataMap?.get(token.address)
                  const tokenApyError =
                    isApyError || (!isApyLoading && !apyDataMap?.has(token.address))

                  if (tokenApyError) {
                    return <span className="text-slate-500 text-xs">N/A</span>
                  } else if (isApyLoading || !tokenApyData) {
                    return <Skeleton className="h-4 w-16" />
                  } else {
                    return (
                      <span className="text-green-400 font-medium text-sm">
                        {formatAPY(tokenApyData.totalAPY, 2)}
                      </span>
                    )
                  }
                })()}
                {(() => {
                  const tokenApyData = apyDataMap?.get(token.address)
                  const tokenApyError =
                    isApyError || (!isApyLoading && !apyDataMap?.has(token.address))

                  if (!tokenApyError && tokenApyData) {
                    return (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-slate-400 hover:text-slate-300 active:text-slate-300 transition-colors touch-manipulation !min-w-0 !min-h-0"
                          >
                            <Info className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          className="p-0 bg-slate-800 border-slate-700 text-sm z-50"
                          side="top"
                          align="end"
                          sideOffset={8}
                        >
                          <APYBreakdownTooltip
                            token={token}
                            compact
                            apyData={tokenApyData}
                            isLoading={isApyLoading ?? false}
                            isError={tokenApyError}
                          />
                        </TooltipContent>
                      </Tooltip>
                    )
                  }
                  return null
                })()}
              </div>
            </div>

            {/* Leverage Row */}
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Leverage</span>
              <LeverageBadge leverage={token.leverageRatio} size="sm" />
            </div>

            {/* Network Row */}
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Network</span>
              <div className="inline-flex items-center space-x-1 bg-slate-800/60 px-2 py-1 rounded-full border border-slate-600/50">
                <div className="w-3 h-3 rounded-full overflow-hidden flex items-center justify-center">
                  <token.chainLogo className="w-3 h-3" />
                </div>
                <span className="text-xs text-slate-300 font-medium">{token.chainName}</span>
              </div>
            </div>

            {/* Supply Cap Row */}
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Supply Cap</span>
              <SupplyCap
                currentSupply={token.currentSupply ?? 0}
                supplyCap={token.supplyCap ?? 0}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
