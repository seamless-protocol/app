import { ArrowDown, TrendingUp, Zap } from 'lucide-react'
import { AssetDisplay } from '../../../../components/ui/asset-display'
import { Button } from '../../../../components/ui/button'
import { Card } from '../../../../components/ui/card'
import { Skeleton } from '../../../../components/ui/skeleton'
import { useTransactionGasEstimate } from '../../../../lib/hooks/useGasEstimate'

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
  chainId: number
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
  // Get real-time gas estimation
  const {
    estimatedCostUsd,
    isLoading: isGasLoading,
    isError: isGasError,
  } = useTransactionGasEstimate({
    chainId: leverageTokenConfig.chainId,
    transactionType: 'mint',
    enabled: Boolean(leverageTokenConfig.chainId),
  })

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-medium text-foreground">Confirm Mint</h3>
        <p className="text-secondary-foreground">
          Review your mint details and confirm the transaction
        </p>
      </div>

      <Card variant="gradient" className="gap-0 border border-border bg-card p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary-foreground">Minting</span>
            <div className="flex items-center">
              <span className="mr-2 font-medium text-foreground">
                {amount} {selectedToken.symbol}
              </span>
              <AssetDisplay asset={selectedToken} size="sm" variant="logo-only" />
            </div>
          </div>

          <div className="flex justify-center py-2">
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary-foreground">Receiving</span>
            <div className="flex items-center">
              <span className="mr-2 font-medium text-foreground">{expectedTokens} tokens</span>
              <TrendingUp className="h-4 w-4 text-brand-purple" />
            </div>
          </div>
        </div>
      </Card>

      <Card variant="gradient" className="border border-border bg-card p-4">
        <h4 className="mb-3 text-sm font-medium text-foreground">Final Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-secondary-foreground">Leverage Token</span>
            <span className="text-foreground">{leverageTokenConfig.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary-foreground">Target Leverage</span>
            <span className="text-brand-purple">{leverageTokenConfig.leverageRatio}x</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary-foreground">Estimated Gas</span>
            {isGasLoading ? (
              <Skeleton className="h-4 w-16" />
            ) : isGasError ? (
              <span className="text-[var(--state-error-text)]">Unable to estimate</span>
            ) : (
              <span className="text-foreground">{estimatedCostUsd}</span>
            )}
          </div>
          <div className="flex justify-between">
            <span className="text-secondary-foreground">Total Cost</span>
            <span className="text-foreground">
              {amount} {selectedToken.symbol} + Gas
            </span>
          </div>
        </div>
      </Card>

      <Button onClick={onConfirm} variant="gradient" size="lg" className="w-full font-medium">
        <Zap className="h-4 w-4" aria-hidden="true" />
        Confirm Mint
      </Button>
    </div>
  )
}
