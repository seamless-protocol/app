import {
  AlertTriangle,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Loader2,
  Percent,
  Settings,
} from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { cn } from '@/lib/utils/cn'
import { Alert } from '../../../../components/ui/alert'
import { AssetDisplay } from '../../../../components/ui/asset-display'
import { Button } from '../../../../components/ui/button'
import { Card } from '../../../../components/ui/card'
import { Input } from '../../../../components/ui/input'
import { Skeleton } from '../../../../components/ui/skeleton'
import {
  AMOUNT_PERCENTAGE_PRESETS,
  MIN_MINT_AMOUNT_DISPLAY,
  SLIPPAGE_PRESETS_PERCENT_DISPLAY_MINT,
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
  debtAsset: {
    symbol: string
    name: string
    address: string
    decimals: number
  }
}

interface InputStepProps {
  inputToken: Token
  amount: string
  onAmountChange: (value: string) => void
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
  // Estimated USD value of expected shares (as fixed string)
  expectedUsdOutStr?: string | undefined
  // Guaranteed (minOut-aware) USD value floor (as fixed string)
  guaranteedUsdOutStr?: string | undefined
  // Optional USD value of expected debt and their sum (as fixed strings)
  expectedDebtUsdOutStr?: string | undefined
  totalUsdOutStr?: string | undefined
  // Optional route/safety breakdown lines
  breakdown?: Array<{ label: string; value: string }>
  // Optional impact warning text
  impactWarning?: string
  supplyCapExceeded?: boolean | undefined
  // Debt asset information
  expectedDebtAmount?: string
  debtAssetSymbol?: string
  // Optional selected quote source name/label
  quoteSource: string | undefined
}

