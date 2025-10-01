import { TrendingUp } from 'lucide-react'
import type { APYBreakdownData } from '@/components/APYBreakdown'
import { APYBreakdownTooltip } from '@/components/APYBreakdownTooltip'
import { ArrowUpRight, Info, Minus, Plus } from '@/components/icons'
import { AssetDisplay } from '@/components/ui/asset-display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { cn } from '@/lib/utils/cn'

export interface Position {
  id: string
  name: string
  type: 'vault' | 'leverage-token'
  token: 'USDC' | 'WETH' | 'weETH'
  riskLevel: 'low' | 'medium' | 'high'
  currentValue: {
    amount: string
    symbol: string
    usdValue: string
  }
  unrealizedGain: {
    amount: string
    symbol: string
    percentage: string
  }
  apy: string
  // For leverage tokens, we need both assets
  collateralAsset?: {
    symbol: string
    name: string
  }
  debtAsset?: {
    symbol: string
    name: string
  }
  // APY breakdown data for tooltip
  apyBreakdown?: APYBreakdownData | undefined
  leverageTokenAddress?: string // For fetching APY data
}

interface ActivePositionsProps {
  positions: Array<Position>
  onAction: (action: 'deposit' | 'withdraw' | 'mint' | 'redeem', position: Position) => void
  onPositionClick?: (position: Position) => void
  className?: string
  apyLoading?: boolean
}

const getRiskLevelColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'low':
      return 'text-[var(--state-success-text)] bg-[color-mix(in_srgb,var(--state-success-text)_15%,transparent)] border-[color-mix(in_srgb,var(--state-success-text)_25%,transparent)]'
    case 'medium':
      return 'text-[var(--state-warning-text)] bg-[color-mix(in_srgb,var(--state-warning-text)_15%,transparent)] border-[color-mix(in_srgb,var(--state-warning-text)_25%,transparent)]'
    case 'high':
      return 'text-[var(--state-error-text)] bg-[color-mix(in_srgb,var(--state-error-text)_15%,transparent)] border-[color-mix(in_srgb,var(--state-error-text)_25%,transparent)]'
    default:
      return 'text-[var(--text-secondary)] border-[var(--divider-line)]'
  }
}

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'vault':
      return 'Vaults'
    case 'leverage-token':
      return 'Leverage Tokens'
    default:
      return 'Unknown'
  }
}

