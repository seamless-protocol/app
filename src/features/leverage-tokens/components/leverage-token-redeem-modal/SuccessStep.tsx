import { CheckCircle, ExternalLink, TrendingDown } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Card } from '../../../../components/ui/card'
import { useExplorer } from '../../../../lib/hooks/useExplorer'

interface SuccessStepProps {
  amount: string
  expectedAmount: string
  selectedAsset: string
  leverageTokenSymbol: string
  transactionHash: string
  onClose: () => void
}

export function SuccessStep({
  amount,
  expectedAmount,
  selectedAsset,
  leverageTokenSymbol,
  transactionHash,
  onClose,
}: SuccessStepProps) {
  const explorer = useExplorer()
  const txUrl = explorer.txUrl(transactionHash)
  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--state-success-text) 20%,transparent)]">
          <CheckCircle className="h-8 w-8 text-[var(--state-success-text)]" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Redemption Completed!</h3>
        <p className="text-secondary-foreground text-center max-w-sm">
          Your {amount} {leverageTokenSymbol} have been successfully redeemed for {expectedAmount}{' '}
          {selectedAsset}.
        </p>
      </div>

      <Card variant="gradient" className="border border-border bg-card p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-secondary-foreground">Redeemed</span>
            <span className="text-foreground">
              {amount} {leverageTokenSymbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary-foreground">Received</span>
            <span className="text-foreground">
              {expectedAmount} {selectedAsset}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-secondary-foreground">Transaction</span>
            <button
              type="button"
              onClick={() => window.open(txUrl, '_blank')}
              className="text-brand-purple hover:underline flex items-center hover:cursor-pointer"
            >
              View on explorer
              <ExternalLink className="h-3 w-3 ml-1" />
            </button>
          </div>
        </div>
      </Card>

      <Card variant="gradient" className="border border-border bg-card p-4">
        <div className="text-sm text-secondary-foreground">
          <p className="font-medium text-foreground flex items-center justify-center">
            <TrendingDown className="mr-1.5 h-4 w-4 text-brand-purple" />
            Redemption complete
          </p>
          <p className="mt-1 text-xs">
            Your {selectedAsset} has been transferred to your wallet. Track your remaining positions
            in your Portfolio.
          </p>
        </div>
      </Card>

      <Button onClick={onClose} variant="gradient" size="lg" className="w-full font-medium">
        Done
      </Button>
    </div>
  )
}
