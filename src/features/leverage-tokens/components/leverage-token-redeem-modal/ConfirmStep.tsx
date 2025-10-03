import { ArrowDownUp, TrendingDown, Zap } from 'lucide-react'
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
  redemptionFee?: bigint | undefined
  isRedemptionFeeLoading?: boolean | undefined
  onConfirm: () => void
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
        <h3 className="mb-2 text-lg font-medium text-[var(--text-primary)]">Confirm Redemption</h3>
        <p className="text-[var(--text-secondary)]">
          Review your redemption details and confirm the transaction
        </p>
      </div>

      <Card
        variant="gradient"
        className="gap-0 border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] p-4"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">Redeeming</span>
            <div className="flex items-center">
              <span className="mr-2 font-medium text-[var(--text-primary)]">
                {amount} {selectedToken.symbol}
              </span>
              <TrendingDown className="h-4 w-4 text-[var(--brand-secondary)]" />
            </div>
          </div>

          <div className="flex justify-center py-2">
            <ArrowDownUp className="h-4 w-4 text-[var(--text-muted)]" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">Receiving</span>
            <div className="flex items-center">
              <span className="mr-2 font-medium text-[var(--text-primary)]">
                {expectedAmount} {selectedAsset}
              </span>
              <TrendingDown className="h-4 w-4 text-[var(--state-success-text)]" />
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
            <span className="text-[var(--text-secondary)]">Redeem Asset</span>
            <span className="text-[var(--text-primary)]">{selectedAsset}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Redemption Fee</span>
            <span className="text-white">
              {isRedemptionFeeLoading ? (
                <Skeleton className="inline-block h-4 w-12" />
              ) : typeof redemptionFee === 'bigint' ? (
                `${Number(redemptionFee) / 100}%`
              ) : (
                <Skeleton className="inline-block h-4 w-12" />
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Estimated Gas</span>
            {isGasLoading ? (
              <Skeleton className="h-4 w-16" />
            ) : isGasError ? (
              <span className="text-[var(--state-error-text)]">Unable to estimate</span>
            ) : (
              <span className="text-[var(--text-primary)]">{estimatedCostUsd}</span>
            )}
          </div>
        </div>
      </Card>

      <Button onClick={onConfirm} variant="gradient" size="lg" className="w-full font-medium">
        <Zap className="h-4 w-4" aria-hidden="true" />
        Confirm Redemption
      </Button>
    </div>
  )
}
