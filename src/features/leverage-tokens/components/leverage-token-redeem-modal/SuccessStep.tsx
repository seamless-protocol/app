import { CheckCircle, ExternalLink, TrendingDown } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Card } from '../../../../components/ui/card'
import { useExplorer } from '../../../../lib/hooks/useExplorer'

interface SuccessStepProps {
  amount: string
  expectedAmount: string
  selectedAsset: string
  transactionHash: string
  onClose: () => void
}

export function SuccessStep({
  amount,
  expectedAmount,
  selectedAsset,
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
        <h3 className="mb-2 text-lg font-medium text-[var(--text-primary)]">
          Redemption Completed!
        </h3>
        <p className="mx-auto max-w-sm text-[var(--text-secondary)]">
          Your {amount} leverage tokens have been successfully redeemed for {expectedAmount}{' '}
          {selectedAsset}.
        </p>
      </div>

      <Card
        variant="gradient"
        className="border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] p-4"
      >
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Redeemed</span>
            <span className="text-[var(--text-primary)]">{amount} tokens</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Received</span>
            <span className="text-[var(--text-primary)]">
              {expectedAmount} {selectedAsset}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)]">Transaction</span>
            <button
              type="button"
              onClick={() => window.open(txUrl, '_blank')}
              className="text-purple-400 hover:underline flex items-center"
            >
              View on {explorer.name}
              <ExternalLink className="h-3 w-3 ml-1" />
            </button>
          </div>
        </div>
      </Card>

      <Card
        variant="gradient"
        className="border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] p-4"
      >
        <div className="flex items-start text-sm text-[var(--text-secondary)]">
          <TrendingDown className="mr-2 mt-0.5 h-4 w-4 text-[var(--brand-secondary)]" />
          <div>
            <p className="font-medium text-[var(--text-primary)]">Redemption complete</p>
            <p className="mt-1 text-xs">
              Your {selectedAsset} has been transferred to your wallet. Track your remaining
              positions in your Portfolio.
            </p>
          </div>
        </div>
      </Card>

      <Button onClick={onClose} variant="gradient" className="h-12 w-full font-medium">
        Done
      </Button>
    </div>
  )
}
