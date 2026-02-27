import { ArrowDown, Zap } from 'lucide-react'
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
  collateralAsset: {
    symbol: string
    name: string
    address: string
  }
  debtAsset: {
    symbol: string
    name: string
    address: string
  }
}

interface ConfirmStepProps {
  selectedToken: Token
  amount: string
  expectedTokens: string
  leverageTokenConfig: LeverageTokenConfig
  onConfirm: () => void
  disabled?: boolean
  expectedDebtAmount?: string
  debtAssetSymbol?: string
  error?: string
  needsReack?: boolean
  onUserAcknowledge?: () => void
}

export function ConfirmStep({
  selectedToken,
  amount,
  expectedTokens,
  leverageTokenConfig,
  onConfirm,
  disabled = false,
  expectedDebtAmount,
  debtAssetSymbol,
  error,
  needsReack = false,
  onUserAcknowledge,
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
            <span className="text-sm text-secondary-foreground">Depositing</span>
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

          <div className="flex items-start justify-between">
            <span className="text-sm text-secondary-foreground">Receiving</span>
            <div className="grid grid-cols-[1fr_auto] justify-items-end gap-x-2 gap-y-1">
              <div className="col-start-1 row-start-1 text-right font-medium leading-tight text-foreground">
                {expectedTokens} {leverageTokenConfig.symbol}
              </div>
              <div className="col-start-2 row-start-1 flex -space-x-1">
                <AssetDisplay
                  asset={leverageTokenConfig.collateralAsset}
                  size="sm"
                  variant="logo-only"
                />
                <AssetDisplay asset={leverageTokenConfig.debtAsset} size="sm" variant="logo-only" />
              </div>
              {expectedDebtAmount && expectedDebtAmount !== '0' && debtAssetSymbol && (
                <>
                  <div className="col-start-1 row-start-2 flex items-center justify-end text-right text-xs leading-tight text-secondary-foreground">
                    + {expectedDebtAmount} {debtAssetSymbol}
                  </div>
                  <div className="col-start-2 row-start-2 flex items-center justify-end">
                    <AssetDisplay
                      asset={leverageTokenConfig.debtAsset}
                      size="sm"
                      variant="logo-only"
                    />
                  </div>
                </>
              )}
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

      {error && (
        <div className="rounded-lg border border-[var(--state-error-border)] bg-[var(--state-error-bg)] p-3 text-sm text-[var(--state-error-text)]">
          {error}
        </div>
      )}

      <Button
        onClick={() => {
          if (needsReack && onUserAcknowledge) {
            onUserAcknowledge()
          } else {
            onConfirm()
          }
        }}
        disabled={disabled && !needsReack}
        variant="gradient"
        size="lg"
        className="w-full font-medium"
      >
        <Zap className="h-4 w-4" aria-hidden="true" />
        {needsReack ? 'Acknowledge Updated Quote' : disabled ? 'Updating quote…' : 'Confirm Mint'}
      </Button>
    </div>
  )
}
