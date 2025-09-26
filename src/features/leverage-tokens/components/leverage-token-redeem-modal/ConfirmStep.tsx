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
        <h3 className="text-lg font-medium text-white mb-2">Confirm Redemption</h3>
        <p className="text-slate-400">Review your redemption details and confirm the transaction</p>
      </div>

      <Card variant="gradient" className="p-4 gap-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Redeeming</span>
            <div className="flex items-center">
              <span className="text-white font-medium mr-2">
                {amount} {selectedToken.symbol}
              </span>
              <TrendingDown className="h-4 w-4 text-purple-400" />
            </div>
          </div>

          <div className="flex justify-center py-2">
            <ArrowDownUp className="h-4 w-4 text-slate-400" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Receiving</span>
            <div className="flex items-center">
              <span className="text-white font-medium mr-2">
                {expectedAmount} {selectedAsset}
              </span>
              <TrendingDown className="h-4 w-4 text-green-400" />
            </div>
          </div>
        </div>
      </Card>

      <Card variant="gradient" className="p-4">
        <h4 className="text-sm font-medium text-white mb-3">Final Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Leverage Token</span>
            <span className="text-white">{leverageTokenConfig.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Redeem Asset</span>
            <span className="text-white">{selectedAsset}</span>
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
            <span className="text-slate-400">Estimated Gas</span>
            {isGasLoading ? (
              <Skeleton className="h-4 w-16" />
            ) : isGasError ? (
              <span className="text-red-400">Unable to estimate</span>
            ) : (
              <span className="text-white">{estimatedCostUsd}</span>
            )}
          </div>
        </div>
      </Card>

      <Button onClick={onConfirm} variant="gradient" className="w-full h-12 font-medium">
        <Zap className="h-4 w-4 mr-2" />
        Confirm Redemption
      </Button>
    </div>
  )
}
