import { createFileRoute } from '@tanstack/react-router'
import { Network } from 'lucide-react'
import { FAQ } from '@/components/FAQ'
import { StatCard } from '@/components/StatCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { stakingFAQData } from '@/features/staking/data/faqData'
import { useStakingProtocolStats } from '@/features/staking/hooks/useStakingProtocolStats'
import { useStakingRewards } from '@/features/staking/hooks/useStakingRewards'
import { useStakingUserStats } from '@/features/staking/hooks/useStakingUserStats'

export const Route = createFileRoute('/staking')({
  component: StakingPage,
})

function StakingPage() {
  // Fetch staking data using hooks
  const { data: protocolStats, isLoading: isProtocolStatsLoading } = useStakingProtocolStats()
  const { data: userStats, isLoading: isUserStatsLoading } = useStakingUserStats()
  const { data: rewardsData, isLoading: isRewardsLoading } = useStakingRewards()

  const handleClaimRewards = () => {
    console.log('Claim rewards to be implemented')
  }

  return (
    <div className="container mx-auto">
      {/* Base Chain Network Requirement Notice */}
      <div className="bg-blue-950/30 border border-blue-500/30 rounded-lg p-4 mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Network className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-white">Base Chain Required</h3>
              <Badge variant="outline" className="border-blue-500/50 text-blue-300 bg-blue-500/10">
                Base
              </Badge>
            </div>
            <p className="text-sm text-blue-200/80 mt-1">
              SEAM staking is only available on Base Chain. Please ensure your wallet is connected
              to Base to participate in staking.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex flex-col xl:grid xl:grid-cols-3 gap-6">
        {/* Right Panel - Stake Widget Placeholder (shows first on mobile) */}
        <div className="xl:col-span-1 xl:order-2 order-1">
          <div className="sticky top-6">
            <Card className="bg-slate-900/80 border-slate-700">
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Implement Stake Widget</h3>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Left Panel - Main Content */}
        <div className="xl:col-span-2 xl:order-1 order-2 space-y-6">
          {/* Current Holdings and Claimable Rewards */}
          <div className="space-y-6">
            {/* Current Holdings - Using StatCard with SEAM icon */}
            <StatCard
              title="Current holdings"
              stat={
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">S</span>
                  </div>
                  <span className="text-2xl font-bold text-white">
                    {isUserStatsLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      userStats?.currentHoldingsAmount
                    )}
                  </span>
                </div>
              }
              caption={
                isUserStatsLoading ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  userStats?.currentHoldingsUsdValue
                )
              }
            />

            {/* Claimable Rewards - Custom card with claim button */}
            <div className="text-card-foreground flex flex-col gap-6 rounded-xl border bg-slate-900/80 border-slate-700">
              <div className="[&:last-child]:pb-6 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-medium text-white mb-2">Claimable rewards</p>
                    <div className="text-3xl font-bold text-white">
                      {isRewardsLoading ? (
                        <Skeleton className="h-8 w-20" />
                      ) : (
                        rewardsData?.claimableRewardsAmount
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">Stake SEAM to receive rewards.</p>
                  </div>
                  <Button
                    onClick={handleClaimRewards}
                    disabled={
                      isRewardsLoading ||
                      !rewardsData?.claimableRewardsAmount ||
                      rewardsData.claimableRewardsAmount === '0.00 SEAM'
                    }
                    className="bg-slate-600 hover:bg-slate-500 text-white px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Claim
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics - Using StatCard */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Total Staked"
              stat={
                isProtocolStatsLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  protocolStats?.totalStakedAmount
                )
              }
              caption={
                isProtocolStatsLoading ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  protocolStats?.totalStakedUsdValue
                )
              }
            />

            <StatCard
              title="Total APR"
              stat={
                isProtocolStatsLoading ? <Skeleton className="h-6 w-16" /> : protocolStats?.totalAPR
              }
            />

            <StatCard
              title="Unstaking cooldown"
              stat={
                isProtocolStatsLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  protocolStats?.unstakingCooldown
                )
              }
            />
          </div>

          {/* Rewards Table */}
          <Card className="bg-slate-900/80 border-slate-700">
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <h3 className="text-lg text-white">Implement Rewards Table</h3>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <FAQ title="Staking Details" items={stakingFAQData} />
        </div>
      </div>
    </div>
  )
}
