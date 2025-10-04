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
        <h3 className="text-lg font-medium text-white mb-2">Confirm Mint</h3>
        <p className="text-slate-400">Review your mint details and confirm the transaction</p>
      </div>

      <Card variant="gradient" className="p-4 gap-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Minting</span>
            <div className="flex items-center">
              <span className="text-white font-medium mr-2">
                {amount} {selectedToken.symbol}
              </span>
              <AssetDisplay asset={selectedToken} size="sm" variant="logo-only" />
            </div>
          </div>

          <div className="flex justify-center py-2">
            <ArrowDown className="h-4 w-4 text-slate-400" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Receiving</span>
            <div className="flex items-center">
              <span className="text-white font-medium mr-2">{expectedTokens} tokens</span>
              <TrendingUp className="h-4 w-4 text-purple-400" />
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
            <span className="text-slate-400">Target Leverage</span>
            <span className="text-purple-400">{leverageTokenConfig.leverageRatio}x</span>
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
          <div className="flex justify-between">
            <span className="text-slate-400">Total Cost</span>
            <span className="text-white">
              {amount} {selectedToken.symbol} + Gas
            </span>
          </div>
        </div>
      </Card>

      <Button onClick={onConfirm} variant="gradient" className="w-full h-12 font-medium">
        <Zap className="h-4 w-4 mr-2" />
        Confirm Mint
      </Button>
    </div>
  )
}
