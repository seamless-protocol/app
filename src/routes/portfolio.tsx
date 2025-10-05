import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { DollarSign, Target, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Address } from 'viem'
import { useAccount } from 'wagmi'
import { ConnectionStatusCard } from '@/components/ConnectionStatusCard'
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

export const Route = createFileRoute('/portfolio')({
  component: PortfolioPage,
})

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
  const { isLoading: rewardsLoading } = usePortfolioRewards()

  // TODO: Use rewardsData when rewards feature is implemented
  // console.log('Rewards data:', { rewardsData, rewardsLoading })

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

  // Show connection status card if wallet is not connected
  if (!isConnected) {
    return (
      <div className="space-y-6 my-20">
        <ConnectionStatusCard />
      </div>
    )
  }

  // Show loading state only for main portfolio data
  if (portfolioLoading) {
    return (
      <div className="space-y-6">
        {/* Portfolio Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Portfolio Value Card */}
          <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-20" />
          </div>

          {/* Total Earnings Card */}
          <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Active Positions Card */}
          <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-8 w-8 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Portfolio Performance Chart Skeleton */}
        <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-6">
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
        <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            {/* Table header */}
            <div className="flex justify-between items-center py-3 border-b border-slate-700">
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
          <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-6">
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
          <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-6">
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
      </div>
    )
  }

  // Show error state only for main portfolio data
  if (portfolioError) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-red-400">Error loading portfolio data</div>
        </div>
      </div>
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
    // TODO: Implement claim rewards
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
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Portfolio Value Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
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
                    summary.changeAmount >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {summary.changeAmount >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
                  )}
                  ${Math.abs(summary.changeAmount).toLocaleString()} (
                  {summary.changePercent.toFixed(2)}%)
                </div>
              ),
              icon: <DollarSign />,
              iconBgClass: 'bg-purple-500/20',
              iconTextClass: 'text-purple-400',
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
              iconBgClass: summary.changeAmount >= 0 ? 'bg-green-500/20' : 'bg-red-500/20',
              iconTextClass: summary.changeAmount >= 0 ? 'text-green-400' : 'text-red-400',
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
              iconBgClass: 'bg-cyan-500/20',
              iconTextClass: 'text-cyan-400',
            },
          ]}
        />
      </motion.div>

      {/* Portfolio Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="relative">
          <PortfolioPerformanceChart
            data={performanceData.data}
            selectedTimeframe={performanceData.selectedTimeframe}
            onTimeframeChange={performanceData.setSelectedTimeframe}
          />
          {performanceData.isLoading && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
              <div className="text-slate-400">Loading chart data...</div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Available Rewards & Staking Section */}
      {(features.availableRewards || features.seamStaking) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className={`grid gap-6 ${
            features.availableRewards && features.seamStaking
              ? 'grid-cols-1 lg:grid-cols-2'
              : 'grid-cols-1'
          }`}
        >
          {features.availableRewards && (
            <div className="relative">
              <AvailableRewards
                tokenAddresses={[]}
                accruingAmount={'$0.00'}
                seamToken={'$0.00'}
                protocolFees={'$0.00'}
                onClaim={handleClaimRewards}
              />
              {rewardsLoading && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                  <div className="h-5 w-24 bg-slate-700/50 rounded animate-pulse" />
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
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                  <div className="text-slate-400">Loading staking data...</div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <MorphoVaultsInfoCard />
      </motion.div>

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
          {...(selectedPosition.apy && { apy: parseFloat(selectedPosition.apy) })}
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
  )
}
