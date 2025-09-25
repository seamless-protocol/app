import { Loader2 } from 'lucide-react'
import { Card } from '../../../../components/ui/card'

interface LeverageTokenConfig {
  symbol: string
  name: string
  leverageRatio: number
}

interface PendingStepProps {
  amount: string
  leverageTokenConfig: LeverageTokenConfig
}

export function PendingStep({ amount, leverageTokenConfig }: PendingStepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--brand-secondary) 20%,transparent)]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-secondary)]" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-[var(--text-primary)]">
          Processing Redemption
        </h3>
        <p className="mx-auto max-w-sm text-[var(--text-secondary)]">
          Your redemption is being processed. This may take a few moments.
        </p>
      </div>

      <Card
        variant="gradient"
        className="border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] p-4"
      >
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Amount</span>
            <span className="text-[var(--text-primary)]">{amount} tokens</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Leverage Token</span>
            <span className="text-[var(--text-primary)]">{leverageTokenConfig.symbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Status</span>
            <span className="text-[var(--state-warning-text)]">Processing...</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
