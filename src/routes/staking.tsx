import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/StatCard'
import { FAQ } from '@/components/FAQ'
import { Coins, Network } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { stakingFAQData } from '@/features/staking/data/faqData'
import { useStakingStats, useStakingTotalAssets, useStakingRewardsData } from '@/features/staking/hooks/useStakingStats'

export const Route = createFileRoute('/staking')({
  component: StakingPage,
})

function StakingPage() {
  // Fetch staking data using hooks
  const { data: stakingStats, isLoading: isStatsLoading } = useStakingStats()
  const { data: totalAssetsData, isLoading: isTotalAssetsLoading } = useStakingTotalAssets()
  const { data: rewardsData, isLoading: isRewardsLoading } = useStakingRewardsData()

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
              SEAM staking is only available on Base Chain. Please ensure your wallet is connected to Base to participate in staking.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Panel - Main Content */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Current Holdings and Claimable Rewards */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="text-card-foreground flex flex-col gap-6 rounded-xl border bg-slate-900/80 border-slate-700">
              <div className="[&:last-child]:pb-6 p-4">
                <div>
                  <p className="text-sm text-slate-400">Current holdings</p>
                  <p className="text-xl font-bold text-white">
                    {isStatsLoading ? "Loading..." : stakingStats?.currentHoldings?.amount || "—"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {isStatsLoading ? "Loading..." : stakingStats?.currentHoldings?.usdValue || "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-card-foreground flex flex-col gap-6 rounded-xl border bg-slate-900/80 border-slate-700">
              <div className="[&:last-child]:pb-6 p-4">
                <div>
                  <p className="text-sm text-slate-400">Claimable rewards</p>
                  <p className="text-xl font-bold text-white">
                    {isRewardsLoading ? "Loading..." : rewardsData?.claimableRewards ? `$${rewardsData.claimableRewards.value}` : "—"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {isStatsLoading ? "Loading..." : stakingStats?.claimableRewards?.description || "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics - Using StatCard */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Total Staked"
              stat={isTotalAssetsLoading ? "Loading..." : totalAssetsData?.totalAssets ? `${totalAssetsData.totalAssets.value} ${totalAssetsData.totalAssets.symbol}` : "—"}
              caption={isTotalAssetsLoading ? "Loading..." : totalAssetsData?.totalAssetsUSD ? `$${totalAssetsData.totalAssetsUSD.value}` : "—"}
            />

            <StatCard
              title="Total APR"
              stat={isRewardsLoading ? "Loading..." : rewardsData?.totalApr ? `${rewardsData.totalApr.value}${rewardsData.totalApr.symbol}` : "—"}
            />

            <StatCard
              title="Unstaking cooldown"
              stat={isStatsLoading ? "Loading..." : stakingStats?.keyMetrics?.unstakingCooldown?.days || "—"}
            />
          </div>

          {/* FAQ Section */}
          <FAQ 
            title="Staking Details" 
            items={stakingFAQData} 
          />
        </div>

        {/* Right Panel - Stake Widget Placeholder */}
        <div className="xl:col-span-1">
          <div className="sticky top-6">
            <Card className="bg-slate-900/80 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Coins className="h-5 w-5 text-purple-400" />
                  <span>Stake Widget</span>
                </CardTitle>
                <CardDescription>
                  Interactive staking interface
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center mb-4">
                    <Coins className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Implement Stake Widget
                  </h3>
                  <p className="text-sm text-slate-400 mb-4">
                    This area will contain the interactive staking widget for users to stake and unstake SEAM tokens.
                  </p>
                  <div className="text-xs text-slate-500 bg-slate-800/50 px-3 py-2 rounded-lg">
                    Coming Soon
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
