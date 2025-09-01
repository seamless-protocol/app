import { Minus, Plus, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface UserPosition {
  hasPosition: boolean
  balance: string
  balanceUSD: string
  allTimePercentage: string
  shareToken: string
  isConnected: boolean
}

interface LeverageTokenHoldingsCardProps {
  userPosition: UserPosition
  onMint?: () => void
  onRedeem?: () => void
  onConnectWallet?: () => void
  className?: string
}

export function LeverageTokenHoldingsCard({
  userPosition,
  onMint,
  onRedeem,
  onConnectWallet,
  className = '',
}: LeverageTokenHoldingsCardProps) {
  return (
    <Card variant="gradient" className={className} data-testid="leverage-token-holdings-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-white">Current Holdings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!userPosition.isConnected ? (
          // Disconnected State
          <Card variant="default" className="p-4">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500/30 to-purple-600/30 rounded-xl mx-auto">
                <Zap className="h-6 w-6 text-purple-300" />
              </div>
              <div>
                <h3 className="text-white font-medium">Connect Your Wallet</h3>
                <p className="text-sm text-slate-400 mt-1">View holdings and start minting</p>
              </div>
            </div>
          </Card>
        ) : (
          // Connected State
          <div className="space-y-3">
            {/* Token Balance */}
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {userPosition.balance} {userPosition.shareToken}
              </div>
              <div className="text-sm text-slate-400">
                {userPosition.balanceUSD} ({userPosition.allTimePercentage}% All Time)
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-2">
          <Button
            onClick={userPosition.isConnected ? onMint : onConnectWallet}
            variant="gradient"
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-2" />
            Mint
          </Button>
          <Button
            onClick={userPosition.isConnected ? onRedeem : onConnectWallet}
            variant="outline"
            disabled={userPosition.isConnected && !userPosition.hasPosition}
            className="flex-1"
          >
            <Minus className="w-4 h-4 mr-2" />
            Redeem
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
