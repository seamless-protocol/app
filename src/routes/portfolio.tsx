import { createFileRoute } from '@tanstack/react-router'
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
import { usePortfolioData } from '@/features/portfolio/hooks/usePortfolioData'
import { usePortfolioPerformance } from '@/features/portfolio/hooks/usePortfolioPerformance'
import { usePortfolioRewards } from '@/features/portfolio/hooks/usePortfolioRewards'
import { usePortfolioStaking } from '@/features/portfolio/hooks/usePortfolioStaking'

export const Route = createFileRoute('/portfolio')({
  component: PortfolioPage,
})

function PortfolioPage() {
  const { isConnected } = useAccount()

  // Direct hook calls - matching leverage tokens pattern
  const {
    data: portfolioData,
    isLoading: portfolioLoading,
    isError: portfolioError,
  } = usePortfolioData()
  const performanceData = usePortfolioPerformance()
  const { data: rewardsData, isLoading: rewardsLoading } = usePortfolioRewards()
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
        <div className="text-center py-12">
          <div className="text-slate-400">Loading portfolio...</div>
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
            tokenAddresses={rewardsData?.tokenAddresses || []}
            accruingAmount={rewardsData?.accruingAmount || '$0.00'}
            seamToken={rewardsData?.seamToken || '0.00'}
            protocolFees={rewardsData?.protocolFees || '$0.00'}
            onClaim={handleClaimRewards}
          />
          {rewardsLoading && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
              <div className="text-slate-400">Loading rewards...</div>
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
        <ActivePositions positions={positions} onAction={handlePositionAction} />
      </motion.div>
    </motion.div>
  )
}
