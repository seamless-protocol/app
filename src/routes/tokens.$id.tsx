import { MintForm } from '@/features/leverage-tokens'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/tokens/$id')({
  component: () => {
    const { id } = Route.useParams()

    // For now, hardcode the token info - in production this would come from an API
    const weETHToken = {
      address: id as `0x${string}`,
      name: 'weETH / WETH 17x Leverage Token',
      symbol: 'WEETH-WETH-17x',
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

        {/* Mint Form */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Mint Tokens</h2>
          <MintForm tokenAddress={weETHToken.address} tokenName={weETHToken.name} />
        </div>
      </div>
    )
  },
})
