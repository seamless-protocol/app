import {
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Percent,
  RefreshCw,
  Settings,
  TrendingUp,
} from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { cn } from '@/lib/utils/cn'
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
  selectedToken: Token
  availableTokens: Array<Token>
  amount: string
  onAmountChange: (value: string) => void
  onTokenChange: (token: Token) => void
  onPercentageClick: (percentage: number) => void
  showAdvanced: boolean
  onToggleAdvanced: () => void
  slippage: string
  onSlippageChange: (value: string) => void
  isCollateralBalanceLoading: boolean
  isUsdPriceLoading: boolean
  isCalculating: boolean
  isAllowanceLoading: boolean
  isApproving: boolean
  expectedTokens: string
  canProceed: boolean
  needsApproval: boolean
  isConnected: boolean
  onApprove: () => void
  error?: string | undefined
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
  const slippageInputRef = useRef<HTMLInputElement>(null)
  const mintAmountId = useId()

  // Auto-select and focus slippage input when advanced is shown
  useEffect(() => {
    if (showAdvanced && slippageInputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        slippageInputRef.current?.focus()
        slippageInputRef.current?.select()
      }, 100)
    }
  }, [showAdvanced])

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor={mintAmountId} className="text-sm font-medium text-foreground">
            Mint Amount
          </label>
          <div className="text-xs text-secondary-foreground">
            Balance:{' '}
            {isCollateralBalanceLoading ? (
              <Skeleton className="inline-block h-3 w-16" />
            ) : (
              `${selectedToken.balance} ${selectedToken.symbol}`
            )}
          </div>
        </div>

        <Card variant="gradient" className="gap-0 border border-border bg-card p-4">
          <div className="mb-3 flex items-end justify-between">
            <div className="flex-1">
              <div className="flex">
                <Input
                  id={mintAmountId}
                  type="text"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => onAmountChange(e.target.value)}
                  className="h-auto px-3 text-lg font-medium text-foreground focus:ring-0 focus:ring-offset-0"
                />
                <div className="ml-4 flex items-center space-x-2">
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
              <div className="mt-1 text-xs text-secondary-foreground">
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

          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {AMOUNT_PERCENTAGE_PRESETS.map((percentage) => (
                <Button
                  key={percentage}
                  variant="outline"
                  size="sm"
                  onClick={() => onPercentageClick(percentage)}
                  className="h-7 border border-border px-2 text-xs text-secondary-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {percentage === 100 ? 'MAX' : `${percentage}%`}
                </Button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleAdvanced}
              className="text-brand-purple transition-colors hover:opacity-90"
            >
              <Settings className="mr-1 h-4 w-4 text-[inherit]" />
              Advanced
            </Button>
          </div>
        </Card>

        {showAdvanced && (
          <Card variant="gradient" className="gap-0 border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-foreground">Slippage Tolerance</div>
              <div className="flex items-center space-x-2">
                {SLIPPAGE_PRESETS_PERCENT_DISPLAY.map((value) => (
                  <Button
                    key={value}
                    variant={slippage === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onSlippageChange(value)}
                    className={cn(
                      'h-8 px-3 text-xs transition-colors',
                      slippage === value
                        ? 'border border-brand-purple bg-brand-purple text-primary-foreground hover:opacity-90'
                        : 'border border-[var(--divider-line)] text-secondary-foreground hover:bg-[color-mix(in_srgb,var(--surface-elevated) 35%,transparent)] hover:text-foreground',
                    )}
                  >
                    {value}%
                  </Button>
                ))}
                <div className="flex items-center space-x-1">
                  <div className="relative">
                    <Input
                      ref={slippageInputRef}
                      type="text"
                      value={slippage}
                      onChange={(e) => onSlippageChange(e.target.value)}
                      className="h-8 w-16 border border-border bg-input text-center text-xs text-foreground pr-6"
                      placeholder="0.5"
                    />
                    <div className="absolute right-1 top-0 flex h-full flex-col items-center justify-center space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          const currentValue = parseFloat(slippage) || 0
                          const newValue = Math.min(currentValue + 0.1, 50).toFixed(1)
                          onSlippageChange(newValue)
                        }}
                        className="flex h-4 w-4 items-center justify-center hover:bg-muted rounded-sm transition-colors"
                      >
                        <ChevronUp className="h-2 w-2 text-muted-foreground hover:text-foreground" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const currentValue = parseFloat(slippage) || 0
                          const newValue = Math.max(currentValue - 0.1, 0.1).toFixed(1)
                          onSlippageChange(newValue)
                        }}
                        className="flex h-4 w-4 items-center justify-center hover:bg-muted rounded-sm transition-colors"
                      >
                        <ChevronDown className="h-2 w-2 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  </div>
                  <Percent className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-center">
          <div className="p-2 rounded-full border border-border bg-card">
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <Card variant="gradient" className="gap-0 border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm text-secondary-foreground">You will receive</div>
            {isCalculating && (
              <div className="flex items-center text-xs text-slate-400">
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                Calculating...
              </div>
            )}
          </div>

          <div className="flex items-end justify-between">
            <div className="flex-1">
              <div className="text-xl font-medium text-foreground">
                {isCalculating ? <Skeleton className="h-6 w-20" /> : expectedTokens}
              </div>
              <div className="mt-1 text-sm text-secondary-foreground">Leverage Tokens</div>
            </div>

            <div className="ml-4 flex items-center space-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent">
                <TrendingUp className="h-3 w-3 text-brand-purple" />
              </div>
              <span className="text-sm font-medium text-foreground">
                {leverageTokenConfig.symbol}
              </span>
            </div>
          </div>

          {parseFloat(expectedTokens) > 0 && (
            <div className="mt-3 border-t border-border pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-secondary-foreground">Target Leverage</span>
                <div className="flex items-center text-brand-purple">
                  <span className="font-semibold">{leverageTokenConfig.leverageRatio}x</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card
        variant="gradient"
        className="gap-2 border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] p-4"
      >
        <h4 className="mb-3 text-sm font-medium text-foreground">Transaction Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-secondary-foreground">Mint Token Fee</span>
            <span className="text-foreground">
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
            <span className="text-secondary-foreground">Mint Treasury Fee</span>
            <span className="text-foreground">
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
            <span className="text-secondary-foreground">Slippage Tolerance</span>
            <span className="text-foreground">{slippage}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary-foreground">Approval Status</span>
            <span
              className={cn(
                needsApproval
                  ? 'text-[var(--state-warning-text)]'
                  : 'text-[var(--state-success-text)]',
              )}
            >
              {isAllowanceLoading ? (
                <Skeleton className="inline-block h-3 w-16" />
              ) : needsApproval ? (
                'Approval Required'
              ) : (
                'Approved'
              )}
            </span>
          </div>
          <Separator className="my-2 bg-border" />
          <div className="flex justify-between font-medium items-center">
            <span className="text-foreground">You will receive</span>
            <div className="text-right">
              <div className="text-foreground">
                {isCalculating
                  ? 'Calculating...'
                  : `${expectedTokens} ${leverageTokenConfig.symbol}`}
              </div>
              {!isCalculating && amount && parseFloat(amount) > 0 && selectedToken.price && (
                <div className="text-xs text-secondary-foreground">
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
        size="lg"
        className="w-full font-medium"
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
