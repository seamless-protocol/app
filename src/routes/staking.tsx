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

  const handleClaimRewards = () => {}

  return (
    <div className="container mx-auto">
      {/* Base Chain Network Requirement Notice */}
      <div className="bg-[color-mix(in_srgb,var(--brand-primary) 15%,transparent)] border border-[color-mix(in_srgb,var(--brand-primary) 25%,transparent)] rounded-lg p-4 mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[var(--brand-primary)] rounded-lg flex items-center justify-center">
            <Network className="h-5 w-5 text-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-foreground">Base Chain Required</h3>
              <Badge
                variant="outline"
                className="border-[color-mix(in_srgb,var(--brand-primary) 25%,transparent)] text-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary) 10%,transparent)]"
              >
                Base
              </Badge>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
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
            <Card className="bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] border border-[var(--divider-line)]">
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Implement Stake Widget
                  </h3>
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
                    <span className="text-foreground text-xs font-bold">S</span>
                  </div>
                  <span className="text-2xl font-bold text-foreground">
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
            <div className="text-card-foreground flex flex-col gap-6 rounded-xl border bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] border-[var(--divider-line)]">
              <div className="[&:last-child]:pb-6 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-medium text-foreground mb-2">Claimable rewards</p>
                    <div className="text-3xl font-bold text-foreground">
                      {isRewardsLoading ? (
                        <Skeleton className="h-8 w-20" />
                      ) : (
                        rewardsData?.claimableRewardsAmount
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      Stake SEAM to receive rewards.
                    </p>
                  </div>
                  <Button
                    onClick={handleClaimRewards}
                    disabled={
                      isRewardsLoading ||
                      !rewardsData?.claimableRewardsAmount ||
                      rewardsData.claimableRewardsAmount === '0.00 SEAM'
                    }
                    className="bg-[color-mix(in_srgb,var(--surface-elevated) 35%,transparent)] hover:bg-[color-mix(in_srgb,var(--surface-elevated) 45%,transparent)] text-foreground px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
          <Card className="bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] border border-[var(--divider-line)]">
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <h3 className="text-lg text-foreground">Implement Rewards Table</h3>
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
