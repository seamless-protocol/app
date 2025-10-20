import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { DollarSign, Target, TrendingUp } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import type { Address } from 'viem'
import { useAccount } from 'wagmi'
import { ConnectionStatusCard } from '@/components/ConnectionStatusCard'
import { PageContainer } from '@/components/PageContainer'
import { StatCardList } from '@/components/StatCardList'
import { Skeleton } from '@/components/ui/skeleton'
import { LeverageTokenMintModal } from '@/features/leverage-tokens/components/leverage-token-mint-modal'
import { LeverageTokenRedeemModal } from '@/features/leverage-tokens/components/leverage-token-redeem-modal'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import type { Position } from '@/features/portfolio/components/active-positions'
import { ActivePositions } from '@/features/portfolio/components/active-positions'
import { AvailableRewards } from '@/features/portfolio/components/available-rewards'
import { MorphoVaultsInfoCard } from '@/features/portfolio/components/morpho-vaults-info-card'
import { PortfolioPerformanceChart } from '@/features/portfolio/components/portfolio-performance-chart'
import { SEAMStaking } from '@/features/portfolio/components/seam-staking'
import {
  usePortfolioPerformance,
  usePortfolioWithTotalValue,
} from '@/features/portfolio/hooks/usePortfolioDataFetcher'
import { usePortfolioRewards } from '@/features/portfolio/hooks/usePortfolioRewards'
import { usePortfolioStaking } from '@/features/portfolio/hooks/usePortfolioStaking'
import { features } from '@/lib/config/features'
import { useGA } from '@/lib/config/ga4.config'
import { formatNumber } from '@/lib/utils/formatting'

export const Route = createFileRoute('/portfolio')({ component: PortfolioPage })