// Component to handle APY display for each position
function PositionAPYDisplay({ position, isLoading }: { position: Position; isLoading?: boolean }) {
  // Use the pre-calculated APY data from the portfolio hook
  const displayAPY = position.apy
  const apyBreakdown = position.apyBreakdown

  if (isLoading) {
    return (
      <div className="cursor-help">
        <div className="flex items-center">
          <p className="mr-1 text-xs text-[var(--text-secondary)]">APY</p>
          <Info className="h-3 w-3 text-[var(--text-muted)]" />
        </div>
        <div className="h-5 w-16 animate-pulse rounded bg-[var(--skeleton-base)]" />
      </div>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-help">
          <div className="flex items-center">
            <p className="mr-1 text-xs text-[var(--text-secondary)]">APY</p>
            <Info className="h-3 w-3 text-[var(--text-muted)]" />
          </div>
          <p className="font-medium text-[var(--brand-secondary)]">{displayAPY}</p>
        </div>
      </TooltipTrigger>
      <TooltipContent className="border border-[var(--divider-line)] bg-[var(--surface-card)] p-0 text-sm">
        {apyBreakdown &&
          position.leverageTokenAddress &&
          (() => {
            const tokenConfig = getLeverageTokenConfig(
              position.leverageTokenAddress as `0x${string}`,
            )
            return tokenConfig ? (
              <APYBreakdownTooltip token={tokenConfig} apyData={apyBreakdown} />
            ) : (
              <p>Annual Percentage Yield</p>
            )
          })()}
      </TooltipContent>
    </Tooltip>
  )
}

// No need for custom renderLeverageTokenLogos - AssetDisplay handles this perfectly

export function ActivePositions({
  positions,
  onAction,
  onPositionClick,
  className,
  apyLoading,
}: ActivePositionsProps) {
  const activeCount = positions.length

  return (
    <Card
      className={cn(
        'bg-[color-mix(in_srgb,var(--surface-card)_92%,transparent)] border border-[var(--divider-line)]',
        className,
      )}
    >
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Active Positions</h3>
            <Badge className="bg-[color-mix(in_srgb,var(--surface-elevated)_35%,transparent)] text-[var(--text-secondary)] border-[var(--divider-line)]">
              {activeCount} Active Position{activeCount !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="space-y-4">
            {positions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[color-mix(in_srgb,var(--surface-elevated)_35%,transparent)] flex items-center justify-center mb-4">
                  <TrendingUp className="h-8 w-8 text-[var(--text-muted)]" />
                </div>
                <h3 className="text-lg font-medium text-[var(--text-secondary)] mb-2">
                  No Active Positions
                </h3>
                <p className="text-sm text-[var(--text-muted)] max-w-sm">
                  Mint leverage tokens to see your active positions and start earning rewards.
                </p>
              </div>
            ) : (
              positions.map((position) => {
                const isLeverageToken = position.type === 'leverage-token'
                const primaryAction = isLeverageToken ? 'mint' : 'deposit'
                const secondaryAction = isLeverageToken ? 'redeem' : 'withdraw'
                const primaryLabel = isLeverageToken ? 'Mint' : 'Deposit'
                const secondaryLabel = isLeverageToken ? 'Redeem' : 'Withdraw'

                return (
                  // biome-ignore lint/a11y/useSemanticElements: Cannot use button here due to nested button elements (tooltip triggers)
                  <div
                    key={position.id}
                    className="w-full text-left bg-[color-mix(in_srgb,var(--surface-elevated)_35%,transparent)] border border-[var(--divider-line)] rounded-lg p-4 hover:bg-[color-mix(in_srgb,var(--surface-elevated)_45%,transparent)] hover:border-[var(--nav-border-active)] transition-all duration-200 cursor-pointer group"
                    onClick={() => onPositionClick?.(position)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onPositionClick?.(position)
                      }
                    }}
                    aria-label={`View details for ${position.name}`}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                      {/* Token Info */}
                      <div className="lg:col-span-4 flex items-center space-x-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                            isLeverageToken && position.collateralAsset && position.debtAsset
                              ? ''
                              : 'bg-[color-mix(in_srgb,var(--surface-elevated)_35%,transparent)] border border-[var(--divider-line)] p-1'
                          }`}
                        >
                          {isLeverageToken && position.collateralAsset && position.debtAsset ? (
                            <div className="flex -space-x-1">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
                                style={{ zIndex: 2 }}
                              >
                                <AssetDisplay
                                  asset={position.collateralAsset}
                                  size="lg"
                                  variant="logo-only"
                                  tooltipContent={
                                    <p className="font-medium">
                                      {position.collateralAsset.name} (
                                      {position.collateralAsset.symbol})
                                    </p>
                                  }
                                />
                              </div>
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
                                style={{ zIndex: 1 }}
                              >
                                <AssetDisplay
                                  asset={position.debtAsset}
                                  size="lg"
                                  variant="logo-only"
                                  tooltipContent={
                                    <p className="font-medium">
                                      {position.debtAsset.name} ({position.debtAsset.symbol})
                                    </p>
                                  }
                                />
                              </div>
                            </div>
                          ) : (
                            <AssetDisplay
                              asset={{ symbol: position.token, name: position.name }}
                              size="lg"
                              variant="logo-only"
                              tooltipContent={
                                <p className="font-medium">
                                  {position.name} ({position.token})
                                </p>
                              }
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-[var(--text-primary)] truncate transition-colors group-hover:text-[var(--brand-secondary)]">
                              {position.name}
                            </h3>
                            <ArrowUpRight className="h-4 w-4 text-[var(--text-muted)] transition-colors opacity-0 group-hover:text-[var(--brand-secondary)] group-hover:opacity-100 lg:hidden" />
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getRiskLevelColor(position.riskLevel)}>
                              {position.riskLevel.charAt(0).toUpperCase() +
                                position.riskLevel.slice(1)}{' '}
                              Risk
                            </Badge>
                            <Badge className="border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-elevated)_35%,transparent)] text-[var(--text-secondary)]">
                              {getTypeLabel(position.type)}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Position Stats */}
                      <div className="lg:col-span-5 space-y-4 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-4">
                        {/* First row: Current Value and Unrealized Gain */}
                        <div className="grid grid-cols-2 gap-4 lg:contents">
                          <div className="text-left">
                            <p className="text-xs text-[var(--text-secondary)]">Current Value</p>
                            <p className="font-medium text-[var(--text-primary)]">
                              {position.currentValue.amount} {position.currentValue.symbol}
                            </p>
                            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                              {position.currentValue.usdValue}
                            </p>
                          </div>
                          <div className="text-left">
                            <p className="text-xs text-[var(--text-secondary)]">Unrealized Gain</p>
                            <p
                              className={cn(
                                'font-medium',
                                position.unrealizedGain.amount.startsWith('+')
                                  ? 'text-[var(--state-success-text)]'
                                  : 'text-[var(--state-error-text)]',
                              )}
                            >
                              {position.unrealizedGain.amount} {position.unrealizedGain.symbol}
                            </p>
                            <p
                              className={cn(
                                'text-xs',
                                position.unrealizedGain.percentage.startsWith('+')
                                  ? 'text-[var(--state-success-text)]'
                                  : 'text-[var(--state-error-text)]',
                              )}
                            >
                              {position.unrealizedGain.percentage}
                            </p>
                          </div>
                        </div>

                        {/* Second row: APY */}
                        <div className="text-left lg:contents">
                          <PositionAPYDisplay position={position} isLoading={apyLoading ?? false} />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="lg:col-span-3 w-full lg:flex lg:items-center lg:justify-end lg:space-x-2">
                        <div className="grid grid-cols-2 gap-2 lg:flex lg:gap-2">
                          <Button
                            size="sm"
                            variant="gradient"
                            className="w-full lg:w-auto flex-1 lg:flex-none"
                            onClick={(e) => {
                              e.stopPropagation()
                              onAction(primaryAction, position)
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            {primaryLabel}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full lg:w-auto flex-1 lg:flex-none border-[var(--divider-line)] text-[var(--text-secondary)] hover:bg-[color-mix(in_srgb,var(--surface-elevated)_35%,transparent)] hover:text-[var(--text-primary)]"
                            onClick={(e) => {
                              e.stopPropagation()
                              onAction(secondaryAction, position)
                            }}
                          >
                            <Minus className="h-4 w-4 mr-1" />
                            {secondaryLabel}
                          </Button>
                        </div>
                        <ArrowUpRight className="hidden h-4 w-4 text-[var(--text-muted)] transition-colors opacity-0 group-hover:text-[var(--brand-secondary)] group-hover:opacity-100 lg:block lg:ml-2" />
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
