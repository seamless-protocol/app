import { Award, Zap } from 'lucide-react'
import { AssetDisplay } from '@/components/ui/asset-display'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AvailableRewardsProps {
  tokenAddresses: Array<string>
  accruingAmount: string
  seamToken: string
  protocolFees: string
  onClaim: () => void
  className?: string
}

export function AvailableRewards({
  tokenAddresses,
  accruingAmount,
  seamToken,
  protocolFees,
  onClaim,
  className,
}: AvailableRewardsProps) {
  return (
    <Card
      className={`bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] border border-[var(--divider-line)] hover:bg-[color-mix(in_srgb,var(--surface-elevated) 45%,transparent)] transition-all duration-300 ${className}`}
    >
      <CardHeader className="pb-4">
        <CardTitle className="text-foreground flex items-center">
          <Award className="h-5 w-5 mr-2 text-yellow-400" />
          Available Rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Accruing Rewards with Token Logos */}
          <div className="flex justify-between items-center py-2">
            <span className="text-[var(--text-secondary)]">Accruing</span>
            <div className="flex items-center space-x-3">
              <div className="flex items-center relative">
                {tokenAddresses.map((tokenAddress, index) => (
                  <div
                    key={tokenAddress}
                    className={`w-6 h-6 rounded-full relative ${index > 0 ? '-ml-2' : ''}`}
                    style={{ zIndex: 10 + index }}
                  >
                    <AssetDisplay
                      asset={{ symbol: tokenAddress, name: tokenAddress }}
                      size="md"
                      variant="logo-only"
                    />
                  </div>
                ))}
              </div>
              <span className="text-foreground font-semibold">{accruingAmount}</span>
            </div>
          </div>

          {/* SEAM Tokens */}
          <div className="flex justify-between items-center py-2">
            <span className="text-[var(--text-secondary)]">SEAM Tokens</span>
            <span className="text-foreground font-semibold">{seamToken} SEAM</span>
          </div>

          {/* Protocol Fees */}
          <div className="flex justify-between items-center py-2">
            <span className="text-[var(--text-secondary)]">Protocol Fees</span>
            <span className="text-foreground font-semibold">{protocolFees}</span>
          </div>

          {/* Claim Button */}
          <Button
            onClick={onClaim}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white mt-2"
          >
            <Zap className="h-4 w-4 mr-2" />
            Claim All Rewards
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
