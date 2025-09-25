import { Loader2 } from 'lucide-react'
import { Card } from '../../../../components/ui/card'

interface Token {
  symbol: string
  name: string
  balance: string
  price: number
  logo?: string
}

interface ApproveStepProps {
  selectedToken: Token
  amount: string
  isApproving: boolean
}

export function ApproveStep({ selectedToken, amount, isApproving }: ApproveStepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--brand-secondary) 20%,transparent)]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-secondary)]" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-[var(--text-primary)]">
          Approve Token Spending
        </h3>
        <p className="mx-auto max-w-sm text-[var(--text-secondary)]">
          {isApproving
            ? 'Confirm the approval transaction in your wallet...'
            : `Approve the contract to spend your ${selectedToken.symbol}. This is a one-time approval for this token.`}
        </p>
      </div>

      <Card
        variant="gradient"
        className="border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] p-4"
      >
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Token</span>
            <span className="text-[var(--text-primary)]">{selectedToken.symbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Amount to approve</span>
            <span className="text-[var(--text-primary)]">
              {isApproving ? 'Max' : amount} {selectedToken.symbol}
            </span>
          </div>
          {isApproving && (
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Status</span>
              <span className="text-[var(--state-warning-text)]">Confirming...</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
