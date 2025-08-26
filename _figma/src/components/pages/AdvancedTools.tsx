import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Alert, AlertDescription } from "../ui/alert"
import { 
  Vote, 
  Shield, 
  Info,
  ExternalLink 
} from "lucide-react"

export function Governance() {


  const governanceProposals = [
    {
      id: 'PROP-001',
      title: 'Increase USDC Lending Pool Cap',
      status: 'Active',
      endsIn: '3 days',
      votingPower: '1,250 SEAM'
    },
    {
      id: 'PROP-002', 
      title: 'Add new BTC-USD Strategy',
      status: 'Draft',
      endsIn: '7 days',
      votingPower: '1,250 SEAM'
    }
  ]



  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-dark-primary">Governance</h1>
        <p className="text-dark-secondary">
          Participate in protocol governance and shape the future of Seamless
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="bg-dark-card border-divider-line">
        <Info className="h-4 w-4 text-brand-purple" />
        <AlertDescription className="text-dark-secondary">
          Governance features are being migrated from Legacy Mode. Some features may redirect 
          to the legacy interface temporarily.
        </AlertDescription>
      </Alert>



      {/* Governance Section */}
      <Card className="bg-dark-card border-divider-line">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-dark-primary">
            <Vote className="h-5 w-5 text-brand-purple" />
            <span>Active Proposals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-dark-secondary mb-4">
            Vote on protocol proposals and help shape the future of Seamless Protocol
          </p>
          
          <div className="space-y-4">
            {governanceProposals.map((proposal) => (
              <div key={proposal.id} className="p-4 border border-divider-line rounded-lg bg-dark-elevated">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-dark-primary">{proposal.title}</h4>
                    <p className="text-sm text-dark-muted">{proposal.id}</p>
                  </div>
                  <Badge 
                    variant={proposal.status === 'Active' ? 'default' : 'secondary'}
                    className={proposal.status === 'Active' 
                      ? 'bg-success-green/20 text-success-green border-success-green/30'
                      : 'bg-dark-elevated text-dark-secondary border-divider-line'
                    }
                  >
                    {proposal.status}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-dark-muted">
                    Voting ends in {proposal.endsIn}
                  </span>
                  <span className="text-dark-muted">
                    Your power: {proposal.votingPower}
                  </span>
                </div>
                
                <div className="flex space-x-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-success-green/30 text-success-green hover:bg-success-green/10"
                  >
                    Vote For
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-error-red/30 text-error-red hover:bg-error-red/10"
                  >
                    Vote Against
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-dark-secondary hover:text-dark-primary hover:bg-dark-elevated"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>



      {/* Voting Power */}
      <Card className="bg-dark-card border-divider-line">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-dark-primary">
            <Shield className="h-5 w-5 text-brand-purple" />
            <span>Your Voting Power</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="text-3xl font-semibold text-dark-primary mb-2">1,250 SEAM</div>
            <p className="text-dark-secondary mb-4">
              Your current voting power in the protocol
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-dark-elevated rounded-lg border border-divider-line">
                <div className="text-dark-muted">Delegated</div>
                <div className="font-medium text-dark-primary">0 SEAM</div>
              </div>
              <div className="p-3 bg-dark-elevated rounded-lg border border-divider-line">
                <div className="text-dark-muted">Available</div>
                <div className="font-medium text-dark-primary">1,250 SEAM</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legacy Mode Redirect */}
      <Card className="border-dashed border-divider-line bg-dark-card">
        <CardContent className="text-center py-8">
          <h3 className="font-medium mb-2 text-dark-primary">Need more governance features?</h3>
          <p className="text-dark-secondary mb-4">
            Some governance tools are still available in Legacy Mode while we complete the migration
          </p>
          <Button 
            variant="outline" 
            className="border-divider-line text-dark-secondary hover:bg-dark-elevated"
          >
            Go to Legacy Mode
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}