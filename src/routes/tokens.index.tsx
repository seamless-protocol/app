import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/tokens/')({
  component: () => {
    // Hardcoded token for now
    const weETHToken = {
      address: '0xA2fceEAe99d2cAeEe978DA27bE2d95b0381dBB8c' as `0x${string}`,
      name: 'weETH / WETH 17x Leverage Token',
      symbol: 'WEETH-WETH-17x',
    }

    return (
      <div>
        <div className="mb-8">
          <h3 className="text-3xl font-bold mb-2">Leverage Tokens</h3>
          <p className="text-muted-foreground">Browse and manage leverage tokens.</p>
        </div>

        {/* Token Selection */}
        <div className="mb-8">
          <Link to="/tokens/$id" params={{ id: weETHToken.address }}>
            <Card className="max-w-md hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">{weETHToken.name}</CardTitle>
                <CardDescription>{weETHToken.address}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Click to view details and mint tokens
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    )
  },
})
