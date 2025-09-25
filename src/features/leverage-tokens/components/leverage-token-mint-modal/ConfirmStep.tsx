import { ArrowDownUp, TrendingUp, Zap } from 'lucide-react'
import { AssetDisplay } from '../../../../components/ui/asset-display'
import { Button } from '../../../../components/ui/button'
import { Card } from '../../../../components/ui/card'

interface Token {
  symbol: string
  name: string
  balance: string
  price: number
  logo?: string
}

interface LeverageTokenConfig {
  symbol: string
  name: string
  leverageRatio: number
}

interface ConfirmStepProps {
  selectedToken: Token
  amount: string
  expectedTokens: string
  leverageTokenConfig: LeverageTokenConfig
  onConfirm: () => void
}

export function ConfirmStep({
  selectedToken,
  amount,
  expectedTokens,
  leverageTokenConfig,
  onConfirm,
}: ConfirmStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-medium text-[var(--text-primary)]">Confirm Mint</h3>
        <p className="text-[var(--text-secondary)]">
          Review your mint details and confirm the transaction
        </p>
      </div>

      <Card
        variant="gradient"
        className="gap-0 border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] p-4"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">Minting</span>
            <div className="flex items-center">
              <span className="mr-2 font-medium text-[var(--text-primary)]">
                {amount} {selectedToken.symbol}
              </span>
              <AssetDisplay asset={selectedToken} size="sm" variant="logo-only" />
            </div>
          </div>

          <div className="flex justify-center py-2">
            <ArrowDownUp className="h-4 w-4 text-[var(--text-muted)]" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">Receiving</span>
            <div className="flex items-center">
              <span className="mr-2 font-medium text-[var(--text-primary)]">
                {expectedTokens} tokens
              </span>
              <TrendingUp className="h-4 w-4 text-[var(--brand-secondary)]" />
            </div>
          </div>
        </div>
      </Card>

      <Card
        variant="gradient"
        className="border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] p-4"
      >
        <h4 className="mb-3 text-sm font-medium text-[var(--text-primary)]">Final Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Leverage Token</span>
            <span className="text-[var(--text-primary)]">{leverageTokenConfig.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Target Leverage</span>
            <span className="text-[var(--brand-secondary)]">
              {leverageTokenConfig.leverageRatio}x
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Estimated Gas</span>
            <span className="text-[var(--text-primary)]">$3.50</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Total Cost</span>
            <span className="text-[var(--text-primary)]">
              {amount} {selectedToken.symbol} + Gas
            </span>
          </div>
        </div>
      </Card>

      <Button onClick={onConfirm} variant="gradient" className="h-12 w-full font-medium">
        <Zap className="mr-2 h-4 w-4" />
        Confirm Mint
      </Button>
    </div>
  )
}
