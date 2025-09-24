import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'
import { Minus, Plus, Zap } from 'lucide-react'
import { useAccount } from 'wagmi'
import { AssetDisplay } from '@/components/ui/asset-display'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

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
          <div
            onClick={() => {
              // Always use RainbowKit's openConnectModal for wallet connection
              openConnectModal()
            }}
            className="cursor-pointer w-full"
          >
            {children}
          </div>
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
        className={`bg-slate-900/80 border-slate-700 ${className}`}
        data-testid="leverage-token-holdings-card"
      >
        <CardHeader>
          <CardTitle className="text-lg text-white">Current Holdings</CardTitle>
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
                    <div className="w-8 h-8 rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center overflow-hidden">
                      <Zap className="w-4 h-4 text-purple-400" />
                    </div>
                  )}
                  <div className="text-xl font-medium text-white">
                    {isLoading ? (
                      <Skeleton className="h-6 w-32" />
                    ) : (
                      `${userPosition.balance} ${userPosition.shareToken}`
                    )}
                  </div>
                </div>

                <div className="text-slate-400">
                  {isLoading ? <Skeleton className="h-4 w-24" /> : userPosition.balanceUSD}
                </div>

                {userPosition.allTimePercentage && (
                  <div className="text-white">
                    <span className="font-medium">{userPosition.balanceUSD}</span>
                    <span className="text-slate-400 ml-2">({userPosition.allTimePercentage})</span>
                    <span className="text-slate-500 ml-2">All time</span>
                  </div>
                )}
              </div>
            ) : (
              /* Wallet Not Connected - Holdings Preview */
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                {renderConnectButton(
                  <div className="flex items-center space-x-3">
                    {collateralAsset && debtAsset ? (
                      <div className="flex -space-x-1">
                        <AssetDisplay asset={collateralAsset} size="md" variant="logo-only" />
                        <AssetDisplay asset={debtAsset} size="md" variant="logo-only" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                        <Zap className="w-5 h-5 text-purple-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-white text-left">Connect Your Wallet</h3>
                      <p className="text-sm text-slate-400">View holdings and start minting</p>
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
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Mint
                    </Button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Button
                      type="button"
                      onClick={handleRedeemClick}
                      variant="outline"
                      disabled={!userPosition.hasPosition}
                      className="border-slate-600 text-slate-300 hover:bg-slate-800 w-full"
                    >
                      <Minus className="w-4 h-4 mr-2" />
                      Redeem
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {renderConnectButton(
                    <div className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors h-10 px-4 py-2">
                      <Plus className="w-4 h-4 mr-2" />
                      Mint
                    </div>,
                  )}
                  {renderConnectButton(
                    <div className="w-full border border-slate-600 text-slate-300 hover:bg-slate-800 flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 bg-transparent">
                      <Minus className="w-4 h-4 mr-2" />
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
