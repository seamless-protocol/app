import type { APYBreakdownData } from '@/components/APYBreakdown'
import { APYBreakdownTooltip } from '@/components/APYBreakdownTooltip'
import { ArrowUpRight, Info, Minus, Plus } from '@/components/icons'
import { AssetDisplay } from '@/components/ui/asset-display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
}

const getRiskLevelColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'low':
      return 'text-green-400 bg-green-400/10 border-green-400/20'
    case 'medium':
      return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    case 'high':
      return 'text-red-400 bg-red-400/10 border-red-400/20'
    default:
      return 'text-slate-400 border-slate-600'
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
function PositionAPYDisplay({ position }: { position: Position }) {
  // Use the pre-calculated APY data from the portfolio hook
  const displayAPY = position.apy
  const apyBreakdown = position.apyBreakdown

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-help">
          <div className="flex items-center">
            <p className="text-xs text-slate-400 mr-1">APY</p>
            <Info className="h-3 w-3 text-slate-400" />
          </div>
          <p className="font-medium text-purple-400">{displayAPY}</p>
        </div>
      </TooltipTrigger>
      <TooltipContent className="p-0 bg-slate-800 border-slate-700 text-sm">
        {apyBreakdown ? (
          <APYBreakdownTooltip
            token={
              {
                address: position.leverageTokenAddress || '',
                name: position.name,
                collateralAsset: position.collateralAsset,
                debtAsset: position.debtAsset,
              } as any
            }
            apyData={apyBreakdown}
          />
        ) : (
          <p>Annual Percentage Yield</p>
        )}
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
}: ActivePositionsProps) {
  const activeCount = positions.length

  return (
    <Card className={cn('bg-slate-900/80 border-slate-700', className)}>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Active Positions</h3>
            <Badge className="bg-slate-800 text-slate-300 border-transparent">
              {activeCount} Active Position{activeCount !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="space-y-4">
            {positions.map((position) => {
              const isLeverageToken = position.type === 'leverage-token'
              const primaryAction = isLeverageToken ? 'mint' : 'deposit'
              const secondaryAction = isLeverageToken ? 'redeem' : 'withdraw'
              const primaryLabel = isLeverageToken ? 'Mint' : 'Deposit'
              const secondaryLabel = isLeverageToken ? 'Redeem' : 'Withdraw'

              return (
                <button
                  key={position.id}
                  type="button"
                  className="w-full text-left bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:bg-slate-800/70 hover:border-purple-500/50 transition-all duration-200 cursor-pointer group"
                  onClick={() => onPositionClick?.(position)}
                  aria-label={`View details for ${position.name}`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                    {/* Token Info */}
                    <div className="lg:col-span-4 flex items-center space-x-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                          isLeverageToken && position.collateralAsset && position.debtAsset
                            ? ''
                            : 'bg-slate-700/50 border border-slate-600 p-1'
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
                          <h3 className="font-medium text-white truncate group-hover:text-purple-300 transition-colors">
                            {position.name}
                          </h3>
                          <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-purple-400 transition-colors opacity-0 group-hover:opacity-100 lg:hidden" />
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getRiskLevelColor(position.riskLevel)}>
                            {position.riskLevel.charAt(0).toUpperCase() +
                              position.riskLevel.slice(1)}{' '}
                            Risk
                          </Badge>
                          <Badge className="text-slate-400 border-slate-600">
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
                          <p className="text-xs text-slate-400">Current Value</p>
                          <p className="font-medium text-white">
                            {position.currentValue.amount} {position.currentValue.symbol}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {position.currentValue.usdValue}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="text-xs text-slate-400">Unrealized Gain</p>
                          <p className="font-medium text-green-400">
                            +{position.unrealizedGain.amount} {position.unrealizedGain.symbol}
                          </p>
                          <p className="text-xs text-green-400">
                            {position.unrealizedGain.percentage}
                          </p>
                        </div>
                      </div>

                      {/* Second row: APY */}
                      <div className="text-left lg:contents">
                        <PositionAPYDisplay position={position} />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="lg:col-span-3 w-full lg:flex lg:items-center lg:justify-end lg:space-x-2">
                      <div className="grid grid-cols-2 gap-2 lg:flex lg:gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-500 text-white w-full lg:w-auto flex-1 lg:flex-none"
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
                          className="border-slate-600 text-slate-300 hover:bg-slate-700 w-full lg:w-auto flex-1 lg:flex-none"
                          onClick={(e) => {
                            e.stopPropagation()
                            onAction(secondaryAction, position)
                          }}
                        >
                          <Minus className="h-4 w-4 mr-1" />
                          {secondaryLabel}
                        </Button>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-purple-400 transition-colors opacity-0 group-hover:opacity-100 hidden lg:block lg:ml-2" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
