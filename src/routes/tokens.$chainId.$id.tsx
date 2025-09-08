import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { useState } from 'react'
import type { Address } from 'viem'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import { APYBreakdownTooltip } from '@/components/APYBreakdownTooltip'
import { FAQ } from '@/components/FAQ'
import { StatCardList } from '@/components/StatCardList'
import { AssetDisplay } from '@/components/ui/asset-display'
import { Badge } from '@/components/ui/badge'
import { BreadcrumbNavigation } from '@/components/ui/breadcrumb'
import { PriceLineChart } from '@/components/ui/price-line-chart'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { LeverageTokenDetailedMetrics } from '@/features/leverage-tokens/components/LeverageTokenDetailedMetrics'
import { LeverageTokenHoldingsCard } from '@/features/leverage-tokens/components/LeverageTokenHoldingsCard'
import { RelatedResources } from '@/features/leverage-tokens/components/RelatedResources'
// no mock imports; route uses live data
import { useLeverageTokenAPY } from '@/features/leverage-tokens/hooks/useLeverageTokenAPY'
import { useLeverageTokenDetailedMetrics } from '@/features/leverage-tokens/hooks/useLeverageTokenDetailedMetrics'
import { useLeverageTokenPriceComparison } from '@/features/leverage-tokens/hooks/useLeverageTokenPriceComparison'
import { useLeverageTokenState } from '@/features/leverage-tokens/hooks/useLeverageTokenState'
import { useLeverageTokenUserPosition } from '@/features/leverage-tokens/hooks/useLeverageTokenUserPosition'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { generateLeverageTokenFAQ } from '@/features/leverage-tokens/utils/faqGenerator'
import { useUsdPrices } from '@/lib/prices/useUsdPrices'
import { getTokenExplorerInfo } from '@/lib/utils/block-explorer'
import { formatAPY, formatCurrency, formatNumber } from '@/lib/utils/formatting'

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

    // Get leverage token config (used for decimals, addresses, etc.)
    const tokenConfig = getLeverageTokenConfig(tokenAddress as `0x${string}`)

    // All hooks must be called at top level before any conditional returns
    const {
      data: detailedMetrics,
      isLoading: isDetailedMetricsLoading,
      isError: isDetailedMetricsError,
    } = useLeverageTokenDetailedMetrics(tokenAddress as Address)

    // Live on-chain state for TVL (equity) in debt asset units
    const { data: stateData, isLoading: isStateLoading } = useLeverageTokenState(
      tokenAddress as Address,
      chainId,
    )

    // USD price map for debt and collateral assets (guard when config is missing)
    const { data: usdPriceMap, isLoading: isUsdLoading } = useUsdPrices({
      chainId,
      addresses: tokenConfig
        ? [tokenConfig.debtAsset.address, tokenConfig.collateralAsset.address]
        : [],
      enabled: Boolean(tokenConfig),
    })

    // Live user holdings (shares + USD) via on-chain state and price
    const { data: userPosData } = useLeverageTokenUserPosition({
      tokenAddress: tokenAddress as `0x${string}`,
      chainIdOverride: chainId,
      debtAssetAddress: tokenConfig?.debtAsset.address as `0x${string}` | undefined,
      debtAssetDecimals: tokenConfig?.debtAsset.decimals,
    })

    const {
      data: priceHistoryData,
      isLoading: isPriceDataLoading,
      error: priceDataError,
    } = useLeverageTokenPriceComparison({
      tokenAddress: tokenAddress as Address,
      chainId,
      timeframe: selectedTimeframe,
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
    // No collateral read in this route for now

    // Pre-load APY data for the tooltip
    const {
      data: apyData,
      isLoading: isApyLoading,
      isError: isApyError,
    } = useLeverageTokenAPY({
      tokenAddress: tokenAddress as Address,
      ...(tokenConfig && { leverageToken: tokenConfig }),
      enabled: !!tokenConfig, // Only enable if we have a valid config
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

    const userShares = userPosData?.balance
    const hasPosition = Boolean(userShares && userShares > 0n)

    const userSharesFormatted =
      typeof userShares === 'bigint'
        ? formatNumber(Number(formatUnits(userShares, tokenConfig.decimals)), {
            decimals: 2,
            thousandDecimals: 2,
          })
        : '0.00'

    const userEquityUsd = userPosData?.equityUsd
    const userEquityUsdFormatted =
      typeof userEquityUsd === 'number' && Number.isFinite(userEquityUsd)
        ? formatCurrency(userEquityUsd, { decimals: 2, thousandDecimals: 2 })
        : `~${formatCurrency(0, { decimals: 2, thousandDecimals: 2 })}`

    // No mock token; APY hook is wired to config
    const handleMint = () => {
      // TODO: Implement mint modal/functionality
      console.log('Mint clicked')
    }

    const handleRedeem = () => {
      // TODO: Implement redeem modal/functionality
      console.log('Redeem clicked')
    }

    // Create StatCard data for key metrics (using live data where available)
    const keyMetricsCards = [
      {
        title: 'TVL',
        stat: isStateLoading ? (
          <Skeleton className="h-6 w-36" />
        ) : typeof tvlDebtUnits === 'number' && Number.isFinite(tvlDebtUnits) ? (
          `${formatNumber(tvlDebtUnits, { decimals: 2, thousandDecimals: 2, millionDecimals: 2, billionDecimals: 2 })} ${tokenConfig.debtAsset.symbol}`
        ) : (
          '—'
        ),
        caption:
          isStateLoading || (typeof tvlDebtUnits === 'number' && isUsdLoading) ? (
            <Skeleton className="h-4 w-24 mt-1" />
          ) : typeof tvlUsd === 'number' && Number.isFinite(tvlUsd) ? (
            `${formatCurrency(tvlUsd, { millionDecimals: 2, thousandDecimals: 2 })}`
          ) : undefined,
      },
      {
        title: 'Total APY',
        stat: apyData?.totalAPY ? formatAPY(apyData.totalAPY, 2) : 'Loading...',
        caption: apyData?.totalAPY ? 'Including rewards & leverage' : undefined,
      },
      {
        title: 'Target Leverage',
        stat: `${tokenConfig.leverageRatio}x`,
        caption: `Max leverage ratio`,
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
                    {apyData?.totalAPY ? `${formatAPY(apyData.totalAPY, 2)} APY` : 'Loading...'}
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
                      <APYBreakdownTooltip
                        token={tokenConfig}
                        {...(apyData && { apyData })}
                        isLoading={isApyLoading ?? false}
                        isError={isApyError ?? false}
                        compact
                      />
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
                  hasPosition,
                  balance: userSharesFormatted,
                  balanceUSD: userEquityUsdFormatted,
                  shareToken: tokenConfig.symbol,
                  isConnected,
                }}
                collateralAsset={tokenConfig.collateralAsset}
                debtAsset={tokenConfig.debtAsset}
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

            {/* Related Resources - Only show if there are resources */}
            {tokenConfig.relatedResources &&
              (tokenConfig.relatedResources.underlyingPlatforms.length > 0 ||
                tokenConfig.relatedResources.additionalRewards.length > 0) && (
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
              )}

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
                hasPosition,
                balance: userSharesFormatted,
                balanceUSD: userEquityUsdFormatted,
                shareToken: tokenConfig.symbol,
                isConnected,
              }}
              collateralAsset={tokenConfig.collateralAsset}
              debtAsset={tokenConfig.debtAsset}
              onMint={handleMint}
              onRedeem={handleRedeem}
            />
          </motion.div>
        </div>
      </div>
    )
  },
})
