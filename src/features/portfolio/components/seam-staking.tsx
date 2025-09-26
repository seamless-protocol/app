import { ExternalLink, Lock, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SEAMStakingProps {
  stakedAmount: string
  earnedRewards: string
  apy: string
  onStake: () => void
  onManage: () => void
  className?: string
}

export function SEAMStaking({
  stakedAmount,
  earnedRewards,
  apy,
  onStake,
  onManage,
  className,
}: SEAMStakingProps) {
  return (
    <Card
      className={`bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] border border-[var(--divider-line)] hover:bg-[color-mix(in_srgb,var(--surface-elevated) 45%,transparent)] transition-all duration-300 ${className}`}
    >
      <CardHeader className="pb-4">
        <CardTitle className="text-foreground flex items-center">
          <Lock className="h-5 w-5 mr-2 text-purple-400" />
          SEAM Staking
          <Badge className="ml-2 bg-purple-500/20 text-purple-400 border-purple-500/30 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30">
            {apy} APY
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Staked Amount */}
          <div className="flex justify-between items-center py-2">
            <span className="text-[var(--text-secondary)]">Staked Amount</span>
            <span className="text-foreground font-semibold">{stakedAmount} SEAM</span>
          </div>

          {/* Earned Rewards */}
          <div className="flex justify-between items-center py-2">
            <span className="text-[var(--text-secondary)]">Earned Rewards</span>
            <span className="text-green-400 font-semibold">+{earnedRewards} SEAM</span>
          </div>

          {/* APY with border */}
          <div className="flex justify-between items-center py-2 pb-4 border-b border-[var(--divider-line)]">
            <span className="text-[var(--text-secondary)]">APY</span>
            <span className="text-purple-400 font-semibold">{apy}%</span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={onStake} className="bg-green-600 hover:bg-green-500 text-white">
              <Plus className="h-4 w-4 mr-1" />
              Stake
            </Button>
            <Button
              onClick={onManage}
              variant="outline"
              className="border-[var(--divider-line)] text-[var(--text-secondary)] hover:bg-[color-mix(in_srgb,var(--surface-elevated) 35%,transparent)]"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Manage
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
