import { ConnectButton } from '@rainbow-me/rainbowkit'
import { motion } from 'framer-motion'
import { Minus, Plus, Zap } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Fallback component for when KyberSwapWidget is not available (e.g., in Storybook)
function KyberSwapWidgetFallback() {
  return (
    <div className="bg-slate-800 rounded-lg p-8 text-center">
      <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <Zap className="w-8 h-8 text-purple-400" />
      </div>
      <h3 className="text-white font-medium mb-2">KyberSwap Widget</h3>
      <p className="text-slate-400 text-sm mb-4">
        TODO: Update KyberSwap widget params once they support leverage tokens
      </p>
      <p className="text-slate-500 text-xs">
        This would open the actual KyberSwap widget for minting/redeeming leverage tokens
      </p>
    </div>
  )
}

interface UserPosition {
  hasPosition: boolean
  balance: string
  balanceUSD: string
  allTimePercentage: string
  shareToken: string
  isConnected?: boolean // Optional since we use real wallet state
}

interface LeverageTokenHoldingsCardProps {
  userPosition: UserPosition
  onConnectWallet?: () => void
  onMint?: () => void
  onRedeem?: () => void
  className?: string
}

export function LeverageTokenHoldingsCard({
  userPosition,
  onConnectWallet,
  onMint,
  onRedeem,
  className = '',
}: LeverageTokenHoldingsCardProps) {
  const [showKyberSwapWidget, setShowKyberSwapWidget] = useState(false)

  // Use real wallet connection state from wagmi
  const { isConnected } = useAccount()

  const handleMintClick = () => {
    if (isConnected) {
      if (onMint) {
        onMint()
      } else {
        // TODO: Update KyberSwap widget params once they support leverage tokens
        setShowKyberSwapWidget(true)
      }
    } else {
      onConnectWallet?.()
    }
  }

  const handleRedeemClick = () => {
    if (isConnected) {
      if (onRedeem) {
        onRedeem()
      } else {
        // TODO: Update KyberSwap widget params once they support leverage tokens
        setShowKyberSwapWidget(true)
      }
    } else {
      onConnectWallet?.()
    }
  }

  // Try to load KyberSwapWidget, fallback to mock for Storybook
  const renderKyberSwapWidget = () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { KyberSwapWidget: Widget } = require('@/components/KyberSwapWidget')
      return <Widget />
    } catch {
      return <KyberSwapWidgetFallback />
    }
  }

  // Render ConnectButton with proper RainbowKit integration
  const renderConnectButton = (children: React.ReactNode, onClick?: () => void) => {
    return (
      <ConnectButton.Custom>
        {({ openConnectModal }) => (
          <button
            type="button"
            onClick={() => {
              // Always use RainbowKit's openConnectModal for wallet connection
              openConnectModal()
              // Also call the custom onClick if provided (for analytics, etc.)
              onClick?.()
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
                  <div className="w-8 h-8 rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center overflow-hidden">
                    <Zap className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-xl font-medium text-white">
                    {userPosition.balance} {userPosition.shareToken}
                  </div>
                </div>

                <div className="text-slate-400">{userPosition.balanceUSD}</div>

                <div className="text-white">
                  <span className="font-medium">{userPosition.balanceUSD}</span>
                  <span className="text-slate-400 ml-2">({userPosition.allTimePercentage}%)</span>
                  <span className="text-slate-500 ml-2">All time</span>
                </div>
              </div>
            ) : (
              /* Wallet Not Connected - Holdings Preview */
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                {renderConnectButton(
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                      <Zap className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">Connect Your Wallet</h3>
                      <p className="text-sm text-slate-400">View holdings and start minting</p>
                    </div>
                  </div>,
                  onConnectWallet,
                )}
              </div>
            )}

            {/* Action Buttons - Always Visible */}
            <div className="flex space-x-3">
              {isConnected ? (
                <>
                  <div className="flex-1 min-w-0">
                    <Button
                      onClick={handleMintClick}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Mint
                    </Button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Button
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
                    onConnectWallet,
                  )}
                  {renderConnectButton(
                    <div className="w-full border border-slate-600 text-slate-300 hover:bg-slate-800 flex-1 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors h-10 px-4 py-2 bg-transparent">
                      <Minus className="w-4 h-4 mr-2" />
                      Redeem
                    </div>,
                    onConnectWallet,
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KyberSwap Widget Modal */}
      {showKyberSwapWidget &&
        createPortal(
          <div
            data-state="open"
            data-slot="dialog-overlay"
            className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50"
            style={{ pointerEvents: 'auto' }}
            data-aria-hidden="true"
            aria-hidden="true"
            onClick={(e) => {
              // Close modal when clicking backdrop
              if (e.target === e.currentTarget) {
                setShowKyberSwapWidget(false)
              }
            }}
          >
            <div className="flex items-center justify-center min-h-screen p-4 relative">
              {/* Close Button - positioned relative to screen */}
              <button
                type="button"
                onClick={() => setShowKyberSwapWidget(false)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-800/90 backdrop-blur-sm text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-50 flex items-center justify-center text-xl font-light"
                aria-label="Close swap widget"
              >
                ×
              </button>

              {/* Widget Container */}
              <div className="kyber-swap-widget">{renderKyberSwapWidget()}</div>
            </div>
          </div>,
          document.body,
        )}
    </motion.div>
  )
}