function PortfolioPage() {
  const { isConnected, address: userAddress } = useAccount()
  const navigate = useNavigate()
  const analytics = useGA()

  // Track page view when component mounts
  useEffect(() => {
    analytics.trackPageView('Portfolio', '/portfolio')
  }, [analytics])

  // Modal state
  const [isMintModalOpen, setIsMintModalOpen] = useState(false)
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)

  // Direct hook calls - matching leverage tokens pattern
  const {
    data: portfolioData,
    isLoading: portfolioLoading,
    isError: portfolioError,
    positionsAPYLoading,
  } = usePortfolioWithTotalValue()
  const performanceData = usePortfolioPerformance()
  const { data: rewardsData, isLoading: rewardsLoading } = usePortfolioRewards()

  // Calculate total SEAM and MORPHO tokens from rewards (claimable now)
  const seamRewards = rewardsData?.claimableRewards?.filter((r) => r.tokenSymbol === 'SEAM') || []
  const morphoRewards =
    rewardsData?.claimableRewards?.filter((r) => r.tokenSymbol === 'MORPHO') || []

  const totalSeamTokens = seamRewards.reduce((total, reward) => {
    const rawAmount = BigInt(reward.claimableAmount)
    const decimals = reward.tokenDecimals
    const divisor = BigInt(10 ** decimals)
    const humanReadableAmount = Number(rawAmount) / Number(divisor)
    return total + humanReadableAmount
  }, 0)

  const totalMorphoTokens = morphoRewards.reduce((total, reward) => {
    const rawAmount = BigInt(reward.claimableAmount)
    const decimals = reward.tokenDecimals
    const divisor = BigInt(10 ** decimals)
    const humanReadableAmount = Number(rawAmount) / Number(divisor)
    return total + humanReadableAmount
  }, 0)

  // Calculate USD values for each token
  const seamUsdValue = seamRewards.reduce((total, reward) => {
    const rawAmount = BigInt(reward.claimableAmount)
    const decimals = reward.tokenDecimals
    const divisor = BigInt(10 ** decimals)
    const humanReadableAmount = Number(rawAmount) / Number(divisor)
    const tokenPrice = reward.metadata?.tokenPrice || 1.0
    return total + humanReadableAmount * tokenPrice
  }, 0)

  const morphoUsdValue = morphoRewards.reduce((total, reward) => {
    const rawAmount = BigInt(reward.claimableAmount)
    const decimals = reward.tokenDecimals
    const divisor = BigInt(10 ** decimals)
    const humanReadableAmount = Number(rawAmount) / Number(divisor)
    const tokenPrice = reward.metadata?.tokenPrice || 1.0
    return total + humanReadableAmount * tokenPrice
  }, 0)

  // Calculate "Claimable Soon" amounts from pending rewards (SEAM + MORPHO)
  const claimableSoonSeam = rewardsData?.claimableRewards
    ?.filter((r) => r.tokenSymbol === 'SEAM')
    ?.reduce(
      (total, reward) => {
        const pendingAmount = BigInt(reward.metadata?.pendingAmount || '0')
        const decimals = reward.tokenDecimals
        const divisor = BigInt(10 ** decimals)
        const humanReadableAmount = Number(pendingAmount) / Number(divisor)
        const tokenPrice = reward.metadata?.tokenPrice || 1.0
        const usdValue = humanReadableAmount * tokenPrice
        return { tokens: total.tokens + humanReadableAmount, usdValue: total.usdValue + usdValue }
      },
      { tokens: 0, usdValue: 0 },
    ) || { tokens: 0, usdValue: 0 }

  const claimableSoonMorpho = rewardsData?.claimableRewards
    ?.filter((r) => r.tokenSymbol === 'MORPHO')
    ?.reduce(
      (total, reward) => {
        const pendingAmount = BigInt(reward.metadata?.pendingAmount || '0')
        const decimals = reward.tokenDecimals
        const divisor = BigInt(10 ** decimals)
        const humanReadableAmount = Number(pendingAmount) / Number(divisor)
        const tokenPrice = reward.metadata?.tokenPrice || 1.0
        const usdValue = humanReadableAmount * tokenPrice
        return { tokens: total.tokens + humanReadableAmount, usdValue: total.usdValue + usdValue }
      },
      { tokens: 0, usdValue: 0 },
    ) || { tokens: 0, usdValue: 0 }

  // Combined totals for display
  const claimableSoonData = {
    tokens: claimableSoonSeam.tokens + claimableSoonMorpho.tokens,
    usdValue: claimableSoonSeam.usdValue + claimableSoonMorpho.usdValue,
  }

  // Check if user has any claimable rewards
  const hasClaimableRewards = rewardsData?.hasClaimableRewards || false

  const { data: stakingData, isLoading: stakingLoading } = usePortfolioStaking()

  // Extract data with fallbacks
  const summary = portfolioData?.summary || {
    totalValue: 0,
    totalEarnings: 0,
    activePositions: 0,
    changeAmount: 0,
    changePercent: 0,
    averageAPY: 0,
  }
  const positions = portfolioData?.positions || []

  // Accessible IDs for landmark headings (declare before any early return)
  const headingId = useId()
  const summaryHeadingId = useId()
  const performanceHeadingId = useId()
  const rewardsHeadingId = useId()
  const vaultsHeadingId = useId()

  // Show connection status card if wallet is not connected
  if (!isConnected) {
    return (
      <PageContainer padded={false} className="space-y-6 my-20">
        <ConnectionStatusCard />
      </PageContainer>
    )
  }

  // Show loading state only for main portfolio data
  if (portfolioLoading) {
    return (
      <PageContainer padded={false} className="space-y-6" aria-busy>
        {/* Portfolio Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Portfolio Value Card */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-20" />
          </div>

          {/* Total Earnings Card */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Active Positions Card */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-8 w-8 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Portfolio Performance Chart Skeleton */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-40" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-8 w-12" />
            </div>
          </div>
          <Skeleton className="h-64 w-full rounded" />
        </div>

        {/* Active Positions Table Skeleton */}
        <div className="rounded-lg border border-border bg-card p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            {/* Table header */}
            <div className="flex justify-between items-center py-3 border-b border-border">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            {/* Table row */}
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>

        {/* Rewards and Staking Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Available Rewards Card */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>

          {/* SEAM Staking Card */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-6 rounded-full" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    )
  }

  // Show error state only for main portfolio data
  if (portfolioError) {
    return (
      <PageContainer padded={false} className="space-y-6">
        <div className="text-center py-12">
          <div className="text-red-400">Error loading portfolio data</div>
        </div>
      </PageContainer>
    )
  }

  const handlePositionAction = (
    action: 'deposit' | 'withdraw' | 'mint' | 'redeem',
    position: Position,
  ) => {
    setSelectedPosition(position)

    if (action === 'mint') {
      setIsMintModalOpen(true)
    } else if (action === 'redeem') {
      setIsRedeemModalOpen(true)
    } else {
      // TODO: Implement other actions
    }
  }

  const handleClaimRewards = () => {
    // Redirect to Merkl dashboard for claiming rewards
    if (userAddress) {
      window.open(`https://app.merkl.xyz/users/${userAddress}`, '_blank')
    }
  }

  const handleStake = () => {
    // TODO: Implement staking
  }

  const handleManageStaking = () => {
    // TODO: Navigate to staking page
  }

  const handlePositionClick = (position: Position) => {
    if (position.type === 'leverage-token') {
      // Use the leverageTokenAddress field directly from the position
      const leverageTokenAddress = position.leverageTokenAddress
      if (leverageTokenAddress) {
        // Get the token config to determine the correct chain ID
        const tokenConfig = getLeverageTokenConfig(leverageTokenAddress as `0x${string}`)
        if (!tokenConfig) {
          throw new Error(
            `Leverage token configuration not found for address: ${leverageTokenAddress}`,
          )
        }
        const chainId = tokenConfig.chainId.toString()

        navigate({
          to: '/leverage-tokens/$chainId/$id',
          params: {
            chainId,
            id: leverageTokenAddress,
          },
        })
      }
    }
  }

  return (
    <PageContainer padded={false} className="space-y-8">
      <motion.div
        className="space-y-8"
        aria-labelledby={headingId}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 id={headingId} className="sr-only">
          Portfolio
        </h1>
        {/* Portfolio Value Cards */}
        <motion.section
          aria-labelledby={summaryHeadingId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h2 id={summaryHeadingId} className="sr-only">
            Portfolio Summary
          </h2>
          <StatCardList
            maxColumns={3}
            cards={[
              {
                title: 'Total Portfolio Value',
                stat: portfolioLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  `$${formatNumber(summary.totalValue, { decimals: 2, thousandDecimals: 2, millionDecimals: 2 })}`
                ),
                caption: portfolioLoading ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  <div
                    className={`flex items-center text-sm ${
                      summary.changeAmount >= 0
                        ? 'text-[var(--state-success-text)]'
                        : 'text-[var(--state-error-text)]'
                    }`}
                  >
                    {summary.changeAmount >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
                    )}
                    ${Math.abs(summary.changeAmount).toLocaleString('en-US')} (
                    {summary.changePercent.toFixed(2)}%)
                  </div>
                ),
                icon: <DollarSign />,
                iconBgClass: 'bg-[color-mix(in_srgb,var(--brand-secondary)_20%,transparent)]',
                iconTextClass: 'text-brand-purple',
              },
              {
                title: 'Total Earnings',
                stat: portfolioLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  `${summary.changeAmount >= 0 ? '+' : ''}$${Math.abs(
                    summary.changeAmount,
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  })}`
                ),
                caption: portfolioLoading ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  `${summary.changePercent >= 0 ? '+' : ''}${summary.changePercent.toFixed(2)}% total return`
                ),
                icon: <TrendingUp />,
                iconBgClass:
                  summary.changeAmount >= 0
                    ? 'bg-[color-mix(in_srgb,var(--state-success-text)_18%,transparent)]'
                    : 'bg-[color-mix(in_srgb,var(--state-error-text)_18%,transparent)]',
                iconTextClass:
                  summary.changeAmount >= 0
                    ? 'text-[var(--state-success-text)]'
                    : 'text-[var(--state-error-text)]',
              },
              {
                title: 'Active Positions',
                stat: portfolioLoading ? (
                  <Skeleton className="h-6 w-8" />
                ) : (
                  summary.activePositions.toString()
                ),
                caption: portfolioLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  `Across ${summary.activePositions} strategies`
                ),
                icon: <Target />,
                iconBgClass: 'bg-[color-mix(in_srgb,var(--accent-1)_18%,transparent)]',
                iconTextClass: 'text-[var(--accent-1)]',
              },
            ]}
          />
        </motion.section>

        {/* Portfolio Chart */}
        <motion.section
          aria-labelledby={performanceHeadingId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 id={performanceHeadingId} className="sr-only">
            Portfolio Performance
          </h2>
          <div className="relative">
            <PortfolioPerformanceChart
              data={performanceData.data}
              selectedTimeframe={performanceData.selectedTimeframe}
              onTimeframeChange={performanceData.setSelectedTimeframe}
              isLoading={performanceData.isLoading}
            />
          </div>
        </motion.section>

        {/* Available Rewards & Staking Section */}
        {(hasClaimableRewards || features.seamStaking) && (
          <motion.section
            aria-labelledby={rewardsHeadingId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className={`grid gap-6 ${
              hasClaimableRewards && features.seamStaking
                ? 'grid-cols-1 lg:grid-cols-2'
                : 'grid-cols-1'
            }`}
          >
            <h2 id={rewardsHeadingId} className="sr-only">
              Rewards and Staking
            </h2>
            {hasClaimableRewards && (
              <div className="relative">
                <AvailableRewards
                  seamToken={totalSeamTokens.toFixed(3)}
                  seamTokenUsd={seamUsdValue < 0.01 ? '< $0.01' : `$${seamUsdValue.toFixed(2)}`}
                  morphoToken={totalMorphoTokens > 0 ? totalMorphoTokens.toFixed(3) : undefined}
                  morphoTokenUsd={
                    totalMorphoTokens > 0
                      ? morphoUsdValue < 0.01
                        ? '< $0.01'
                        : `$${morphoUsdValue.toFixed(2)}`
                      : undefined
                  }
                  claimableSoonAmount={
                    claimableSoonData.usdValue > 0
                      ? claimableSoonData.usdValue < 0.01
                        ? '< $0.01'
                        : `$${claimableSoonData.usdValue.toFixed(2)}`
                      : undefined
                  }
                  claimableSoonSeamTokens={
                    claimableSoonSeam.tokens > 0 ? claimableSoonSeam.tokens.toFixed(6) : undefined
                  }
                  claimableSoonMorphoTokens={
                    claimableSoonMorpho.tokens > 0
                      ? claimableSoonMorpho.tokens.toFixed(6)
                      : undefined
                  }
                  onClaim={handleClaimRewards}
                />
                {rewardsLoading && (
                  <div className="absolute inset-0 bg-[var(--overlay-backdrop)] backdrop-blur-sm flex items-center justify-center rounded-xl">
                    <Skeleton className="h-5 w-24 rounded" />
                  </div>
                )}
              </div>
            )}

            {features.seamStaking && (
              <div className="relative">
                <SEAMStaking
                  stakedAmount={stakingData?.stakedAmount || '0.00'}
                  earnedRewards={stakingData?.earnedRewards || '0.00'}
                  apy={stakingData?.apy || '0.00'}
                  onStake={handleStake}
                  onManage={handleManageStaking}
                />
                {stakingLoading && (
                  <div className="absolute inset-0 bg-[var(--overlay-backdrop)] backdrop-blur-sm flex items-center justify-center rounded-xl">
                    <div className="text-secondary-foreground">Loading staking data...</div>
                  </div>
                )}
              </div>
            )}
          </motion.section>
        )}

        <motion.section
          aria-labelledby={vaultsHeadingId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <h2 id={vaultsHeadingId} className="sr-only">
            Morpho Vaults Information
          </h2>
          <MorphoVaultsInfoCard />
        </motion.section>

        {/* Active Positions */}
        {/* Active Positions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <ActivePositions
            positions={positions}
            onAction={handlePositionAction}
            onPositionClick={handlePositionClick}
            apyLoading={positionsAPYLoading}
          />
        </motion.div>

        {/* Mint Modal */}
        {selectedPosition && (
          <LeverageTokenMintModal
            isOpen={isMintModalOpen}
            onClose={() => {
              setIsMintModalOpen(false)
              setSelectedPosition(null)
            }}
            leverageTokenAddress={selectedPosition.leverageTokenAddress as Address}
            {...(userAddress && { userAddress })}
          />
        )}

        {/* Redeem Modal */}
        {selectedPosition && (
          <LeverageTokenRedeemModal
            isOpen={isRedeemModalOpen}
            onClose={() => {
              setIsRedeemModalOpen(false)
              setSelectedPosition(null)
            }}
            leverageTokenAddress={selectedPosition.leverageTokenAddress as Address}
            {...(userAddress && { userAddress })}
          />
        )}
      </motion.div>
    </PageContainer>
  )
}
