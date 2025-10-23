import { ExternalLink, Loader2 } from 'lucide-react'
import { getTxExplorerInfo } from '@/lib/utils/block-explorer'
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
  chainId?: number
  transactionHash?: `0x${string}` | undefined
  mode?: 'awaitingWallet' | 'onChain'
}

export function ApproveStep({
  selectedToken,
  amount,
  isApproving,
  chainId,
  transactionHash,
  mode = 'awaitingWallet',
}: ApproveStepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
          <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-foreground">Approve Token Spending</h3>
        {mode === 'awaitingWallet' ? (
          <p className="mx-auto max-w-sm text-secondary-foreground" aria-live="polite">
            Confirm the approval transaction in your wallet to continue.
          </p>
        ) : (
          <p className="mx-auto max-w-sm text-secondary-foreground" aria-live="polite">
            Waiting for on-chain confirmation. This may take a moment.
          </p>
        )}
      </div>

      <Card variant="gradient" className="border border-border bg-card p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-secondary-foreground">Amount to approve</span>
            <span className="text-foreground">
              {amount} {selectedToken.symbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary-foreground">Status</span>
            <span className="text-[var(--state-warning-text)]">
              {mode === 'awaitingWallet'
                ? 'Awaiting wallet confirmation…'
                : 'Waiting for on-chain confirmation…'}
            </span>
          </div>
          {mode === 'onChain' && transactionHash && typeof chainId === 'number' ? (
            <div className="flex items-center justify-between">
              <span className="text-secondary-foreground">Transaction</span>
              {(() => {
                const info = getTxExplorerInfo(chainId, transactionHash)
                return (
                  <a
                    href={info.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-purple hover:underline flex items-center"
                  >
                    View on explorer
                    <ExternalLink className="h-3 w-3 ml-0.5" />
                  </a>
                )
              })()}
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
