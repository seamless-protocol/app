import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'
import { Minus, Plus, Zap } from 'lucide-react'
import { useAccount } from 'wagmi'
import { AssetDisplay } from '@/components/ui/asset-display'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'

interface UserPosition {
  hasPosition: boolean
  balance: string
  balanceUSD: string
  allTimePercentage?: string
  shareToken: string
  isConnected?: boolean // Optional since we use real wallet state
}

interface LeverageTokenHoldingsCardProps {
  userPosition: UserPosition
  onMint?: () => void
  onRedeem?: () => void
  className?: string
  isLoading?: boolean
  collateralAsset?: { symbol: string; name: string; address: string }
  debtAsset?: { symbol: string; name: string; address: string }
}

export function LeverageTokenHoldingsCard({
  userPosition,
  onMint,
  onRedeem,
  className = '',
  isLoading = false,
  collateralAsset,
  debtAsset,
}: LeverageTokenHoldingsCardProps) {
  // Use real wallet connection state from wagmi
  const { isConnected } = useAccount()

  const handleMintClick = () => {
    if (isConnected && onMint) {
      onMint()
    }
  }

  const handleRedeemClick = () => {
    if (isConnected && onRedeem) {
      onRedeem()
    }
  }

  // Render ConnectButton with proper RainbowKit integration
  const renderConnectButton = (children: React.ReactNode) => {
    return (
      <ConnectButton.Custom>
        {({ openConnectModal }) => (
          <button
            type="button"
            onClick={() => {
              // Always use RainbowKit's openConnectModal for wallet connection
              openConnectModal()
            }}
            className="cursor-pointer bg-transparent border-none p-0 w-full"
          >
            {children}
          </button>
        )}
      </ConnectButton.Custom>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card
        className={cn('border border-border text-foreground bg-card', className)}
        data-testid="leverage-token-holdings-card"
      >
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Current Holdings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-6">
            {/* Holdings Display - Conditional on Wallet Connection */}
            {isConnected ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  {collateralAsset && debtAsset ? (
                    <div className="flex -space-x-1">
                      <AssetDisplay asset={collateralAsset} size="md" variant="logo-only" />
                      <AssetDisplay asset={debtAsset} size="md" variant="logo-only" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full border-2 border-border bg-card flex items-center justify-center overflow-hidden">
                      <Zap className="w-4 h-4 text-brand-purple" />
                    </div>
                  )}
                  <div className="text-xl font-medium text-foreground">
                    {isLoading ? (
                      <Skeleton className="h-6 w-32" />
                    ) : (
                      `${userPosition.balance} ${userPosition.shareToken}`
                    )}
                  </div>
                </div>

                <div className="text-secondary-foreground">
                  {isLoading ? <Skeleton className="h-4 w-24" /> : userPosition.balanceUSD}
                </div>

                {userPosition.allTimePercentage && (
                  <div className="text-foreground">
                    <span className="font-medium">{userPosition.balanceUSD}</span>
                    <span className="text-secondary-foreground ml-2">
                      ({userPosition.allTimePercentage})
                    </span>
                    <span className="text-muted-foreground ml-2">All time</span>
                  </div>
                )}
              </div>
            ) : (
              /* Wallet Not Connected - Holdings Preview */
              <div className="rounded-lg p-4 border border-border bg-card">
                {renderConnectButton(
                  <div className="flex items-center space-x-3">
                    {collateralAsset && debtAsset ? (
                      <div className="flex -space-x-1">
                        <AssetDisplay asset={collateralAsset} size="md" variant="logo-only" />
                        <AssetDisplay asset={debtAsset} size="md" variant="logo-only" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-accent">
                        <Zap className="w-5 h-5 text-brand-purple" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-foreground text-left">Connect Your Wallet</h3>
                      <p className="text-sm text-secondary-foreground">
                        View holdings and start minting
                      </p>
                    </div>
                  </div>,
                )}
              </div>
            )}

            {/* Action Buttons - Always Visible */}
            <div className="flex space-x-3">
              {isConnected ? (
                <>
                  <div className="flex-1 min-w-0">
                    <Button
                      data-test-id="mint-button"
                      type="button"
                      onClick={handleMintClick}
                      variant="gradient"
                      className="w-full lg:min-w-[112px]"
                    >
                      <Plus className="w-4 h-4" />
                      Mint
                    </Button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Button
                      type="button"
                      onClick={handleRedeemClick}
                      variant="outline"
                      disabled={!userPosition.hasPosition}
                      className="w-full lg:min-w-[112px] border-[var(--divider-line)] text-secondary-foreground hover:bg-[color-mix(in_srgb,var(--surface-elevated) 35%,transparent)]"
                    >
                      <Minus className="w-4 h-4" />
                      Redeem
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {renderConnectButton(
                    <div className="w-full lg:min-w-[112px] flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 border border-transparent bg-cta-gradient hover:bg-cta-hover-gradient active:bg-cta-active-gradient">
                      <Plus className="w-4 h-4" />
                      Mint
                    </div>,
                  )}
                  {renderConnectButton(
                    <div className="w-full lg:min-w-[112px] border border-[var(--divider-line)] text-secondary-foreground hover:bg-[color-mix(in_srgb,var(--surface-elevated) 35%,transparent)] flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 bg-transparent">
                      <Minus className="w-4 h-4" />
                      Redeem
                    </div>,
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
