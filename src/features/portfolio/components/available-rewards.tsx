import { Award, Zap } from 'lucide-react'
import { AssetDisplay } from '@/components/ui/asset-display'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AvailableRewardsProps {
  seamToken: string
  seamTokenUsd: string
  morphoToken?: string | undefined
  morphoTokenUsd?: string | undefined
  claimableSoonAmount?: string | undefined
  claimableSoonSeamTokens?: string | undefined
  claimableSoonMorphoTokens?: string | undefined
  onClaim: () => void
  className?: string
}

export function AvailableRewards({
  seamToken,
  seamTokenUsd,
  morphoToken,
  morphoTokenUsd,
  claimableSoonAmount,
  claimableSoonSeamTokens,
  claimableSoonMorphoTokens,
  onClaim,
  className,
}: AvailableRewardsProps) {
  return (
    <Card
      className={`bg-card border-border hover:bg-accent transition-all duration-300 gap-0 ${className}`}
    >
      <CardHeader className="pb-4">
        <CardTitle className="text-foreground flex items-center">
          <Award className="h-5 w-5 mr-2 text-brand-purple" />
          Available Rewards
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* SEAM Tokens */}
          <div className="flex justify-between items-center py-2">
            <span className="text-secondary-foreground">SEAM Tokens</span>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-foreground font-semibold">
                <AssetDisplay
                  asset={{
                    symbol: 'SEAM',
                    name: 'SEAM',
                  }}
                  size="sm"
                  variant="logo-only"
                />
                {seamToken} SEAM
              </div>
              <div className="text-sm text-muted-foreground">{seamTokenUsd}</div>
            </div>
          </div>

          {/* MORPHO Tokens */}
          {morphoToken && (
            <div className="flex justify-between items-center py-2">
              <span className="text-secondary-foreground">MORPHO Tokens</span>
              <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-foreground font-semibold">
                  <AssetDisplay
                    asset={{
                      symbol: 'MORPHO',
                      name: 'MORPHO',
                    }}
                    size="sm"
                    variant="logo-only"
                  />
                  {morphoToken} MORPHO
                </div>
                <div className="text-sm text-muted-foreground">{morphoTokenUsd}</div>
              </div>
            </div>
          )}

          {/* Claimable Soon */}
          {claimableSoonAmount && (claimableSoonSeamTokens || claimableSoonMorphoTokens) && (
            <div className="flex justify-between items-center py-2">
              <span className="text-secondary-foreground">Claimable Soon</span>
              <div className="text-right">
                <div className="text-foreground font-semibold">{claimableSoonAmount}</div>
                <div className="flex items-center gap-2">
                  {claimableSoonSeamTokens && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <AssetDisplay
                        asset={{
                          symbol: 'SEAM',
                          name: 'SEAM',
                        }}
                        size="sm"
                        variant="logo-only"
                      />
                      {claimableSoonSeamTokens} SEAM
                    </div>
                  )}
                  {claimableSoonSeamTokens && claimableSoonMorphoTokens && (
                    <span className="text-muted-foreground">+</span>
                  )}
                  {claimableSoonMorphoTokens && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <AssetDisplay
                        asset={{
                          symbol: 'MORPHO',
                          name: 'MORPHO',
                        }}
                        size="sm"
                        variant="logo-only"
                      />
                      {claimableSoonMorphoTokens} MORPHO
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Claim Button */}
          <Button onClick={onClaim} variant="gradient" size="lg" className="w-full mt-2">
            <Zap className="h-4 w-4 mr-2" />
            Claim All Rewards
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
