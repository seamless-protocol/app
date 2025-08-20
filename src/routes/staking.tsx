import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/staking')({
  component: StakingPage,
})

function StakingPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Staking</h1>
        <p className="text-muted-foreground mt-2">Stake SEAM tokens to earn rewards</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Staked</CardTitle>
            <CardDescription>Platform-wide staking</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0 SEAM</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>APR</CardTitle>
            <CardDescription>Current staking rewards</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Stake</CardTitle>
            <CardDescription>Your staked balance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0 SEAM</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
