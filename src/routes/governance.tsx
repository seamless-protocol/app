import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/governance')({
  component: GovernancePage,
})

function GovernancePage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Governance</h1>
        <p className="text-muted-foreground mt-2">Participate in Seamless Protocol governance</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Proposals</CardTitle>
            <CardDescription>Vote on current proposals</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No active proposals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Past Proposals</CardTitle>
            <CardDescription>View completed governance actions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No past proposals</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
