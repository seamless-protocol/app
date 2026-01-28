import {
  AlertTriangle,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Loader2,
  Percent,
  Settings,
  TrendingDown,
} from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { cn } from '@/lib/utils/cn'
import { Alert } from '../../../../components/ui/alert'
import { Button } from '../../../../components/ui/button'
import { Card } from '../../../../components/ui/card'
import { Input } from '../../../../components/ui/input'
import { Separator } from '../../../../components/ui/separator'
import { Skeleton } from '../../../../components/ui/skeleton'
import {
  AMOUNT_PERCENTAGE_PRESETS,
  MIN_REDEEM_AMOUNT_DISPLAY,
  SLIPPAGE_PRESETS_PERCENT_DISPLAY_REDEEM,
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
  slippagePresets?: {
    redeem?: {
      default: string
      presets: Array<string>
    }
  }
}

interface InputStepProps {
  selectedToken: Token
  collateralAssetSymbol: string
  amount: string
  expectedTokens: string
  expectedExcessDebt: string
  expectedTokensUsdOutStr: string
  expectedDebtUsdOutStr: string
  expectedTotalUsdOutStr: string
  minTokens: string
  minExcessDebt: string
  minTokensUsdOutStr: string
  minExcessDebtUsdOutStr: string
  minTotalUsdOutStr: string
  redemptionFee?: string | undefined
  onAmountChange: (value: string) => void
  onPercentageClick: (percentage: number) => void
  showAdvanced: boolean
  onToggleAdvanced: () => void
  slippage: string
  onSlippageChange: (value: string) => void
  isLeverageTokenBalanceLoading: boolean
  isUsdPriceLoading: boolean
  isCalculating: boolean
  isAllowanceLoading: boolean
  isApproving: boolean
  isRedemptionFeeLoading?: boolean | undefined
  redeemTokenFee?: string | undefined
  isRedeemTokenFeeLoading?: boolean | undefined
  canProceed: boolean
  needsApproval: boolean
  isConnected: boolean
  onApprove: () => void
  error?: string | undefined
  leverageTokenConfig: LeverageTokenConfig
  isBelowMinimum?: boolean | undefined
  impactWarning?: string
  debtAssetSymbol?: string
  // Selected quote source name/label
  quoteSourceName?: string | undefined
}

