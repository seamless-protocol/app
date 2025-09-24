import { Percent, Settings, TrendingDown } from 'lucide-react'
import { useId } from 'react'
import { Alert } from '../../../../components/ui/alert'
import { Button } from '../../../../components/ui/button'
import { Card } from '../../../../components/ui/card'
import { Input } from '../../../../components/ui/input'
import { Skeleton } from '../../../../components/ui/skeleton'
import { AMOUNT_PERCENTAGE_PRESETS, SLIPPAGE_PRESETS_PERCENT_DISPLAY } from '../../constants'

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

interface LeverageTokenConfig {
  symbol: string
  name: string
  leverageRatio: number
  collateralAsset: {
    symbol: string
    name: string
    address: string
    decimals: number
  }
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

  // UI state
  showAdvanced: boolean
  onToggleAdvanced: () => void
  slippage: string
  onSlippageChange: (value: string) => void

  // Loading states
  isLeverageTokenBalanceLoading: boolean
  isUsdPriceLoading: boolean
  isCalculating: boolean
  isAllowanceLoading: boolean
  isApproving: boolean

  // Calculations
  expectedAmount: string

  // Validation
  canProceed: boolean
  needsApproval: boolean
  isConnected: boolean

  // Actions
  onApprove: () => void

  // Error
  error?: string | undefined

  // Config
  leverageTokenConfig: LeverageTokenConfig
}

export function InputStep({
  selectedToken,
  availableAssets,
  amount,
  onAmountChange,
  onPercentageClick,
  selectedAsset,
  onAssetChange,
  showAdvanced,
  onToggleAdvanced,
  slippage,
  onSlippageChange,
  isLeverageTokenBalanceLoading,
  isUsdPriceLoading,
  isCalculating,
  isAllowanceLoading,
  isApproving,
  expectedAmount,
  canProceed,
  needsApproval,
  isConnected,
  onApprove,
  error,
  leverageTokenConfig,
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
                `$${selectedToken.price.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              )}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Total Earned</span>
            <span className="text-green-400 font-medium">$N/A</span>
          </div>
          <div>
            <span className="text-slate-400 block">Originally Minted</span>
            <span className="text-white font-medium">$N/A</span>
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
                  `≈ $${(
                    parseFloat(amount || '0') *
                      (selectedToken.price / parseFloat(selectedToken.balance))
                  ).toLocaleString('en-US', {
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
          <div className="flex items-center justify-between">
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

            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleAdvanced}
              className="text-slate-400 hover:text-white"
            >
              <Settings className="h-4 w-4 mr-1" />
              Advanced
            </Button>
          </div>
        </Card>

        {/* Advanced Settings */}
        {showAdvanced && (
          <Card variant="gradient" className="p-4 gap-0">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-white">Slippage Tolerance</div>
              <div className="flex items-center space-x-2">
                {SLIPPAGE_PRESETS_PERCENT_DISPLAY.map((value) => (
                  <Button
                    key={value}
                    variant={slippage === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onSlippageChange(value)}
                    className={`h-8 px-3 text-xs ${
                      slippage === value
                        ? 'bg-purple-600 text-white hover:bg-purple-500'
                        : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {value}%
                  </Button>
                ))}
                <div className="flex items-center space-x-1">
                  <Input
                    type="text"
                    value={slippage}
                    onChange={(e) => onSlippageChange(e.target.value)}
                    className="w-16 h-8 text-xs text-center bg-slate-900 border-slate-600 text-white"
                    placeholder="0.5"
                  />
                  <Percent className="h-3 w-3 text-slate-400" />
                </div>
              </div>
            </div>
          </Card>
        )}
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

      {/* Transaction Summary */}
      <Card variant="gradient" className="p-4 gap-2">
        <h4 className="text-sm font-medium text-white mb-3">Transaction Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Redeem Amount</span>
            <span className="text-white">
              {amount || '0'} {selectedToken.symbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Redemption Fee</span>
            <span className="text-white">0.2%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Slippage Tolerance</span>
            <span className="text-white">{slippage}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Approval Status</span>
            <span className={needsApproval ? 'text-yellow-400' : 'text-green-400'}>
              {isAllowanceLoading ? (
                <Skeleton className="inline-block h-3 w-16" />
              ) : needsApproval ? (
                'Approval Required'
              ) : (
                'Approved'
              )}
            </span>
          </div>
          <div className="flex justify-between font-medium">
            <span className="text-white">You will receive</span>
            <span className="text-white">
              {isCalculating ? (
                <Skeleton className="inline-block h-4 w-24" />
              ) : (
                `${expectedAmount} ${selectedAsset}`
              )}
            </span>
          </div>
        </div>
      </Card>

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
        onClick={onApprove}
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
                  : isAllowanceLoading
                    ? 'Checking allowance...'
                    : isApproving
                      ? 'Approving...'
                      : needsApproval
                        ? `Approve ${selectedToken.symbol}`
                        : `Redeem ${leverageTokenConfig.symbol}`}
      </Button>
    </div>
  )
}
