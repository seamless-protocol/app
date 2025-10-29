import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Address } from 'viem'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'
import type { APYBreakdownData } from '@/components/APYBreakdown'
import { APYBreakdownTooltip } from '@/components/APYBreakdownTooltip'
import { FAQ } from '@/components/FAQ'
import { PageContainer } from '@/components/PageContainer'
import { StatCardList } from '@/components/StatCardList'
import { AssetDisplay } from '@/components/ui/asset-display'
import { Badge } from '@/components/ui/badge'
import { BreadcrumbNavigation } from '@/components/ui/breadcrumb'
import { PriceLineChart } from '@/components/ui/price-line-chart'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { LeverageTokenDetailedMetrics } from '@/features/leverage-tokens/components/LeverageTokenDetailedMetrics'
import { LeverageTokenHoldingsCard } from '@/features/leverage-tokens/components/LeverageTokenHoldingsCard'
import { LeverageTokenMintModal } from '@/features/leverage-tokens/components/leverage-token-mint-modal'
import { LeverageTokenRedeemModal } from '@/features/leverage-tokens/components/leverage-token-redeem-modal'
import { RelatedResources } from '@/features/leverage-tokens/components/RelatedResources'
import { useLeverageTokenCollateral } from '@/features/leverage-tokens/hooks/useLeverageTokenCollateral'
import { useLeverageTokenDetailedMetrics } from '@/features/leverage-tokens/hooks/useLeverageTokenDetailedMetrics'
import { useLeverageTokenPriceComparison } from '@/features/leverage-tokens/hooks/useLeverageTokenPriceComparison'
import { useLeverageTokenState } from '@/features/leverage-tokens/hooks/useLeverageTokenState'
import { useLeverageTokenUserPosition } from '@/features/leverage-tokens/hooks/useLeverageTokenUserPosition'
import {
  getAllLeverageTokenConfigs,
  getLeverageTokenConfig,
} from '@/features/leverage-tokens/leverageTokens.config'
import { generateLeverageTokenFAQ } from '@/features/leverage-tokens/utils/faqGenerator'
import { useTokensAPY } from '@/features/portfolio/hooks/usePositionsAPY'
import { useGA } from '@/lib/config/ga4.config'
import { useExplorer } from '@/lib/hooks/useExplorer'
import { useUsdPrices } from '@/lib/prices/useUsdPrices'
import { CHAIN_IDS } from '@/lib/utils/chain-logos'
import { formatAPY, formatCurrency, formatNumber } from '@/lib/utils/formatting'

// Helper function to format numbers to show first N non-zero digits
function formatToSignificantDigits(num: number, digits: number): string {
  if (num === 0) return '0'

  const absNum = Math.abs(num)
  const sign = num < 0 ? '-' : ''

  if (absNum >= 1) {
    // For numbers >= 1, use toPrecision but avoid scientific notation
    const integerDigits = Math.floor(Math.log10(absNum)) + 1
    const decimalPlaces = Math.max(0, digits - integerDigits)
    return sign + absNum.toFixed(decimalPlaces)
  } else {
    // For numbers < 1, find the first non-zero digit position
    const firstNonZeroPosition = Math.floor(Math.log10(absNum))
    const totalDecimalPlaces = Math.abs(firstNonZeroPosition) + digits - 1
    return sign + absNum.toFixed(totalDecimalPlaces)
  }
}

