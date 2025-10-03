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
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
          <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-foreground">Approve Token Spending</h3>
        <p className="mx-auto max-w-sm text-secondary-foreground">
          {isApproving
            ? 'Confirm the approval transaction in your wallet...'
            : `Approve the contract to spend your ${selectedToken.symbol}. This is a one-time approval for this token.`}
        </p>
      </div>

      <Card variant="gradient" className="border border-border bg-card p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-secondary-foreground">Token</span>
            <span className="text-foreground">{selectedToken.symbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary-foreground">Amount to approve</span>
            <span className="text-foreground">
              {isApproving ? 'Max' : amount} {selectedToken.symbol}
            </span>
          </div>
          {isApproving && (
            <div className="flex justify-between">
              <span className="text-secondary-foreground">Status</span>
              <span className="text-[var(--state-warning-text)]">Confirming...</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
