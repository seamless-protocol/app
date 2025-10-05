import { ArrowDown, Percent, RefreshCw, Settings, TrendingUp } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { Alert } from '../../../../components/ui/alert'
import { AssetDisplay } from '../../../../components/ui/asset-display'
import { Button } from '../../../../components/ui/button'
import { Card } from '../../../../components/ui/card'
import { FilterDropdown } from '../../../../components/ui/filter-dropdown'
import { Input } from '../../../../components/ui/input'
import { Separator } from '../../../../components/ui/separator'
import { Skeleton } from '../../../../components/ui/skeleton'
import {
  AMOUNT_PERCENTAGE_PRESETS,
  MIN_MINT_AMOUNT_DISPLAY,
  SLIPPAGE_PRESETS_PERCENT_DISPLAY,
} from '../../constants'

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
  availableTokens: Array<Token>
  amount: string
  onAmountChange: (value: string) => void
  onTokenChange: (token: Token) => void
  onPercentageClick: (percentage: number) => void

  // UI state
  showAdvanced: boolean
  onToggleAdvanced: () => void
  slippage: string
  onSlippageChange: (value: string) => void

  // Loading states
  isCollateralBalanceLoading: boolean
  isUsdPriceLoading: boolean
  isCalculating: boolean
  isAllowanceLoading: boolean
  isApproving: boolean

  // Calculations
  expectedTokens: string

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
  managementFee?: string | undefined
  isManagementFeeLoading?: boolean | undefined
  mintTokenFee?: string | undefined
  isMintTokenFeeLoading?: boolean | undefined

  // Warning
  isBelowMinimum?: boolean | undefined
}

export function InputStep({
  selectedToken,
  availableTokens,
  amount,
  onAmountChange,
  onTokenChange,
  onPercentageClick,
  showAdvanced,
  onToggleAdvanced,
  slippage,
  onSlippageChange,
  isCollateralBalanceLoading,
  isUsdPriceLoading,
  isCalculating,
  isAllowanceLoading,
  isApproving,
  expectedTokens,
  canProceed,
  needsApproval,
  isConnected,
  onApprove,
  error,
  leverageTokenConfig,
  managementFee,
  isManagementFeeLoading,
  mintTokenFee,
  isMintTokenFeeLoading,
  isBelowMinimum,
}: InputStepProps) {
  const mintAmountId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus and select the input when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Token Selection and Amount Input */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor={mintAmountId} className="text-sm font-medium text-white">
            Mint Amount
          </label>
          <div className="text-xs text-slate-400">
            Balance:{' '}
            {isCollateralBalanceLoading ? (
              <Skeleton className="inline-block h-3 w-16" />
            ) : (
              `${selectedToken.balance} ${selectedToken.symbol}`
            )}
          </div>
        </div>

        <Card variant="gradient" className="p-4 gap-0">
          <div className="flex items-end justify-between mb-3">
            <div className="flex-1">
              <div className="flex">
                <Input
                  ref={inputRef}
                  id={mintAmountId}
                  type="text"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => onAmountChange(e.target.value)}
                  className="border-slate-700 text-lg px-3 h-auto focus:ring-0 focus:ring-offset-0 font-medium text-white"
                />
                <div className="flex items-center space-x-2 ml-4">
                  <FilterDropdown
                    label=""
                    value={selectedToken.symbol}
                    options={availableTokens.map((token) => ({
                      value: token.symbol,
                      label: token.symbol,
                      icon: <AssetDisplay asset={token} size="sm" variant="logo-only" />,
                    }))}
                    onValueChange={(value) => {
                      const token = availableTokens.find((t) => t.symbol === value)
                      if (token) onTokenChange(token)
                    }}
                    placeholder="Select token"
                  />
                </div>
              </div>
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

      {/* Expected Output */}
      <div className="space-y-3">
        <div className="flex justify-center">
          <div className="p-2 bg-slate-800/50 rounded-full border border-slate-700">
            <ArrowDown className="h-4 w-4 text-slate-400" />
          </div>
        </div>

        <Card variant="gradient" className="p-4 gap-0">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-400">You will receive</div>
            {isCalculating && (
              <div className="flex items-center text-xs text-slate-400">
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                Calculating...
              </div>
            )}
          </div>

          <div className="flex items-end justify-between">
            <div className="flex-1">
              <div className="text-xl font-medium text-white">
                {isCalculating ? <Skeleton className="h-6 w-20" /> : expectedTokens}
              </div>
              <div className="text-sm text-slate-400 mt-1">Leverage Tokens</div>
            </div>

            <div className="flex items-center space-x-2 ml-4">
              <div className="w-6 h-6 bg-purple-600/20 rounded-full flex items-center justify-center">
                <TrendingUp className="h-3 w-3 text-purple-400" />
              </div>
              <span className="text-sm font-medium text-white">{leverageTokenConfig.symbol}</span>
            </div>
          </div>

          {/* Leverage Info */}
          {parseFloat(expectedTokens) > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Target Leverage</span>
                <div className="flex items-center text-purple-400">
                  <span className="font-semibold">{leverageTokenConfig.leverageRatio}x</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Transaction Summary */}
      <Card variant="gradient" className="p-4 gap-2">
        <h4 className="text-sm font-medium text-white mb-3">Transaction Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Mint Token Fee</span>
            <span className="text-white">
              {isMintTokenFeeLoading ? (
                <Skeleton className="inline-block h-4 w-12" />
              ) : mintTokenFee ? (
                mintTokenFee
              ) : (
                'N/A'
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Mint Treasury Fee</span>
            <span className="text-white">
              {isManagementFeeLoading ? (
                <Skeleton className="inline-block h-4 w-12" />
              ) : managementFee ? (
                managementFee
              ) : (
                'N/A'
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Slippage Tolerance</span>
            <span className="text-white">{slippage}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Approval Status</span>
            <span className={needsApproval ? 'text-yellow-400' : 'text-green-400'}>
              {!amount || parseFloat(amount || '0') === 0 ? (
                <span className="text-slate-400">N/A</span>
              ) : isAllowanceLoading ? (
                <Skeleton className="inline-block h-3 w-16" />
              ) : needsApproval ? (
                'Approval Required'
              ) : (
                'Approved'
              )}
            </span>
          </div>
          <Separator className="my-2 bg-slate-700" />
          <div className="flex justify-between font-medium items-center">
            <span className="text-white">You will receive</span>
            <div className="text-right">
              <div className="text-white">
                {isCalculating
                  ? 'Calculating...'
                  : `${expectedTokens} ${leverageTokenConfig.symbol}`}
              </div>
              {!isCalculating && amount && parseFloat(amount) > 0 && selectedToken.price && (
                <div className="text-xs text-slate-400">
                  ≈ $
                  {(parseFloat(amount) * selectedToken.price).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Error Display */}
      {error && <Alert type="error" title="Error" description={error} />}

      {/* Warning Display */}
      {isBelowMinimum && (
        <Alert
          type="warning"
          title="Low Amount Warning"
          description={`The amount you're minting is below the recommended minimum of ${MIN_MINT_AMOUNT_DISPLAY}. Gas costs may exceed the transaction value.`}
        />
      )}

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
              ? 'Insufficient balance'
              : isCalculating
                ? 'Calculating...'
                : isAllowanceLoading
                  ? 'Checking allowance...'
                  : isApproving
                    ? 'Approving...'
                    : needsApproval
                      ? `Approve ${selectedToken.symbol}`
                      : `Mint ${leverageTokenConfig.symbol}`}
      </Button>
    </div>
  )
}
