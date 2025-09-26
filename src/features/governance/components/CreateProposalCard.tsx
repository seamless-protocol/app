import { ExternalLink, Zap } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'

export function CreateProposalCard() {
  return (
    <div className="w-full p-6">
      <Card className="border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)]">
        <CardHeader>
          <CardTitle className="text-[var(--text-primary)]">Create New Proposal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[color-mix(in_srgb,var(--brand-secondary) 20%,transparent)] rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-[var(--brand-secondary)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Proposal Creation</h3>
            <p className="text-[var(--text-secondary)] mb-4 max-w-md mx-auto">
              To create a proposal, you need at least 100,000 SEAM tokens or delegation from other
              community members.
            </p>
            <Button className="bg-gradient-to-r from-[var(--brand-secondary)] to-[var(--brand-primary)] hover:from-purple-500 hover:to-pink-500 text-white">
              <ExternalLink className="h-4 w-4 mr-2" />
              Learn More
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
