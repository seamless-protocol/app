import { ArrowDown, TrendingDown, Zap } from 'lucide-react'
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
  expectedAmount: string
  selectedAsset: string
  leverageTokenConfig: LeverageTokenConfig
  redemptionFee?: string | undefined
  isRedemptionFeeLoading?: boolean | undefined
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
  expectedAmount,
  selectedAsset,
  leverageTokenConfig,
  redemptionFee,
  isRedemptionFeeLoading,
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
    transactionType: 'redeem',
    enabled: Boolean(leverageTokenConfig.chainId),
  })

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-medium text-foreground">Confirm Redemption</h3>
        <p className="text-secondary-foreground">
          Review your redemption details and confirm the transaction
        </p>
      </div>

      <Card variant="gradient" className="gap-0 border border-border bg-card p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary-foreground">Redeeming</span>
            <div className="flex items-center">
              <span className="mr-2 font-medium text-foreground">
                {amount} {selectedToken.symbol}
              </span>
              <TrendingDown className="h-4 w-4 text-brand-purple" />
            </div>
          </div>

          <div className="flex justify-center py-2">
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary-foreground">Receiving</span>
            <div className="flex items-center">
              <span className="mr-2 font-medium text-foreground">
                {expectedAmount} {selectedAsset}
                {expectedDebtAmount && expectedDebtAmount !== '0' && debtAssetSymbol && (
                  <>
                    {' '}
                    + {expectedDebtAmount} {debtAssetSymbol}
                  </>
                )}
              </span>
              <TrendingDown className="h-4 w-4 text-[var(--state-success-text)]" />
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
            <span className="text-secondary-foreground">Redeem Asset</span>
            <span className="text-foreground">{selectedAsset}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary-foreground">Redemption Fee</span>
            <span className="text-foreground">
              {isRedemptionFeeLoading ? (
                <Skeleton className="inline-block h-4 w-12" />
              ) : redemptionFee ? (
                redemptionFee
              ) : (
                'N/A'
              )}
            </span>
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
        {needsReack
          ? 'Acknowledge Updated Quote'
          : disabled
            ? 'Updating quote…'
            : 'Confirm Redemption'}
      </Button>
    </div>
  )
}
