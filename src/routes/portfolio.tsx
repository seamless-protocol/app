import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { DollarSign, Target, TrendingUp } from 'lucide-react'
import { useAccount } from 'wagmi'
import { ConnectionStatusCard } from '@/components/ConnectionStatusCard'
import { StatCardList } from '@/components/StatCardList'
import { Skeleton } from '@/components/ui/skeleton'
import type { Position } from '@/features/portfolio/components/active-positions'
import { ActivePositions } from '@/features/portfolio/components/active-positions'
import { AvailableRewards } from '@/features/portfolio/components/available-rewards'
import { PortfolioPerformanceChart } from '@/features/portfolio/components/portfolio-performance-chart'
import { SEAMStaking } from '@/features/portfolio/components/seam-staking'
import {
  usePortfolioPerformance,
  usePortfolioWithTotalValue,
} from '@/features/portfolio/hooks/usePortfolioDataFetcher'
import { usePortfolioRewards } from '@/features/portfolio/hooks/usePortfolioRewards'
import { usePortfolioStaking } from '@/features/portfolio/hooks/usePortfolioStaking'

export const Route = createFileRoute('/portfolio')({
  component: PortfolioPage,
})

function PortfolioPage() {
  const { isConnected } = useAccount()
  const navigate = useNavigate()

  // Direct hook calls - matching leverage tokens pattern
  const {
    data: portfolioData,
    isLoading: portfolioLoading,
    isError: portfolioError,
    positionsAPYLoading,
  } = usePortfolioWithTotalValue()
  const performanceData = usePortfolioPerformance()
  const { data: rewardsData, isLoading: rewardsLoading } = usePortfolioRewards()

  // Console log for testing rewards data
  console.log('🎁 Portfolio Rewards Data:', {
    rewardsData,
    isLoading: rewardsLoading,
    hasRewards: rewardsData?.hasRewards,
    hasClaimableRewards: rewardsData?.hasClaimableRewards,
    totalClaimable: rewardsData?.totalClaimableAmount,
    totalClaimed: rewardsData?.totalClaimedAmount,
    totalEarned: rewardsData?.totalEarnedAmount,
    tokenCount: rewardsData?.tokenCount,
    claimableCount: rewardsData?.claimableCount,
    claimedCount: rewardsData?.claimedCount,
    rewardsCount: rewardsData?.claimableRewards?.length,
  })
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
    console.log(`${action} action for position:`, position)
    // TODO: Implement position actions
  }

  const handleClaimRewards = () => {
    console.log('Claiming rewards...')
    // TODO: Implement claim rewards
  }

  const handleStake = () => {
    console.log('Staking SEAM...')
    // TODO: Implement staking
  }

  const handleManageStaking = () => {
    console.log('Managing staking...')
    // TODO: Navigate to staking page
  }

  const handlePositionClick = (position: Position) => {
    if (position.type === 'leverage-token') {
      // Extract the leverage token address from the position ID
      // The position ID format is typically: {userAddress}-{leverageTokenAddress}
      const leverageTokenAddress = position.id.split('-')[1]
      if (leverageTokenAddress) {
        navigate({
          to: '/tokens/$chainId/$id',
          params: {
            chainId: '8453', // Base chain ID
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
                `$${summary.totalValue.toLocaleString()}`
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
                `+$${summary.totalEarnings.toLocaleString()}`
              ),
              caption: portfolioLoading ? (
                <Skeleton className="h-4 w-20" />
              ) : (
                `+${summary.averageAPY.toFixed(1)}% avg APY`
              ),
              icon: <TrendingUp />,
              iconBgClass: 'bg-green-500/20',
              iconTextClass: 'text-green-400',
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
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
    </motion.div>
  )
}
