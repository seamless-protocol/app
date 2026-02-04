import {
  AlertTriangle,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  Percent,
  Settings,
  TrendingUp,
} from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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
  SLIPPAGE_PRESETS_PERCENT_DISPLAY_MINT,
  SWAP_SLIPPAGE_PRESETS_PERCENT_DISPLAY,
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
    mint?: {
      default: string
      presets: Array<string>
    }
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
  swapSlippage: string
  onSwapSlippageChange: (value: string) => void
  isCollateralBalanceLoading: boolean
  isUsdPriceLoading: boolean
  isCalculating: boolean
  isAllowanceLoading: boolean
  isApproving: boolean
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
  // Optional impact warning text
  impactWarning?: string
  supplyCapExceeded?: boolean | undefined
  // Debt asset information
  expectedDebtAmount?: string
  debtAssetSymbol?: string
  // Selected quote source name/label
  quoteSourceName?: string | undefined
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
  swapSlippage,
  onSwapSlippageChange,
  isCollateralBalanceLoading,
  isUsdPriceLoading,
  isCalculating,
  isAllowanceLoading,
  isApproving,
  expectedTokens,
  expectedTokensUsdOutStr,
  expectedExcessDebt,
  minTokens,
  minExcessDebt,
  expectedDebtUsdOutStr,
  expectedTotalUsdOutStr,
  minTokensUsdOutStr,
  minExcessDebtUsdOutStr,
  minTotalUsdOutStr,
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
  impactWarning,
  supplyCapExceeded,
  debtAssetSymbol,
  quoteSourceName,
}: InputStepProps) {
  const mintAmountId = useId()

  const swapSlippageInputRef = useRef<HTMLInputElement>(null)
  const [desktopSwapSlippageTooltipOpen, setDesktopSwapSlippageTooltipOpen] = useState(false)

  const shareSlippageInputRef = useRef<HTMLInputElement>(null)
  const [desktopShareSlippageTooltipOpen, setDesktopShareSlippageTooltipOpen] = useState(false)

  // Auto-select and focus slippage input when advanced is shown
  useEffect(() => {
    if (showAdvanced && shareSlippageInputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        shareSlippageInputRef.current?.focus()
        shareSlippageInputRef.current?.select()
      }, 100)
    }
  }, [showAdvanced])

  // Derive action button state
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
    return { label: `Mint ${leverageTokenConfig.symbol}`, busy: false }
  })()

  const slippagePresets =
    leverageTokenConfig.slippagePresets?.mint?.presets || SLIPPAGE_PRESETS_PERCENT_DISPLAY_MINT

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
          // TODO: Move these cards into a resuable component instead of duplicating here
          <>
            <Card variant="gradient" className="gap-0 border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-xs font-medium text-foreground">Share Slippage</div>
                  <Tooltip
                    open={desktopShareSlippageTooltipOpen}
                    onOpenChange={setDesktopShareSlippageTooltipOpen}
                  >
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center text-text-muted hover:text-secondary-foreground transition-colors min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:p-0 -m-2 sm:m-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDesktopShareSlippageTooltipOpen((prev) => !prev)
                        }}
                      >
                        <Info className="h-5 w-5 sm:h-3 sm:w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-2xs p-0 text-sm bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)]">
                      <div className="min-w-52 max-w-2xs space-y-2 rounded-lg border border-border bg-card p-4">
                        <div className="text-sm wrap-break-word text-[var(--text-primary)]">
                          The maximum allowed difference between the expected amount of Leverage
                          Token shares to be received and the actual amount received.
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
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
                        ref={shareSlippageInputRef}
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
            <Card variant="gradient" className="gap-0 border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-xs font-medium text-foreground">Swap Slippage</div>
                  <Tooltip
                    open={desktopSwapSlippageTooltipOpen}
                    onOpenChange={setDesktopSwapSlippageTooltipOpen}
                  >
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center text-text-muted hover:text-secondary-foreground transition-colors min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:p-0 -m-2 sm:m-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDesktopSwapSlippageTooltipOpen((prev) => !prev)
                        }}
                      >
                        <Info className="h-5 w-5 sm:h-3 sm:w-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-2xs p-0 text-sm bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)]">
                      <div className="min-w-52 max-w-2xs space-y-2 rounded-lg border border-border bg-card p-4">
                        <div className="text-sm wrap-break-word text-[var(--text-primary)]">
                          The maximum allowed difference between the expected amount of collateral
                          received from the swap of flash loaned debt performed during the mint flow
                          and the actual amount received. If the mint simulation fails due to the
                          minimum debt being less than the flash loan amount, you can try decreasing
                          this value.
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center space-x-2">
                  {SWAP_SLIPPAGE_PRESETS_PERCENT_DISPLAY.map((value) => (
                    <Button
                      key={value}
                      variant={swapSlippage === value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onSwapSlippageChange(value)}
                      className={cn(
                        'h-8 px-3 text-xs transition-colors',
                        swapSlippage === value
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
                        ref={swapSlippageInputRef}
                        type="text"
                        value={swapSlippage}
                        onChange={(e) => onSwapSlippageChange(e.target.value)}
                        className="h-8 w-16 border border-border bg-input text-center text-xs text-foreground pr-6"
                        placeholder="0.5"
                      />
                      <div className="absolute right-1 top-0 flex h-full flex-col items-center justify-center space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            const currentValue = parseFloat(swapSlippage) || 0
                            const newValue = Math.min(currentValue + 0.01, 10).toFixed(2)
                            onSwapSlippageChange(newValue)
                          }}
                          className="flex h-4 w-4 items-center justify-center hover:bg-muted rounded-sm transition-colors"
                        >
                          <ChevronUp className="h-2 w-2 text-muted-foreground hover:text-foreground" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const currentValue = parseFloat(swapSlippage) || 0
                            const newValue = Math.max(currentValue - 0.01, 0.01).toFixed(2)
                            onSwapSlippageChange(newValue)
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
          </>
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
                <TrendingUp className="h-3 w-3 text-brand-purple" />
              </div>
              <div className="text-sm font-medium text-foreground">
                {leverageTokenConfig.symbol}
              </div>
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
          <div className="flex justify-between font-medium items-center">
            <span className="text-foreground">You will receive at least</span>
            <div className="text-right">
              <div className="text-foreground">
                {isCalculating ? (
                  <span className="inline-flex items-center" aria-live="polite">
                    <Loader2 className="h-3 w-3 animate-spin" aria-label="Calculating" />
                  </span>
                ) : (
                  <>
                    {minTokens} {leverageTokenConfig.symbol}
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
                    expectedTotalUsdOutStr &&
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
