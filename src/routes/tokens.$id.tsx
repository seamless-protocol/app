import { createFileRoute } from '@tanstack/react-router'
import { useAccount } from 'wagmi'
import { LeverageTokenHoldingsCard } from '@/features/leverage-tokens/components/LeverageTokenHoldingsCard'

export const Route = createFileRoute('/tokens/$id')({
  component: () => {
    const { id } = Route.useParams()
    const { isConnected } = useAccount()

    // For now, hardcode the token info - in production this would come from an API
    const weETHToken = {
      address: id as `0x${string}`,
      name: 'weETH / WETH 17x Leverage Token',
      symbol: 'WEETH-WETH-17x',
    }

    // Mock user position data - in production this would come from hooks/API
    const mockUserPosition = {
      hasPosition: true,
      balance: '0.00',
      balanceUSD: '$0.00',
      allTimePercentage: '0.0000',
      shareToken: 'WEETH-WETH-17x',
      isConnected,
    }

    const handleMint = () => {
      // TODO: Implement mint modal/functionality
      console.log('Mint clicked')
    }

    const handleRedeem = () => {
      // TODO: Implement redeem modal/functionality
      console.log('Redeem clicked')
    }

    const handleConnectWallet = () => {
      // TODO: Implement wallet connection
      console.log('Connect wallet clicked')
    }

    return (
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{weETHToken.name}</h1>
          <p className="text-muted-foreground">Manage your leverage token position</p>
        </div>

        {/* Current Holdings */}
        <LeverageTokenHoldingsCard
          userPosition={mockUserPosition}
          onMint={handleMint}
          onRedeem={handleRedeem}
          onConnectWallet={handleConnectWallet}
        />

        {/* Token Info */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Token Information</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Name</h3>
              <p className="text-muted-foreground">{weETHToken.name}</p>
            </div>
            <div>
              <h3 className="font-medium">Symbol</h3>
              <p className="text-muted-foreground">{weETHToken.symbol}</p>
            </div>
            <div>
              <h3 className="font-medium">Address</h3>
              <p className="text-muted-foreground font-mono text-sm">{weETHToken.address}</p>
            </div>
            <div>
              <h3 className="font-medium">Leverage Ratio</h3>
              <p className="text-muted-foreground">17x</p>
            </div>
            <div>
              <h3 className="font-medium">Underlying Asset</h3>
              <p className="text-muted-foreground">WETH</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
})
