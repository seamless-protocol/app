import { CheckCircle, ExternalLink } from 'lucide-react'
import { Alert } from '../../../../components/ui/alert'
import { Button } from '../../../../components/ui/button'
import { Card } from '../../../../components/ui/card'

interface Token {
  symbol: string
  name: string
  balance: string
  price: number
  logo?: string
}

interface SuccessStepProps {
  selectedToken: Token
  amount: string
  expectedTokens: string
  transactionHash: string
  onClose: () => void
}

export function SuccessStep({
  selectedToken,
  amount,
  expectedTokens,
  transactionHash,
  onClose,
}: SuccessStepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--state-success-text) 20%,transparent)]">
          <CheckCircle className="h-8 w-8 text-[var(--state-success-text)]" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-[var(--text-primary)]">Mint Successful!</h3>
        <p className="mx-auto max-w-sm text-[var(--text-secondary)]">
          Your {amount} {selectedToken.symbol} has been successfully minted into {expectedTokens}{' '}
          leverage tokens.
        </p>
      </div>

      <Card
        variant="gradient"
        className="border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] p-4"
      >
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Minted</span>
            <span className="text-[var(--text-primary)]">
              {amount} {selectedToken.symbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Received</span>
            <span className="text-[var(--text-primary)]">{expectedTokens} tokens</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)]">Transaction</span>
            <button
              type="button"
              onClick={() => window.open(`https://etherscan.io/tx/${transactionHash}`, '_blank')}
              className="flex items-center text-[var(--brand-secondary)] underline-offset-2 transition-colors hover:text-[color-mix(in_srgb,var(--brand-secondary) 85%,black 15%)] hover:underline"
            >
              View on Etherscan
              <ExternalLink className="ml-1 h-3 w-3" />
            </button>
          </div>
        </div>
      </Card>

      <Alert
        type="success"
        title="Leverage position active!"
        description="Your leverage tokens are now earning yield with leverage."
      />

      <Button onClick={onClose} variant="gradient" className="h-12 w-full font-medium">
        Done
      </Button>
    </div>
  )
}
