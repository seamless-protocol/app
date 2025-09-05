import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { useState } from 'react'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { APYBreakdown } from '@/components/APYBreakdown'
import { FAQ } from '@/components/FAQ'
import { StatCardList } from '@/components/StatCardList'
import { AssetDisplay } from '@/components/ui/asset-display'
import { Badge } from '@/components/ui/badge'
import { BreadcrumbNavigation } from '@/components/ui/breadcrumb'
import { PriceLineChart } from '@/components/ui/price-line-chart'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { LeverageTokenDetailedMetrics } from '@/features/leverage-tokens/components/LeverageTokenDetailedMetrics'
import { LeverageTokenHoldingsCard } from '@/features/leverage-tokens/components/LeverageTokenHoldingsCard'
import { RelatedResources } from '@/features/leverage-tokens/components/RelatedResources'
import {
  createMockUserPosition,
  mockAPY,
  mockKeyMetrics,
  mockSupply,
} from '@/features/leverage-tokens/data/mockData'
import { useLeverageTokenDetailedMetrics } from '@/features/leverage-tokens/hooks/useLeverageTokenDetailedMetrics'
import { useLeverageTokenPriceComparison } from '@/features/leverage-tokens/hooks/useLeverageTokenPriceComparison'
import { useLeverageTokenState } from '@/features/leverage-tokens/hooks/useLeverageTokenState'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { generateLeverageTokenFAQ } from '@/features/leverage-tokens/utils/faqGenerator'
import { useUsdPrices } from '@/lib/prices/useUsdPrices'
import { calculateAPYBreakdown } from '@/lib/utils/apy-calculations'
import { getTokenExplorerInfo } from '@/lib/utils/block-explorer'
import { formatCurrency, formatNumber } from '@/lib/utils/formatting'