export function InputStep({
  selectedToken,
  collateralAssetSymbol,
  amount,
  expectedTokens,
  expectedExcessDebt,
  expectedTokensUsdOutStr,
  expectedDebtUsdOutStr,
  expectedTotalUsdOutStr,
  minTokens,
  minExcessDebt,
  minTokensUsdOutStr,
  minExcessDebtUsdOutStr,
  minTotalUsdOutStr,
  redemptionFee,
  onAmountChange,
  onPercentageClick,
  showAdvanced,
  onToggleAdvanced,
  slippage,
  onSlippageChange,
  isLeverageTokenBalanceLoading,
  isUsdPriceLoading,
  isCalculating,
  isAllowanceLoading,
  isApproving,
  redeemTokenFee,
  isRedeemTokenFeeLoading,
  isRedemptionFeeLoading,
  canProceed,
  needsApproval,
  isConnected,
  onApprove,
  error,
  leverageTokenConfig,
  isBelowMinimum,
  debtAssetSymbol,
  impactWarning,
  quoteSourceName,
}: InputStepProps) {
  const slippageInputRef = useRef<HTMLInputElement>(null)
  const redeemAmountId = useId()

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

  const balanceFloat = parseFloat(selectedToken.balance)
  const pricePerToken = balanceFloat > 0 ? selectedToken.price / balanceFloat : 0

  // Derive action button state (mirrors mint)
  const actionState = (() => {
    if (!isConnected) return { label: 'Connect Wallet', busy: false }
    const amountNum = parseFloat(amount || '0')
    const balanceNum = parseFloat(selectedToken.balance || '0')
    if (amountNum === 0) return { label: 'Enter an amount', busy: false }
    if (amountNum > balanceNum) return { label: 'Insufficient balance', busy: false }
    if (isCalculating) return { label: 'Calculating...', busy: true }
    if (isAllowanceLoading) return { label: 'Checking allowance...', busy: true }
    if (isApproving) return { label: 'Approving...', busy: true }
    if (needsApproval) return { label: `Approve ${selectedToken.symbol}`, busy: false }
    return { label: `Redeem ${leverageTokenConfig.symbol}`, busy: false }
  })()

  const slippagePresets =
    leverageTokenConfig.slippagePresets?.redeem?.presets || SLIPPAGE_PRESETS_PERCENT_DISPLAY_REDEEM

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor={redeemAmountId} className="text-sm font-medium text-foreground">
            Redeem Amount
          </label>
          <div className="text-xs text-secondary-foreground">
            Balance:{' '}
            {isLeverageTokenBalanceLoading ? (
              <Skeleton className="inline-block h-3 w-16" />
            ) : (
              `${selectedToken.balance} ${selectedToken.symbol}`
            )}
          </div>
        </div>

        <Card variant="gradient" className="gap-0 border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex-1">
              <Input
                id={redeemAmountId}
                type="text"
                placeholder="0"
                value={amount}
                onChange={(e) => onAmountChange(e.target.value)}
                className="h-auto border-0 bg-transparent px-3 text-2xl font-medium text-foreground focus:ring-0 focus:ring-offset-0"
              />
              <div className="mt-1 text-xs text-secondary-foreground">
                {isUsdPriceLoading ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  `≈ $${(parseFloat(amount || '0') * pricePerToken).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                )}
              </div>
            </div>

            <div className="ml-4 flex items-center space-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent">
                <TrendingDown className="h-3 w-3 text-brand-purple" />
              </div>
              <span className="text-sm font-medium text-foreground">
                {leverageTokenConfig.symbol}
              </span>
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
                {slippagePresets.map((value) => (
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
                      className="h-8 w-16 border border-border bg-[var(--input-background)] text-center text-xs text-foreground pr-6"
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
          <div className="rounded-full border border-border bg-card p-2">
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <Card variant="gradient" className="gap-0 border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm text-secondary-foreground">Preview</div>
            {isCalculating && (
              <div className="flex items-center text-xs text-slate-400" aria-live="polite">
                <Loader2 className="h-3 w-3 animate-spin" aria-label="Calculating" />
              </div>
            )}
          </div>

          <div className="flex items-end justify-between">
            <div className="flex-1">
              <div className="text-xl font-medium text-foreground">
                {isCalculating ? <Skeleton className="h-6 w-20" /> : expectedTokens}
              </div>
              {!isCalculating && (
                <>
                  <div className="text-xs text-secondary-foreground">
                    {expectedExcessDebt && expectedExcessDebt !== '0' && debtAssetSymbol && (
                      <>
                        {' '}
                        + {expectedExcessDebt} {debtAssetSymbol}
                      </>
                    )}
                  </div>
                  <div className="text-xs text-secondary-foreground">
                    {expectedTokensUsdOutStr &&
                    expectedDebtUsdOutStr &&
                    expectedTotalUsdOutStr &&
                    expectedDebtUsdOutStr !== '0'
                      ? `≈ $${expectedTokensUsdOutStr} + $${expectedDebtUsdOutStr} = $${expectedTotalUsdOutStr}`
                      : `≈ $${expectedTokensUsdOutStr}`}
                  </div>
                </>
              )}
            </div>

            <div className="ml-4 flex items-center space-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent">
                <TrendingDown className="h-3 w-3 text-brand-purple" />
              </div>
              <div className="text-sm font-medium text-foreground">{collateralAssetSymbol}</div>
            </div>
          </div>
        </Card>
      </div>

      <Card
        variant="gradient"
        className="gap-2 border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] p-4"
      >
        <h4 className="mb-3 text-sm font-medium text-foreground">Transaction Summary</h4>
        <div className="space-y-2 text-sm">
          {impactWarning && (
            <div className="flex items-start gap-2 rounded-md border border-[var(--tag-warning-bg)]/40 bg-[var(--tag-warning-bg)]/20 p-2 text-[var(--tag-warning-text)]">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <div>{impactWarning}</div>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-secondary-foreground">Redeem Token Fee</span>
            <span className="text-foreground">
              {isRedeemTokenFeeLoading ? (
                <Skeleton className="inline-block h-4 w-12" />
              ) : redeemTokenFee ? (
                redeemTokenFee
              ) : (
                'N/A'
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary-foreground">Redeem Treasury Fee</span>
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
            <span className="text-secondary-foreground">Slippage Tolerance</span>
            <span className="text-foreground">{slippage}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary-foreground">Approval Status</span>
            <span
              className={cn(
                parseFloat(amount || '0') === 0
                  ? 'text-secondary-foreground'
                  : needsApproval
                    ? 'text-[var(--state-warning-text)]'
                    : 'text-[var(--state-success-text)]',
              )}
            >
              {isAllowanceLoading ? (
                <Skeleton className="inline-block h-3 w-16" />
              ) : parseFloat(amount || '0') === 0 ? (
                'N/A'
              ) : needsApproval ? (
                'Approval Required'
              ) : (
                'Approved'
              )}
            </span>
          </div>
          <Separator className="my-2 bg-border" />
          <div className="flex items-center justify-between font-medium">
            <span className="text-foreground">You will receive at least</span>
            <div className="text-right">
              <div className="text-foreground">
                {isCalculating ? (
                  <span className="inline-flex items-center" aria-live="polite">
                    <Loader2 className="h-3 w-3 animate-spin" aria-label="Calculating" />
                  </span>
                ) : (
                  <>
                    {minTokens} {leverageTokenConfig.collateralAsset.symbol}
                  </>
                )}
              </div>
              {!isCalculating && (
                <>
                  <div className="text-xs text-secondary-foreground">
                    {minExcessDebt && minExcessDebt !== '0' && debtAssetSymbol && (
                      <>
                        {' '}
                        + {minExcessDebt} {debtAssetSymbol}
                      </>
                    )}
                  </div>
                  <div className="text-xs text-secondary-foreground">
                    {minTokensUsdOutStr &&
                    minExcessDebtUsdOutStr &&
                    minTotalUsdOutStr &&
                    minExcessDebtUsdOutStr !== '0'
                      ? `≈ $${minTokensUsdOutStr} + $${minExcessDebtUsdOutStr} = $${minTotalUsdOutStr}`
                      : `≈ $${minTokensUsdOutStr}`}
                  </div>
                </>
              )}
            </div>
          </div>
          {quoteSourceName && (
            <div className="flex items-center justify-between">
              <span className="text-secondary-foreground">Quote source</span>
              {isCalculating ? (
                <span className="inline-flex items-center" aria-live="polite">
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                </span>
              ) : (
                <span className="text-foreground">{quoteSourceName}</span>
              )}
            </div>
          )}
        </div>
      </Card>

      {error && <Alert type="error" title="Error" description={error} />}

      {/* Warning Display */}
      {isBelowMinimum && (
        <Alert
          type="warning"
          title="Low Amount Warning"
          description={`The amount you're redeeming is below the recommended minimum of ${MIN_REDEEM_AMOUNT_DISPLAY}. Gas costs may exceed the transaction value.`}
        />
      )}

      {/* Action Button */}
      <Button
        onClick={onApprove}
        disabled={!canProceed || actionState.busy}
        aria-busy={actionState.busy}
        variant="gradient"
        size="lg"
        className="w-full font-medium"
      >
        <span className="inline-flex items-center justify-center gap-2">
          {actionState.busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {actionState.label}
        </span>
      </Button>
    </div>
  )
}
