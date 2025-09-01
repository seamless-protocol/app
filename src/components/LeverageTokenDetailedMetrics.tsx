import { ChevronUp } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader } from './ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

interface LeverageSettings {
  targetLeverage: number
  minMaxLeverage: {
    min: number
    max: number
  }
}

interface Fees {
  mintTokenFee: number
  redeemTokenFee: number
}

interface AuctionParameters {
  dutchAuctionDuration: string
  initialPriceMultiplier: number
  minPriceMultiplier: number
}

interface RiskManagement {
  preLiquidationLeverage: number
  rebalanceReward: number
}

interface LeverageTokenDetailedMetricsProps {
  leverageSettings: LeverageSettings
  fees: Fees
  auctionParameters: AuctionParameters
  riskManagement: RiskManagement
  className?: string
}

export function LeverageTokenDetailedMetrics({
  leverageSettings,
  fees,
  auctionParameters,
  riskManagement,
  className,
}: LeverageTokenDetailedMetricsProps) {
  return (
    <Card className={className}>
      <Accordion type="single" collapsible defaultValue="details">
        <AccordionItem value="details" className="border-none">
          <CardHeader className="cursor-pointer hover:bg-slate-800/30 transition-colors rounded-t-lg">
            <AccordionTrigger className="p-0 hover:no-underline">
              <div className="flex items-center justify-between w-full">
                <div className="space-y-2">
                  <h4 className="leading-none text-white">Detailed Metrics</h4>
                  <p className="text-slate-400 text-sm">
                    Comprehensive leverage token parameters and settings
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    Hide Details
                  </Badge>
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </AccordionTrigger>
          </CardHeader>
          <AccordionContent>
            <CardContent className="space-y-6 pt-0">
              {/* Leverage Settings */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <h3 className="text-white font-medium text-sm uppercase tracking-wide">
                    Leverage Settings
                  </h3>
                  <div className="flex-1 h-px bg-slate-700"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border transition-colors bg-slate-800/50 border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <Tooltip>
                        <TooltipTrigger>
                          <button
                            type="button"
                            className="flex items-center space-x-1 cursor-help text-slate-400 text-sm hover:text-slate-300 transition-colors"
                          >
                            <span>Target Leverage</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The target leverage ratio for this token</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-lg font-semibold text-white">
                      {leverageSettings.targetLeverage.toFixed(2)}x
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border transition-colors bg-slate-800/50 border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <Tooltip>
                        <TooltipTrigger>
                          <button
                            type="button"
                            className="flex items-center space-x-1 cursor-help text-slate-400 text-sm hover:text-slate-300 transition-colors"
                          >
                            <span>Min - Max Leverage</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The acceptable range for leverage ratio</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-lg font-semibold text-white">
                      {leverageSettings.minMaxLeverage.min.toFixed(2)}x -{' '}
                      {leverageSettings.minMaxLeverage.max.toFixed(2)}x
                    </p>
                  </div>
                </div>
              </div>

              {/* Fees */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <h3 className="text-white font-medium text-sm uppercase tracking-wide">Fees</h3>
                  <div className="flex-1 h-px bg-slate-700"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border transition-colors bg-slate-800/70 border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                      <Tooltip>
                        <TooltipTrigger>
                          <button
                            type="button"
                            className="flex items-center space-x-1 cursor-help text-slate-400 text-sm hover:text-slate-300 transition-colors"
                          >
                            <span>Mint Token Fee</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Fee charged when minting new tokens</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-lg font-semibold text-green-400">
                      {fees.mintTokenFee.toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border transition-colors bg-slate-800/50 border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <Tooltip>
                        <TooltipTrigger>
                          <button
                            type="button"
                            className="flex items-center space-x-1 cursor-help text-slate-400 text-sm hover:text-slate-300 transition-colors"
                          >
                            <span>Redeem Token Fee</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Fee charged when redeeming tokens</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-lg font-semibold text-white">
                      {fees.redeemTokenFee.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Auction Parameters */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <h3 className="text-white font-medium text-sm uppercase tracking-wide">
                    Auction Parameters
                  </h3>
                  <div className="flex-1 h-px bg-slate-700"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border transition-colors bg-slate-800/50 border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <Tooltip>
                        <TooltipTrigger>
                          <button
                            type="button"
                            className="flex items-center space-x-1 cursor-help text-slate-400 text-sm hover:text-slate-300 transition-colors"
                          >
                            <span>Dutch Auction Duration</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Duration of the Dutch auction process</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-lg font-semibold text-white">
                      {auctionParameters.dutchAuctionDuration}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border transition-colors bg-slate-800/50 border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <Tooltip>
                        <TooltipTrigger>
                          <button
                            type="button"
                            className="flex items-center space-x-1 cursor-help text-slate-400 text-sm hover:text-slate-300 transition-colors"
                          >
                            <span>Initial Price Multiplier</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Starting price multiplier for auctions</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-lg font-semibold text-white">
                      {auctionParameters.initialPriceMultiplier.toFixed(2)}x
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border transition-colors bg-slate-800/50 border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <Tooltip>
                        <TooltipTrigger>
                          <button
                            type="button"
                            className="flex items-center space-x-1 cursor-help text-slate-400 text-sm hover:text-slate-300 transition-colors"
                          >
                            <span>Min Price Multiplier</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Minimum price multiplier for auctions</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-lg font-semibold text-white">
                      {auctionParameters.minPriceMultiplier.toFixed(2)}x
                    </p>
                  </div>
                </div>
              </div>

              {/* Risk Management */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <h3 className="text-white font-medium text-sm uppercase tracking-wide">
                    Risk Management
                  </h3>
                  <div className="flex-1 h-px bg-slate-700"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border transition-colors bg-slate-800/50 border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <Tooltip>
                        <TooltipTrigger>
                          <button
                            type="button"
                            className="flex items-center space-x-1 cursor-help text-slate-400 text-sm hover:text-slate-300 transition-colors"
                          >
                            <span>Pre-liquidation Leverage</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Leverage threshold before liquidation</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-lg font-semibold text-white">
                      {riskManagement.preLiquidationLeverage.toFixed(2)}x
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border transition-colors bg-slate-800/50 border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <Tooltip>
                        <TooltipTrigger>
                          <button
                            type="button"
                            className="flex items-center space-x-1 cursor-help text-slate-400 text-sm hover:text-slate-300 transition-colors"
                          >
                            <span>Rebalance Reward</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Reward for successful rebalancing</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-lg font-semibold text-white">
                      {riskManagement.rebalanceReward.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  )
}
