import { ArrowDownUp, DollarSign, RefreshCw, TrendingDown } from 'lucide-react'
import { useId } from 'react'
import { Alert } from '../../../../components/ui/alert'
import { Button } from '../../../../components/ui/button'
import { Card } from '../../../../components/ui/card'
import { Input } from '../../../../components/ui/input'
import { Skeleton } from '../../../../components/ui/skeleton'
import { AMOUNT_PERCENTAGE_PRESETS } from '../../constants'

interface Token {
  symbol: string
  name: string
  balance: string
  price: number
  logo?: string
}

interface Asset {
  symbol: string
  name: string
  price: number
}

interface InputStepProps {
  // Token data
  selectedToken: Token
  availableAssets: Array<Asset>
  amount: string
  onAmountChange: (value: string) => void
  onPercentageClick: (percentage: number) => void
  selectedAsset: string
  onAssetChange: (asset: string) => void

  // Loading states
  isLeverageTokenBalanceLoading: boolean
  isUsdPriceLoading: boolean
  isCalculating: boolean

  // Calculations
  expectedAmount: string

  // Validation
  canProceed: boolean
  isConnected: boolean

  // Actions
  onProceed: () => void

  // Error
  error?: string | undefined
}

export function InputStep({
  selectedToken,
  availableAssets,
  amount,
  onAmountChange,
  onPercentageClick,
  selectedAsset,
  onAssetChange,
  isLeverageTokenBalanceLoading,
  isUsdPriceLoading,
  isCalculating,
  expectedAmount,
  canProceed,
  isConnected,
  onProceed,
  error,
}: InputStepProps) {
  const redeemAmountId = useId()

  return (
    <div className="space-y-6">
      {/* Position Overview */}
      <Card variant="gradient" className="p-4 gap-0">
        <h4 className="text-sm font-medium text-white mb-3">Your Position</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-400 block">Leverage Tokens</span>
            <span className="text-white font-medium">
              {isLeverageTokenBalanceLoading ? (
                <Skeleton className="inline-block h-4 w-16" />
              ) : (
                selectedToken.balance
              )}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Current Value</span>
            <span className="text-white font-medium">
              {isUsdPriceLoading ? (
                <Skeleton className="inline-block h-4 w-20" />
              ) : (
                `$${(parseFloat(selectedToken.balance) * selectedToken.price).toLocaleString(
                  'en-US',
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  },
                )}`
              )}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Total Earned</span>
            <span className="text-green-400 font-medium">+$1,234.56</span>
          </div>
          <div>
            <span className="text-slate-400 block">Originally Minted</span>
            <span className="text-white font-medium">$14,444.34</span>
          </div>
        </div>
      </Card>

      {/* Amount Input */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor={redeemAmountId} className="text-sm font-medium text-white">
            Redemption Amount (Tokens)
          </label>
          <div className="text-xs text-slate-400">
            Available:{' '}
            {isLeverageTokenBalanceLoading ? (
              <Skeleton className="inline-block h-3 w-16" />
            ) : (
              `${selectedToken.balance} tokens`
            )}
          </div>
        </div>

        <Card variant="gradient" className="p-4 gap-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <Input
                id={redeemAmountId}
                type="text"
                placeholder="0"
                value={amount}
                onChange={(e) => onAmountChange(e.target.value)}
                className="border-0 bg-transparent text-2xl px-3 h-auto focus:ring-0 focus:ring-offset-0 font-medium text-white"
              />
              <div className="text-xs text-slate-400 mt-1">
                {isUsdPriceLoading ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  `≈ $${(parseFloat(amount || '0') * selectedToken.price).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <div className="w-6 h-6 bg-purple-600/20 rounded-full flex items-center justify-center">
                <TrendingDown className="h-3 w-3 text-purple-400" />
              </div>
              <span className="text-sm font-medium text-white">Tokens</span>
            </div>
          </div>

          {/* Percentage shortcuts */}
          <div className="flex space-x-2">
            {AMOUNT_PERCENTAGE_PRESETS.map((percentage) => (
              <Button
                key={percentage}
                variant="outline"
                size="sm"
                onClick={() => onPercentageClick(percentage)}
                className="h-7 px-2 text-xs border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                {percentage === 100 ? 'MAX' : `${percentage}%`}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {/* Asset Selection */}
      <div className="space-y-4">
        <div className="text-sm font-medium text-white">Redeem to</div>
        <div className="flex space-x-3">
          {availableAssets.map((asset) => (
            <Button
              key={asset.symbol}
              variant={selectedAsset === asset.symbol ? 'default' : 'outline'}
              onClick={() => onAssetChange(asset.symbol)}
              className={`flex-1 ${
                selectedAsset === asset.symbol
                  ? 'bg-purple-600 text-white hover:bg-purple-500'
                  : 'border-slate-600 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {asset.symbol}
            </Button>
          ))}
        </div>
      </div>

      {/* Expected Output */}
      <div className="space-y-3">
        <div className="flex justify-center">
          <div className="p-2 bg-slate-800/50 rounded-full border border-slate-700">
            <ArrowDownUp className="h-4 w-4 text-slate-400" />
          </div>
        </div>

        <Card variant="gradient" className="p-4 gap-0">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-400">You will receive</div>
            {isCalculating && (
              <div className="flex items-center text-xs text-slate-400">
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            )}
          </div>

          <div className="flex items-end justify-between">
            <div className="flex-1">
              <div className="text-xl font-medium text-white">
                {isCalculating ? <Skeleton className="h-6 w-20" /> : expectedAmount}
              </div>
              <div className="text-sm text-slate-400 mt-1">{selectedAsset}</div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                <DollarSign className="h-3 w-3 text-green-400" />
              </div>
              <span className="text-sm font-medium text-white">{selectedAsset}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Processing Notice */}
      <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3">
        <div className="flex items-center text-sm text-slate-300">
          <TrendingDown className="h-4 w-4 mr-2 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="font-medium text-white">Redemption Fee</p>
            <p className="text-xs mt-1">
              A 0.2% redemption fee applies to cover rebalancing costs.
            </p>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && <Alert type="error" title="Error" description={error} />}

      {/* Action Button */}
      <Button
        onClick={onProceed}
        disabled={!canProceed}
        variant="gradient"
        className="w-full h-12 font-medium"
      >
        {!isConnected
          ? 'Connect Wallet'
          : !canProceed && parseFloat(amount || '0') === 0
            ? 'Enter an amount'
            : !canProceed && parseFloat(amount || '0') > parseFloat(selectedToken.balance)
              ? 'Insufficient tokens'
              : !canProceed && parseFloat(amount || '0') < 0.01
                ? 'Minimum redeem: 0.01'
                : isCalculating
                  ? 'Calculating...'
                  : 'Review Redemption'}
      </Button>
    </div>
  )
}