export const Route = createFileRoute('/tokens/$chainId/$id')({
  component: () => {
    const { chainId: routeChainId, id: tokenAddress } = useParams({ strict: false })
    const { isConnected } = useAccount()
    const navigate = useNavigate()
    const [selectedTimeframe, setSelectedTimeframe] = useState<'1W' | '1M' | '3M' | '6M' | '1Y'>(
      '3M',
    )

    // Parse chainId from route parameter
    const chainId = parseInt(routeChainId || '8453', 10) // Default to Base if not provided

    // Use live data for detailed metrics (hooks must be called at top level)
    const {
      data: detailedMetrics,
      isLoading: isDetailedMetricsLoading,
      isError: isDetailedMetricsError,
    } = useLeverageTokenDetailedMetrics(tokenAddress as `0x${string}`)

    // Get leverage token config (used for decimals, addresses, etc.)
    const tokenConfig = getLeverageTokenConfig(tokenAddress as `0x${string}`)

    // Live on-chain state for TVL (equity) in debt asset units
    const { data: stateData } = useLeverageTokenState(tokenAddress as `0x${string}`, chainId)

    // USD price for debt asset (guard when config is missing)
    const { data: usdPriceMap } = useUsdPrices({
      chainId,
      addresses: tokenConfig ? [tokenConfig.debtAsset.address] : [],
      enabled: Boolean(tokenConfig),
    })

    const tvlDebtUnits =
      stateData && tokenConfig
        ? Number(formatUnits(stateData.equity, tokenConfig.debtAsset.decimals))
        : undefined
    const debtPriceUsd = tokenConfig
      ? usdPriceMap[tokenConfig.debtAsset.address.toLowerCase()]
      : undefined
    const tvlUsd =
      typeof tvlDebtUnits === 'number' &&
      Number.isFinite(tvlDebtUnits) &&
      typeof debtPriceUsd === 'number' &&
      Number.isFinite(debtPriceUsd)
        ? tvlDebtUnits * debtPriceUsd
        : undefined

    const {
      data: priceHistoryData,
      isLoading: isPriceDataLoading,
      error: priceDataError,
    } = useLeverageTokenPriceComparison({
      tokenAddress: tokenAddress as `0x${string}`,
      chainId,
      timeframe: selectedTimeframe,
    })

    if (!tokenConfig) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Token Not Found</h1>
            <p className="text-slate-400">The requested leverage token could not be found.</p>
          </div>
        </div>
      )
    }

    // Generate FAQ data dynamically
    const faqData = generateLeverageTokenFAQ({
      leverageRatio: tokenConfig.leverageRatio,
      collateralSymbol: tokenConfig.collateralAsset.symbol,
      debtSymbol: tokenConfig.debtAsset.symbol,
    })

    // Mock user position data (this would come from a hook in real implementation)
    const userPosition = createMockUserPosition(tokenConfig.symbol)

    // Create mock token data for APY breakdown calculation
    const mockTokenForAPY = {
      id: tokenConfig.address,
      name: tokenConfig.name,
      collateralAsset: tokenConfig.collateralAsset,
      debtAsset: tokenConfig.debtAsset,
      tvl: mockKeyMetrics.tvl,
      apy: mockAPY.total,
      leverage: tokenConfig.leverageRatio,
      supplyCap: mockSupply.supplyCap,
      currentSupply: mockSupply.currentSupply,
      chainId: tokenConfig.chainId,
      chainName: tokenConfig.chainName,
      chainLogo: tokenConfig.chainLogo,
      baseYield: mockAPY.baseYield,
      borrowRate: mockAPY.borrowRate,
      rewardMultiplier: mockAPY.rewardMultiplier || 1.5,
    }

    const handleMint = () => {
      // TODO: Implement mint modal/functionality
      console.log('Mint clicked')
    }

    const handleRedeem = () => {
      // TODO: Implement redeem modal/functionality
      console.log('Redeem clicked')
    }

    // Create StatCard data for key metrics (TVL uses live state + USD approximation)
    const keyMetricsCards = [
      {
        title: 'TVL',
        stat:
          typeof tvlDebtUnits === 'number' && Number.isFinite(tvlDebtUnits)
            ? `${formatNumber(tvlDebtUnits, { decimals: 2, thousandDecimals: 2, millionDecimals: 2, billionDecimals: 2 })} ${tokenConfig.debtAsset.symbol}`
            : '—',
        caption:
          typeof tvlUsd === 'number' && Number.isFinite(tvlUsd)
            ? `${formatCurrency(tvlUsd, { millionDecimals: 2, thousandDecimals: 2 })}`
            : undefined,
      },
      {
        title: 'Total Collateral',
        stat: `${formatNumber(mockKeyMetrics.totalCollateral.amount, { thousandDecimals: 2 })} ${tokenConfig.collateralAsset.symbol}`,
        caption: `~${formatCurrency(mockKeyMetrics.totalCollateral.amountUSD, { millionDecimals: 2, thousandDecimals: 0 })}`,
      },
      {
        title: 'Target Leverage',
        stat: `${tokenConfig.leverageRatio}x`,
        caption: `Current: ${mockKeyMetrics.targetLeverage.current}x`,
      },
    ]

    return (
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation
          items={[
            {
              label: 'Leverage Tokens',
              onClick: () => navigate({ to: '/tokens' }),
            },
            {
              label: tokenConfig.name,
              isActive: true,
            },
          ]}
          onBack={() => navigate({ to: '/tokens' })}
        />

        {/* Two-Column Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-2 space-y-6">
            {/* Page Header */}
            <motion.div
              className="space-y-4 pb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="flex items-center space-x-3">
                <div className="flex -space-x-1">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
                    style={{ zIndex: 2 }}
                  >
                    <AssetDisplay
                      asset={tokenConfig.collateralAsset}
                      size="lg"
                      variant="logo-only"
                      tooltipContent={
                        <p className="font-medium">
                          {tokenConfig.collateralAsset.name} ({tokenConfig.collateralAsset.symbol})
                          <br />
                          <span className="text-slate-400 text-sm">
                            Click to view on{' '}
                            {
                              getTokenExplorerInfo(
                                tokenConfig.chainId,
                                tokenConfig.collateralAsset.address,
                              ).name
                            }
                          </span>
                        </p>
                      }
                      onClick={() =>
                        window.open(
                          getTokenExplorerInfo(
                            tokenConfig.chainId,
                            tokenConfig.collateralAsset.address,
                          ).url,
                          '_blank',
                        )
                      }
                    />
                  </div>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
                    style={{ zIndex: 1 }}
                  >
                    <AssetDisplay
                      asset={tokenConfig.debtAsset}
                      size="lg"
                      variant="logo-only"
                      tooltipContent={
                        <p className="font-medium">
                          {tokenConfig.debtAsset.name} ({tokenConfig.debtAsset.symbol})
                          <br />
                          <span className="text-slate-400 text-sm">
                            Click to view on{' '}
                            {
                              getTokenExplorerInfo(
                                tokenConfig.chainId,
                                tokenConfig.debtAsset.address,
                              ).name
                            }
                          </span>
                        </p>
                      }
                      onClick={() =>
                        window.open(
                          getTokenExplorerInfo(tokenConfig.chainId, tokenConfig.debtAsset.address)
                            .url,
                          '_blank',
                        )
                      }
                    />
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{tokenConfig.name}</h1>
                <div className="flex items-center space-x-1">
                  <Badge className="bg-green-500/10 text-green-400 border-green-400/20">
                    {mockAPY.total.toFixed(1)}% APY
                  </Badge>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-slate-300 transition-colors"
                      >
                        <Info className="h-3 w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="p-0 bg-slate-800 border-slate-700 text-sm">
                      <APYBreakdown data={calculateAPYBreakdown(mockTokenForAPY)} compact />
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed">{tokenConfig.description}</p>
            </motion.div>

            {/* Current Holdings - Mobile Only */}
            <motion.div
              className="xl:hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <LeverageTokenHoldingsCard
                userPosition={{
                  ...userPosition,
                  isConnected,
                }}
                onMint={handleMint}
                onRedeem={handleRedeem}
              />
            </motion.div>

            {/* Key Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <StatCardList cards={keyMetricsCards} maxColumns={3} />
            </motion.div>

            {/* Price History Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              {isPriceDataLoading ? (
                <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-slate-400">Loading price data...</p>
                </div>
              ) : priceDataError ? (
                <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-8 text-center">
                  <p className="text-red-400 mb-2">Failed to load price data</p>
                  <p className="text-slate-400 text-sm">{priceDataError.message}</p>
                </div>
              ) : !priceHistoryData || priceHistoryData.length === 0 ? (
                <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-8 text-center">
                  <p className="text-slate-400">No price data available</p>
                </div>
              ) : (
                <PriceLineChart
                  data={priceHistoryData}
                  selectedTimeframe={selectedTimeframe}
                  onTimeframeChange={(timeframe) =>
                    setSelectedTimeframe(timeframe as typeof selectedTimeframe)
                  }
                  timeframes={['1W', '1M', '3M', '6M', '1Y']}
                  chartType="comparison"
                  chartLines={[
                    {
                      key: 'weethPrice',
                      name: `${tokenConfig.collateralAsset.symbol} Price`,
                      dataKey: 'weethPrice',
                      color: '#10B981',
                    },
                    {
                      key: 'leverageTokenPrice',
                      name: 'Leverage Token Price',
                      dataKey: 'leverageTokenPrice',
                      color: '#8B5CF6',
                    },
                  ]}
                  visibleLines={{
                    weethPrice: true,
                    leverageTokenPrice: true,
                  }}
                  title="Price History"
                  subtitle={`Compare leverage token performance vs ${tokenConfig.collateralAsset.symbol}`}
                  height={320}
                  className="bg-slate-900/80 border border-slate-700"
                />
              )}
            </motion.div>

            {/* Detailed Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <LeverageTokenDetailedMetrics
                metrics={detailedMetrics}
                title="Token Details & Risk Parameters"
                description="Comprehensive leverage token parameters and settings"
                defaultOpen={false}
                isLoading={isDetailedMetricsLoading}
                isError={isDetailedMetricsError}
              />
            </motion.div>

            {/* Related Resources */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <RelatedResources
                underlyingPlatforms={tokenConfig.relatedResources.underlyingPlatforms}
                additionalRewards={tokenConfig.relatedResources.additionalRewards}
              />
            </motion.div>

            {/* FAQ Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <FAQ items={faqData} />
            </motion.div>
          </div>

          {/* Right Column - Current Holdings (Desktop Only) */}
          <motion.div
            className="hidden xl:block xl:col-span-1 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <LeverageTokenHoldingsCard
              userPosition={{
                ...userPosition,
                isConnected,
              }}
              onMint={handleMint}
              onRedeem={handleRedeem}
            />
          </motion.div>
        </div>
      </div>
    )
  },
})
