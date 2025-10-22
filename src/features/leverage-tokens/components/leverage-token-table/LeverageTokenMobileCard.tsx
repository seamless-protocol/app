import { motion } from 'framer-motion'
import type { APYBreakdownData } from '@/components/APYBreakdown'
import { ApyInfoTooltip } from '@/components/ApyInfoTooltip'
import { formatAPY, formatCurrency } from '@/lib/utils/formatting'
import { AssetDisplay } from '../../../../components/ui/asset-display'
import { Card, CardContent } from '../../../../components/ui/card'
import { Skeleton } from '../../../../components/ui/skeleton'
import { LeverageBadge } from '../LeverageBadge'
import { SupplyCap } from '../SupplyCap'
import type { LeverageToken } from './LeverageTokenTable'

interface LeverageTokenMobileCardProps {
  token: LeverageToken
  onTokenClick?: (token: LeverageToken) => void
  apyData?: APYBreakdownData | undefined
  isApyLoading?: boolean | undefined
  isApyError?: boolean | undefined
}

export function LeverageTokenMobileCard({
  token,
  onTokenClick,
  apyData,
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
        className="w-full cursor-pointer transform transition-all duration-300 border border-border bg-card hover:border-border hover:bg-accent"
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
              <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">
                {token.name}
              </h3>
            </div>
          </div>

          {/* Divider */}
          <div className="mb-4 border-t border-[var(--divider-line)]"></div>

          {/* Stats Grid */}
          <div className="space-y-3">
            {/* TVL Row */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-secondary)]">TVL</span>
              {typeof token.tvlUsd === 'number' && Number.isFinite(token.tvlUsd) ? (
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                  {formatCurrency(token.tvlUsd, { thousandDecimals: 2, millionDecimals: 2 })}
                </span>
              ) : (
                <span className="text-sm text-[var(--text-muted)]">—</span>
              )}
            </div>

            {/* APY Row */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-secondary)]">APY</span>
              <div className="flex items-center space-x-1">
                {isApyError ? (
                  <span className="text-sm font-medium text-[var(--text-muted)]">N/A</span>
                ) : isApyLoading || !apyData ? (
                  <Skeleton variant="pulse" className="h-4 w-16" />
                ) : (
                  <span className="text-sm font-medium text-[var(--state-success-text)]">
                    {formatAPY(apyData.totalAPY, 2)}
                  </span>
                )}
                <ApyInfoTooltip
                  token={token}
                  {...(apyData && { apyData })}
                  isLoading={isApyLoading ?? false}
                  isError={isApyError ?? false}
                  iconSize="md"
                  side="top"
                  align="end"
                />
              </div>
            </div>

            {/* Leverage Row */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-secondary)]">Leverage</span>
              <LeverageBadge leverage={token.leverageRatio} size="sm" />
            </div>

            {/* Network Row */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-secondary)]">Network</span>
              <div className="inline-flex items-center space-x-1 rounded-full border border-border px-2 py-1 bg-accent">
                <div className="w-3 h-3 rounded-full overflow-hidden flex items-center justify-center">
                  <token.chainLogo className="w-3 h-3" />
                </div>
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  {token.chainName}
                </span>
              </div>
            </div>

            {/* Supply Cap Row */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-secondary)]">Remaining Supply Cap</span>
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
