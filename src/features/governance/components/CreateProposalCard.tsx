import { ExternalLink, Zap } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'

export function CreateProposalCard() {
  return (
    <div className="w-full p-6">
      <Card className="border border-border bg-card text-foreground">
        <CardHeader>
          <CardTitle className="text-foreground">Create New Proposal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-[color-mix(in_srgb,var(--brand-purple)_18%,transparent)] text-brand-purple">
              <Zap className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Proposal Creation</h3>
            <p className="text-secondary-foreground mb-4 max-w-md mx-auto">
              To create a proposal, you need at least 100,000 SEAM tokens or delegation from other
              community members.
            </p>
            <Button variant="gradient">
              <ExternalLink className="h-4 w-4 mr-2" />
              Learn More
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
