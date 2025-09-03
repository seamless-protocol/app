import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useAccount } from 'wagmi'
import { FAQ } from '@/components/FAQ'
import { StatCardList } from '@/components/StatCardList'
import { AssetDisplay } from '@/components/ui/asset-display'
import { Badge } from '@/components/ui/badge'
import { BreadcrumbNavigation } from '@/components/ui/breadcrumb'
import { PriceLineChart } from '@/components/ui/price-line-chart'
import { LeverageTokenDetailedMetrics } from '@/features/leverage-tokens/components/LeverageTokenDetailedMetrics'
import { LeverageTokenHoldingsCard } from '@/features/leverage-tokens/components/LeverageTokenHoldingsCard'
import { RelatedResources } from '@/features/leverage-tokens/components/RelatedResources'
import { useLeverageTokenPriceComparison } from '@/features/leverage-tokens/hooks/useLeverageTokenPriceComparison'
import { leverageTokenPageData } from '@/features/leverage-tokens/data/mockData'
import { getTokenExplorerInfo } from '@/lib/utils/block-explorer'
import { formatCurrency, formatNumber } from '@/lib/utils/formatting'

export const Route = createFileRoute('/tokens/$chainId/$id')({
  component: () => {
    const { chainId: routeChainId, id: tokenAddress } = useParams({ strict: false })
    const { isConnected } = useAccount()
    const navigate = useNavigate()
    const [selectedTimeframe, setSelectedTimeframe] = useState<'1W' | '1M' | '3M' | '6M' | '1Y'>(
      '1W',
    )

    // Parse chainId from route parameter
    const chainId = parseInt(routeChainId || '8453', 10) // Default to Base if not provided

    // Use the comprehensive mock data
    const tokenData = leverageTokenPageData
    const { token, userPosition, detailedMetrics, relatedResources, faqData } = tokenData

    const {
      data: priceHistoryData,
      isLoading: isPriceDataLoading,
      error: priceDataError,
    } = useLeverageTokenPriceComparison({
      tokenAddress: tokenAddress as `0x${string}`,
      chainId,
      timeframe: selectedTimeframe,
    })

    const handleMint = () => {
      // TODO: Implement mint modal/functionality
      console.log('Mint clicked')
    }

    const handleRedeem = () => {
      // TODO: Implement redeem modal/functionality
      console.log('Redeem clicked')
    }

    const handleConnectWallet = () => {
      // TODO: Implement wallet connection
      console.log('Connect wallet clicked')
    }

    // Create StatCard data for key metrics
    const keyMetricsCards = [
      {
        title: 'TVL',
        stat: formatCurrency(tokenData.keyMetrics.tvl, { millionDecimals: 2, thousandDecimals: 0 }),
      },
      {
        title: 'Total Collateral',
        stat: `${formatNumber(tokenData.keyMetrics.totalCollateral.amount, { thousandDecimals: 2 })} weETH`,
        caption: `~${formatCurrency(tokenData.keyMetrics.totalCollateral.amountUSD, { millionDecimals: 2, thousandDecimals: 0 })}`,
      },
      {
        title: 'Target Leverage',
        stat: `${tokenData.keyMetrics.targetLeverage.target}x`,
        caption: `Current: ${tokenData.keyMetrics.targetLeverage.current}x`,
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
              label: token.name,
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
                      asset={token.collateralAsset}
                      size="lg"
                      variant="logo-only"
                      tooltipContent={
                        <p className="font-medium">
                          {token.collateralAsset.name} ({token.collateralAsset.symbol})
                          <br />
                          <span className="text-slate-400 text-sm">
                            Click to view on{' '}
                            {
                              getTokenExplorerInfo(token.chainId, token.collateralAsset.address)
                                .name
                            }
                          </span>
                        </p>
                      }
                      onClick={() =>
                        window.open(
                          getTokenExplorerInfo(token.chainId, token.collateralAsset.address).url,
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
                      asset={token.debtAsset}
                      size="lg"
                      variant="logo-only"
                      tooltipContent={
                        <p className="font-medium">
                          {token.debtAsset.name} ({token.debtAsset.symbol})
                          <br />
                          <span className="text-slate-400 text-sm">
                            Click to view on{' '}
                            {getTokenExplorerInfo(token.chainId, token.debtAsset.address).name}
                          </span>
                        </p>
                      }
                      onClick={() =>
                        window.open(
                          getTokenExplorerInfo(token.chainId, token.debtAsset.address).url,
                          '_blank',
                        )
                      }
                    />
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{token.name}</h1>
                <Badge className="bg-green-500/10 text-green-400 border-green-400/20 cursor-help flex items-center gap-1">
                  {tokenData.apy.total.toFixed(1)}% APY
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3 h-3"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                  </svg>
                </Badge>
              </div>
              <p className="text-slate-400 leading-relaxed">{token.description}</p>
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
                onConnectWallet={handleConnectWallet}
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
                      name: `${token.collateralAsset.symbol} Price`,
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
                  subtitle={`Compare leverage token performance vs ${token.collateralAsset.symbol}`}
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
              />
            </motion.div>

            {/* Related Resources */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <RelatedResources
                underlyingPlatforms={relatedResources.underlyingPlatforms}
                additionalRewards={relatedResources.additionalRewards}
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
              onConnectWallet={handleConnectWallet}
            />
          </motion.div>
        </div>
      </div>
    )
  },
})
