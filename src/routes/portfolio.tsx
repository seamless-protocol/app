import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { DollarSign, Target, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import type { Address } from 'viem'
import { useAccount } from 'wagmi'
import { ConnectionStatusCard } from '@/components/ConnectionStatusCard'
import { StatCardList } from '@/components/StatCardList'
import { Skeleton } from '@/components/ui/skeleton'
import { LeverageTokenMintModal } from '@/features/leverage-tokens/components/leverage-token-mint-modal'
import { LeverageTokenRedeemModal } from '@/features/leverage-tokens/components/leverage-token-redeem-modal'
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

export const Route = createFileRoute('/portfolio')({
  component: PortfolioPage,
})

function PortfolioPage() {
  const { isConnected, address: userAddress } = useAccount()
  const navigate = useNavigate()

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

  // TODO: Use rewardsData when rewards feature is implemented
  console.log('Rewards data:', { rewardsData, rewardsLoading })

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
          <div className="rounded-lg border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card)_96%,transparent)] p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-20" />
          </div>

          {/* Total Earnings Card */}
          <div className="rounded-lg border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card)_96%,transparent)] p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Active Positions Card */}
          <div className="rounded-lg border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card)_96%,transparent)] p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-8 w-8 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Portfolio Performance Chart Skeleton */}
        <div className="rounded-lg border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card)_96%,transparent)] p-6">
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
        <div className="rounded-lg border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card)_96%,transparent)] p-6">
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
          <div className="rounded-lg border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card)_96%,transparent)] p-6">
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
          <div className="rounded-lg border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card)_96%,transparent)] p-6">
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
    <div className="mx-auto max-w-7xl lg:px-8">
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
                ) : summary.totalValue < 0.01 ? (
                  '< $0.01'
                ) : (
                  `$${summary.totalValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  })}`
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
              <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--surface-elevated)_35%,transparent)] backdrop-blur-sm flex items-center justify-center rounded-xl">
                <div className="text-[var(--text-secondary)]">Loading chart data...</div>
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
                {rewardsLoading ? (
                  <div className="bg-[color-mix(in_srgb,var(--surface-card)_92%,transparent)] border border-[var(--divider-line)] rounded-lg p-6">
                    {/* Header skeleton */}
                    <div className="flex items-center mb-4">
                      <Skeleton className="h-5 w-5 mr-2 rounded" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                    
                    {/* Content skeleton */}
                    <div className="space-y-4">
                      {/* Accruing row with token logos */}
                      <div className="flex justify-between items-center py-2">
                        <Skeleton className="h-4 w-16" />
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <Skeleton className="h-6 w-6 rounded-full -ml-2" />
                          </div>
                          <Skeleton className="h-4 w-12" />
                        </div>
                      </div>
                      
                      {/* SEAM Tokens row */}
                      <div className="flex justify-between items-center py-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      
                      {/* Protocol Fees row */}
                      <div className="flex justify-between items-center py-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      
                      {/* Button skeleton */}
                      <Skeleton className="h-10 w-full mt-2" />
                    </div>
                  </div>
                ) : (
                  <AvailableRewards
                    tokenAddresses={[]}
                    accruingAmount={'$0.00'}
                    seamToken={'$0.00'}
                    protocolFees={'$0.00'}
                    onClaim={handleClaimRewards}
                  />
                )}
              </div>
            )}

            {features.seamStaking && (
              <div className="relative">
                {stakingLoading ? (
                  <div className="bg-[color-mix(in_srgb,var(--surface-card)_92%,transparent)] border border-[var(--divider-line)] rounded-lg p-6">
                    {/* Header skeleton */}
                    <div className="flex items-center mb-4">
                      <Skeleton className="h-5 w-5 mr-2 rounded" />
                      <Skeleton className="h-6 w-24 mr-2" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    
                    {/* Content skeleton */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="flex justify-between items-center py-2 pb-4 border-b border-[var(--divider-line)]">
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      
                      {/* Button skeletons */}
                      <div className="grid grid-cols-2 gap-3">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <SEAMStaking
                    stakedAmount={stakingData?.stakedAmount || '0.00'}
                    earnedRewards={stakingData?.earnedRewards || '0.00'}
                    apy={stakingData?.apy || '0.00'}
                    onStake={handleStake}
                    onManage={handleManageStaking}
                  />
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
    </div>
  )
}