export function InputStep({
  inputToken,
  amount,
  onAmountChange,
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
  expectedUsdOutStr,
  guaranteedUsdOutStr,
  expectedDebtUsdOutStr,
  totalUsdOutStr,
  breakdown,
  impactWarning,
  supplyCapExceeded,
  expectedDebtAmount,
  debtAssetSymbol,
  quoteSource,
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

  // Derive action button state
  const actionState = (() => {
    if (!isConnected) return { label: 'Connect Wallet', busy: false }
    const amountNum = parseFloat(amount || '0')
    const balanceNum = parseFloat(inputToken.balance || '0')
    if (amountNum === 0) return { label: 'Enter an amount', busy: false }
    if (amountNum > balanceNum) return { label: 'Insufficient balance', busy: false }
    if (isCalculating) return { label: 'Calculating...', busy: true }
    if (isAllowanceLoading) return { label: 'Checking allowance...', busy: true }
    if (isApproving) return { label: 'Approving...', busy: true }
    if (needsApproval) return { label: `Approve ${inputToken.symbol}`, busy: false }
    return { label: `Mint ${leverageTokenConfig.symbol}`, busy: false }
  })()

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-secondary-foreground">
            Balance:{' '}
            {isCollateralBalanceLoading ? (
              <Skeleton className="inline-block h-3 w-16" />
            ) : (
              `${inputToken.balance} ${inputToken.symbol}`
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
                  <div className="inline-flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2">
                    <AssetDisplay asset={inputToken} size="sm" variant="logo-only" />
                    <span className="text-sm font-medium text-foreground">{inputToken.symbol}</span>
                  </div>
                </div>
              </div>
              <div className="mt-1 text-xs text-secondary-foreground">
                {isUsdPriceLoading ? (
                  <Skeleton className="h-4 w-20" />
                ) : (
                  `≈ $${(parseFloat(amount || '0') * inputToken.price).toLocaleString('en-US', {
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
                {SLIPPAGE_PRESETS_PERCENT_DISPLAY_MINT.map((value) => (
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
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm text-secondary-foreground">You will receive at least</div>
            {isCalculating && (
              <div className="flex items-center text-xs text-slate-400" aria-live="polite">
                <Loader2 className="h-3 w-3 animate-spin" aria-label="Calculating" />
              </div>
            )}
          </div>

          <div className="space-y-3 text-right">
            <div className="flex flex-wrap items-start justify-end gap-3">
              <div className="flex flex-col items-end">
                <div className="text-xl font-medium text-foreground">
                  {isCalculating ? <Skeleton className="h-6 w-24" /> : expectedTokens}
                </div>
                <div className="h-4">
                  {isCalculating ? (
                    <Skeleton className="mt-1 h-3 w-20" />
                  ) : (
                    expectedUsdOutStr && (
                      <div className="text-xs text-secondary-foreground">
                        ≈ ${expectedUsdOutStr}
                      </div>
                    )
                  )}
                </div>
              </div>
              <div className="flex min-w-[140px] items-center justify-end gap-2">
                <span className="text-sm font-medium text-foreground">
                  {leverageTokenConfig.symbol}
                </span>
                <div className="flex -space-x-1">
                  <AssetDisplay
                    asset={leverageTokenConfig.collateralAsset}
                    size="sm"
                    variant="logo-only"
                  />
                  <AssetDisplay
                    asset={leverageTokenConfig.debtAsset}
                    size="sm"
                    variant="logo-only"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-start justify-end gap-3 text-sm">
              <div className="flex flex-col items-end text-foreground">
                <div>
                  {isCalculating ? (
                    <span className="inline-flex items-center" aria-live="polite">
                      <Loader2 className="h-3 w-3 animate-spin" aria-label="Calculating" />
                    </span>
                  ) : expectedDebtAmount && expectedDebtAmount !== '0' && debtAssetSymbol ? (
                    `${expectedDebtAmount}`
                  ) : (
                    '—'
                  )}
                </div>
                <div className="h-4">
                  {isCalculating ? (
                    <Skeleton className="mt-1 h-3 w-20" />
                  ) : (
                    expectedDebtUsdOutStr && (
                      <div className="text-xs text-secondary-foreground">
                        ≈ ${expectedDebtUsdOutStr}
                      </div>
                    )
                  )}
                </div>
              </div>
              <div className="flex min-w-[140px] items-center justify-end gap-2">
                <span className="text-secondary-foreground">
                  {debtAssetSymbol ?? leverageTokenConfig.debtAsset.symbol}
                </span>
                <div className="flex items-center gap-1">
                  <AssetDisplay
                    asset={leverageTokenConfig.debtAsset}
                    size="sm"
                    variant="logo-only"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-1 text-right text-xs text-secondary-foreground">
            {!isCalculating && totalUsdOutStr && <div>≈ ${totalUsdOutStr}</div>}
          </div>
        </Card>
      </div>

      <Card
        variant="gradient"
        className="gap-2 border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] p-4"
      >
        <h4 className="mb-3 text-sm font-medium text-foreground">Transaction Preview</h4>
        <div className="space-y-2 text-sm">
          {impactWarning && (
            <div className="flex items-start gap-2 rounded-md border border-[var(--tag-warning-bg)]/40 bg-[var(--tag-warning-bg)]/20 p-2 text-[var(--tag-warning-text)]">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <div>{impactWarning}</div>
            </div>
          )}
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
          <div className="flex items-center justify-between">
            <span className="text-secondary-foreground">Quote source</span>
            {isCalculating ? (
              <span className="inline-flex items-center" aria-live="polite">
                <Loader2 className="h-3 w-3 animate-spin" aria-label="Calculating" />
              </span>
            ) : quoteSource ? (
              <span className="text-foreground">{quoteSource}</span>
            ) : (
              <span className="text-secondary-foreground">—</span>
            )}
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

          {/* Optional route & safety breakdown */}
          {!isCalculating && breakdown && breakdown.length > 0 && (
            <details className="mt-2 text-xs text-secondary-foreground">
              <summary className="cursor-pointer select-none">Show route & safety details</summary>
              <div className="mt-2 space-y-1">
                {breakdown.map((row) => (
                  <div
                    key={`${row.label}:${row.value}`}
                    className="flex items-center justify-between"
                  >
                    <span>{row.label}</span>
                    <span className="text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </Card>

      {error && <Alert type="error" title="Error" description={error} />}

      {/* Supply Cap Error */}
      {supplyCapExceeded && (
        <Alert
          type="error"
          title="Supply Cap Exceeded"
          description="The mint amount exceeds the current Leverage Token recommended mint cap."
        />
      )}

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