export const Route = createFileRoute('/leverage-tokens/$chainId/$id')({
  component: () => {
    const { chainId: routeChainId, id: tokenAddress } = useParams({ strict: false })
    const { isConnected, address: userAddress } = useAccount()
    const navigate = useNavigate()
    const explorer = useExplorer()
    const analytics = useGA()

    // Track page view when component mounts
    useEffect(() => {
      analytics.trackPageView(
        'Leverage Token Detail',
        `/leverage-tokens/${routeChainId}/${tokenAddress}`,
      )

      // Track feature discovery for leverage token details
      analytics.featureDiscovered('leverage_token_details', 'navigation')
    }, [analytics, routeChainId, tokenAddress])
    const [selectedTimeframe, setSelectedTimeframe] = useState<'1W' | '1M' | '3M' | '6M' | '1Y'>(
      '3M',
    )
    const [isMintModalOpen, setIsMintModalOpen] = useState(false)
    const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false)
    const [visibleLines, setVisibleLines] = useState({
      weethPrice: true,
      leverageTokenPrice: true,
    })
    const [mobileApyTooltipOpen, setMobileApyTooltipOpen] = useState(false)
    const [desktopApyTooltipOpen, setDesktopApyTooltipOpen] = useState(false)

    const handleLineVisibilityChange = (lineKey: string) => {
      setVisibleLines((prev) => ({
        ...prev,
        [lineKey]: !prev[lineKey as keyof typeof prev],
      }))
    }

    // Parse chainId from route parameter
    const chainId = parseInt(routeChainId || CHAIN_IDS.BASE.toString(), 10)

    // Get leverage token config (used for decimals, addresses, etc.)
    const tokenConfig = getLeverageTokenConfig(tokenAddress as `0x${string}`, chainId)

    // Get supply cap data for the lending market section
    const { data: stateData } = useLeverageTokenState(tokenAddress as Address, chainId)
    const currentSupply = stateData?.totalSupply
      ? Number(formatUnits(stateData.totalSupply, tokenConfig?.decimals || 18))
      : 0
    const supplyCap = tokenConfig?.supplyCap || 0

    // All hooks must be called at top level before any conditional returns

    // USD price map for debt and collateral assets (guard when config is missing)
    const { data: usdPriceMap } = useUsdPrices({
      chainId,
      addresses: tokenConfig
        ? [tokenConfig.debtAsset.address, tokenConfig.collateralAsset.address]
        : [],
      enabled: Boolean(tokenConfig),
    })

    // Live user holdings (shares + USD) via on-chain state and price
    const { data: userPosData, isLoading: isUserPosLoading } = useLeverageTokenUserPosition({
      tokenAddress: tokenAddress as `0x${string}`,
      chainIdOverride: chainId,
      collateralAssetAddress: tokenConfig?.collateralAsset.address as `0x${string}` | undefined,
      collateralAssetDecimals: tokenConfig?.collateralAsset.decimals,
      debtAssetAddress: tokenConfig?.debtAsset.address as `0x${string}` | undefined,
      debtAssetDecimals: tokenConfig?.debtAsset.decimals,
      lendingAdapterAddress: tokenConfig?.lendingAdapter.address as `0x${string}` | undefined,
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

    // Total collateral amount
    const { collateral, isLoading: isCollateralLoading } = useLeverageTokenCollateral(
      tokenAddress as Address,
      chainId,
    )

    // No collateral read in this route for now

    // Pre-load APY data for all leverage tokens so navigation shares cache
    const allLeverageConfigs = getAllLeverageTokenConfigs()
    const {
      data: tokensAPYData,
      isLoading: isApyLoading,
      isError: isApyError,
    } = useTokensAPY({
      tokens: allLeverageConfigs,
      enabled: allLeverageConfigs.length > 0,
    })

    // Get APY data for this specific token
    const apyData = tokenConfig ? tokensAPYData?.get(tokenConfig.address) : undefined

    // Detailed metrics with APY data
    // Prepare borrow rate data
    const getBorrowRateData = (apyData: APYBreakdownData | undefined, isLoading: boolean) => {
      if (!apyData || !apyData.raw || isLoading) return undefined
      return {
        borrowRate: apyData.raw.rawBorrowRate,
        baseYield: apyData.raw.rawStakingYield + apyData.raw.rawRestakingYield,
      }
    }

    const borrowRateData = getBorrowRateData(apyData, isApyLoading)

    // Prepare utilization data
    const getUtilizationData = (apyData: APYBreakdownData | undefined, isLoading: boolean) => {
      if (!apyData || isLoading) return undefined
      return {
        utilization: apyData.utilization ?? 0,
      }
    }

    const utilizationData = getUtilizationData(apyData, isApyLoading)

    const {
      data: detailedMetrics,
      isLoading: isDetailedMetricsLoading,
      isError: isDetailedMetricsError,
    } = useLeverageTokenDetailedMetrics(
      tokenAddress as Address,
      {
        currentSupply,
        supplyCap,
        collateralAssetSymbol: tokenConfig?.collateralAsset.symbol || '',
      },
      borrowRateData,
      utilizationData,
    )

    if (!tokenConfig) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Token Not Found</h1>
            <p className="text-secondary-foreground">
              The requested leverage token could not be found.
            </p>
          </div>
        </div>
      )
    }

    // Generate FAQ data dynamically
    const faqData = generateLeverageTokenFAQ({
      tokenConfig,
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

    const handleMint = () => {
      setIsMintModalOpen(true)
    }

    const handleRedeem = () => {
      setIsRedeemModalOpen(true)
    }

    // Create StatCard data for key metrics (using live data where available)
    const keyMetricsCards = [
      {
        title: 'TVL',
        stat:
          collateral && tokenConfig ? (
            `${formatNumber(Number(formatUnits(collateral, tokenConfig.collateralAsset.decimals)), {
              decimals: 2,
              thousandDecimals: 2,
              millionDecimals: 2,
              billionDecimals: 2,
            })} ${tokenConfig.collateralAsset.symbol}`
          ) : isCollateralLoading ? (
            <Skeleton className="h-6 w-24" />
          ) : (
            'N/A'
          ),
        caption:
          collateral && tokenConfig ? (
            (() => {
              const collateralAmount = Number(
                formatUnits(collateral, tokenConfig.collateralAsset.decimals),
              )
              const collateralPriceUsd =
                usdPriceMap[tokenConfig.collateralAsset.address.toLowerCase()]
              const collateralUsd =
                typeof collateralPriceUsd === 'number' && Number.isFinite(collateralPriceUsd)
                  ? collateralAmount * collateralPriceUsd
                  : undefined
              return collateralUsd
                ? formatCurrency(collateralUsd, { millionDecimals: 2, thousandDecimals: 2 })
                : undefined
            })()
          ) : isCollateralLoading ? (
            <Skeleton className="h-4 w-20 mt-1" />
          ) : undefined,
      },
      {
        title: 'Target Leverage',
        stat: `${tokenConfig.leverageRatio}x`,
      },
    ]

    return (
      <PageContainer padded={false}>
        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation
          items={[
            {
              label: 'Leverage Tokens',
              onClick: () => navigate({ to: '/leverage-tokens' }),
            },
            {
              label: tokenConfig.symbol,
              isActive: true,
            },
          ]}
          onBack={() => navigate({ to: '/leverage-tokens' })}
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
              {/* Mobile Layout */}
              <div className="flex flex-col space-y-4 sm:hidden">
                {/* Token Icons and Name */}
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
                            {tokenConfig.collateralAsset.name} ({tokenConfig.collateralAsset.symbol}
                            )
                            <br />
                            <span className="text-secondary-foreground text-sm">
                              Click to view on {explorer.name}
                            </span>
                          </p>
                        }
                        onClick={() =>
                          window.open(
                            explorer.tokenUrl(tokenConfig.collateralAsset.address),
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
                            <span className="text-secondary-foreground text-sm">
                              Click to view on {explorer.name}
                            </span>
                          </p>
                        }
                        onClick={() =>
                          window.open(explorer.tokenUrl(tokenConfig.debtAsset.address), '_blank')
                        }
                      />
                    </div>
                  </div>
                  <h1 className="text-xl font-bold text-foreground leading-tight flex-1 min-w-0">
                    <span className="block truncate">{tokenConfig.name}</span>
                  </h1>
                </div>

                {/* APY Badge - Mobile */}
                <div className="flex items-center space-x-1">
                  <Badge variant="success" className="text-sm">
                    {apyData?.totalAPY ? (
                      `${formatAPY(apyData.totalAPY, 2)} APY`
                    ) : (
                      <Skeleton className="h-4 w-20" />
                    )}
                  </Badge>
                  <Tooltip open={mobileApyTooltipOpen} onOpenChange={setMobileApyTooltipOpen}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center text-[var(--text-muted)] transition-colors hover:text-secondary-foreground min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:p-0 -m-2 sm:m-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          setMobileApyTooltipOpen((prev) => !prev)
                        }}
                      >
                        <Info className="h-5 w-5 sm:h-3 sm:w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="p-0 text-sm border border-border bg-card">
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

              {/* Desktop Layout */}
              <div className="hidden sm:flex items-center space-x-3">
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
                          <span className="text-secondary-foreground text-sm">
                            Click to view on {explorer.name}
                          </span>
                        </p>
                      }
                      onClick={() =>
                        window.open(
                          explorer.tokenUrl(tokenConfig.collateralAsset.address),
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
                          <span className="text-secondary-foreground text-sm">
                            Click to view on {explorer.name}
                          </span>
                        </p>
                      }
                      onClick={() =>
                        window.open(explorer.tokenUrl(tokenConfig.debtAsset.address), '_blank')
                      }
                    />
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {tokenConfig.name}
                </h1>
                <div className="flex items-center space-x-1">
                  <Badge className="border-[color-mix(in_srgb,var(--state-success-text)_25%,transparent)] bg-[var(--state-success-bg)] text-[var(--state-success-text)]">
                    {apyData?.totalAPY ? (
                      `${formatAPY(apyData.totalAPY, 2)} APY`
                    ) : (
                      <Skeleton className="h-4 w-20" />
                    )}
                  </Badge>
                  <Tooltip open={desktopApyTooltipOpen} onOpenChange={setDesktopApyTooltipOpen}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center text-[var(--text-muted)] hover:text-secondary-foreground transition-colors min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:p-0 -m-2 sm:m-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDesktopApyTooltipOpen((prev) => !prev)
                        }}
                      >
                        <Info className="h-5 w-5 sm:h-3 sm:w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="p-0 text-sm bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] border border-[var(--divider-line)]">
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

              {/* Description */}
              <p className="text-secondary-foreground leading-relaxed text-sm sm:text-base">
                {tokenConfig.description}
              </p>
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
                isLoading={isUserPosLoading}
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
                <div className="rounded-lg p-8 border border-border bg-card">
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-64 w-full" />
                    <div className="flex justify-center space-x-2">
                      <Skeleton className="h-8 w-12" />
                      <Skeleton className="h-8 w-12" />
                      <Skeleton className="h-8 w-12" />
                      <Skeleton className="h-8 w-12" />
                    </div>
                  </div>
                </div>
              ) : priceDataError ? (
                <div className="rounded-lg p-8 text-center border border-border bg-card">
                  <p className="mb-2 text-[var(--state-error-text)]">Failed to load price data</p>
                  <p className="text-sm text-secondary-foreground">{priceDataError.message}</p>
                </div>
              ) : !priceHistoryData || priceHistoryData.length === 0 ? (
                <div className="rounded-lg p-8 text-center border border-border bg-card">
                  <p className="text-secondary-foreground">No price data available</p>
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
                      color: 'var(--chart-2)',
                    },
                    {
                      key: 'leverageTokenPrice',
                      name: 'Leverage Token Price',
                      dataKey: 'leverageTokenPrice',
                      color: 'var(--chart-1)',
                    },
                  ]}
                  visibleLines={visibleLines}
                  onLineVisibilityChange={handleLineVisibilityChange}
                  title="Price History"
                  height={320}
                  className="border border-border bg-card"
                  yAxisFormatter={(value: number) => {
                    const formatted = formatToSignificantDigits(value, 4)
                    return formatted
                  }}
                  tooltipFormatter={(value: number | string, name?: string) => {
                    const numValue = Number(value)
                    const formatted = formatToSignificantDigits(numValue, 8)
                    return [
                      `${formatted} ${tokenConfig?.debtAsset?.symbol || 'ETH'}`,
                      name || 'Price',
                    ]
                  }}
                  yAxisLabel={`Price (${tokenConfig?.debtAsset?.symbol || 'ETH'})`}
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
              isLoading={isUserPosLoading}
              onMint={handleMint}
              onRedeem={handleRedeem}
            />
          </motion.div>
        </div>

        {/* Mint Modal */}
        <LeverageTokenMintModal
          isOpen={isMintModalOpen}
          onClose={() => setIsMintModalOpen(false)}
          leverageTokenAddress={tokenAddress as Address}
          {...(userAddress && { userAddress })}
        />

        {/* Redeem Modal */}
        <LeverageTokenRedeemModal
          isOpen={isRedeemModalOpen}
          onClose={() => setIsRedeemModalOpen(false)}
          leverageTokenAddress={tokenAddress as Address}
          {...(userAddress && { userAddress })}
        />
      </PageContainer>
    )
  },
})
