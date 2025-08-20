import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WalletInfo } from '../components/WalletInfo'

export const Route = createFileRoute('/')({
  component: () => (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Welcome to Seamless Protocol</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>DeFi Made Simple</CardTitle>
          <CardDescription>Leverage strategies wrapped into simple ERC-20 tokens</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Experience the power of decentralized finance without the complexity. Our protocol makes
            advanced DeFi strategies accessible to everyone.
          </p>
          <div className="flex gap-2">
            <Button>Get Started</Button>
            <Button variant="outline">Learn More</Button>
          </div>
        </CardContent>
      </Card>

      <WalletInfo />
    </div>
  ),
})
