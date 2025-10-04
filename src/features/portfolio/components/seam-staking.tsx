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
      className={`bg-card border-border hover:bg-accent transition-all duration-300 ${className}`}
    >
      <CardHeader className="pb-4">
        <CardTitle className="text-foreground flex items-center">
          <Lock className="h-5 w-5 mr-2 text-brand-purple" />
          SEAM Staking
          <Badge variant="brand" className="ml-2">
            {apy} APY
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Staked Amount */}
          <div className="flex justify-between items-center py-2">
            <span className="text-secondary-foreground">Staked Amount</span>
            <span className="text-foreground font-semibold">{stakedAmount} SEAM</span>
          </div>

          {/* Earned Rewards */}
          <div className="flex justify-between items-center py-2">
            <span className="text-secondary-foreground">Earned Rewards</span>
            <span className="text-[var(--state-success-text)] font-semibold">
              +{earnedRewards} SEAM
            </span>
          </div>

          {/* APY with border */}
          <div className="flex justify-between items-center py-2 pb-4 border-b border-border">
            <span className="text-secondary-foreground">APY</span>
            <span className="text-brand-purple font-semibold">{apy}%</span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={onStake} variant="gradient" size="lg">
              <Plus className="h-4 w-4 mr-1" />
              Stake
            </Button>
            <Button onClick={onManage} variant="outline" size="lg">
              <ExternalLink className="h-4 w-4 mr-1" />
              Manage
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
