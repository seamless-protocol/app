import { ChevronDown, ChevronUp, Loader2, Percent, Settings, TrendingDown } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { cn } from '@/lib/utils/cn'
import { Alert } from '../../../../components/ui/alert'
import { Button } from '../../../../components/ui/button'
import { Card } from '../../../../components/ui/card'
import { Input } from '../../../../components/ui/input'
import { Skeleton } from '../../../../components/ui/skeleton'
import {
  AMOUNT_PERCENTAGE_PRESETS,
  MIN_REDEEM_AMOUNT_DISPLAY,
  SLIPPAGE_PRESETS_PERCENT_DISPLAY,
} from '../../constants'

type OutputAssetId = 'collateral' | 'debt'

interface Token {
  symbol: string
  name: string
  balance: string
  price: number
  logo?: string
}

interface Asset {
  id: OutputAssetId
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

interface EarningsDisplay {
  mintedDebt?: number
  mintedCollateral?: number
  mintedUsd?: number
  earnedDebt?: number
  earnedUsd?: number
}

interface InputStepProps {
  selectedToken: Token
  availableAssets: Array<Asset>
  amount: string
  redemptionFee?: string | undefined
  onAmountChange: (value: string) => void
  onPercentageClick: (percentage: number) => void
  selectedAssetId: OutputAssetId
  onAssetChange: (asset: OutputAssetId) => void
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

  // Calculations
  expectedAmount: string
  selectedAssetSymbol: string
  selectedAssetPrice?: number
  earnings: EarningsDisplay
  debtSymbol: string
  collateralSymbol: string
  isUserMetricsLoading: boolean
  disabledAssets?: Array<OutputAssetId>
  canProceed: boolean
  needsApproval: boolean
  isConnected: boolean
  onApprove: () => void
  error?: string | undefined
  leverageTokenConfig: LeverageTokenConfig
  redeemTokenFee?: string | undefined
  isRedeemTokenFeeLoading?: boolean | undefined

  // Warning
  isBelowMinimum?: boolean | undefined
  // Debt asset information
  expectedDebtAmount?: string
  debtAssetSymbol?: string
  debtAssetPrice?: number | undefined
}

export function InputStep({
  selectedToken,
  availableAssets,
  amount,
  onAmountChange,
  onPercentageClick,
  selectedAssetId,
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
  selectedAssetSymbol,
  selectedAssetPrice,
  earnings,
  debtSymbol,
  collateralSymbol,
  isUserMetricsLoading,
  disabledAssets = [],
  canProceed,
  needsApproval,
  isConnected,
  onApprove,
  error,
  leverageTokenConfig,
  redemptionFee,
  isRedemptionFeeLoading,
  redeemTokenFee,
  isRedeemTokenFeeLoading,
  isBelowMinimum,
  expectedDebtAmount,
  debtAssetSymbol,
  debtAssetPrice,
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

  const formatAssetValue = (value: number, symbol: string) =>
    `${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    })} ${symbol}`

  const formatUsdValue = (value: number) =>
    `${value < 0 ? '-' : ''}$${Math.abs(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`

  const hasMintedDebt =
    typeof earnings.mintedDebt === 'number' && Number.isFinite(earnings.mintedDebt)
  const hasMintedCollateral =
    typeof earnings.mintedCollateral === 'number' && Number.isFinite(earnings.mintedCollateral)
  const hasMintedUsd = typeof earnings.mintedUsd === 'number' && Number.isFinite(earnings.mintedUsd)

  const mintedPrimary = hasMintedDebt
    ? formatAssetValue(earnings.mintedDebt as number, debtSymbol)
    : hasMintedCollateral
      ? formatAssetValue(earnings.mintedCollateral as number, collateralSymbol)
      : undefined

  const mintedUsd = hasMintedUsd ? formatUsdValue(earnings.mintedUsd as number) : undefined

  const hasEarnedDebt =
    typeof earnings.earnedDebt === 'number' && Number.isFinite(earnings.earnedDebt)
  const hasEarnedUsd = typeof earnings.earnedUsd === 'number' && Number.isFinite(earnings.earnedUsd)

  const earnedDebtValue = hasEarnedDebt ? (earnings.earnedDebt as number) : 0
  const earnedDisplay = hasEarnedDebt
    ? formatAssetValue(earnedDebtValue, debtSymbol)
    : hasEarnedUsd
      ? formatUsdValue(earnings.earnedUsd as number)
      : undefined

  const totalEarnedClass =
    hasEarnedDebt || hasEarnedUsd
      ? (hasEarnedDebt ? earnedDebtValue : (earnings.earnedUsd as number)) >= 0
        ? 'text-[var(--state-success-text)]'
        : 'text-[var(--state-error-text)]'
      : 'text-muted-foreground'

  const earnedUsd = hasEarnedUsd ? formatUsdValue(earnings.earnedUsd as number) : undefined
  const showEarnedUsdSecondary = hasEarnedDebt && earnedUsd

  const balanceFloat = parseFloat(selectedToken.balance)
  const pricePerToken = balanceFloat > 0 ? selectedToken.price / balanceFloat : 0

  // Derive minimal, KISS action button state for consistency with Mint
  const actionState = (() => {
    if (!isConnected) return { label: 'Connect Wallet', busy: false }
    const amountNum = parseFloat(amount || '0')
    const balanceNum = parseFloat(selectedToken.balance || '0')
    if (amountNum === 0) return { label: 'Enter an amount', busy: false }
    if (amountNum > balanceNum)
      return { label: `Insufficient ${selectedToken.symbol}`, busy: false }
    if (isCalculating) return { label: 'Calculating...', busy: true }
    if (isAllowanceLoading) return { label: 'Checking allowance...', busy: true }
    if (isApproving) return { label: 'Approving...', busy: true }
    if (needsApproval) return { label: `Approve ${selectedToken.symbol}`, busy: false }
    return { label: `Redeem ${leverageTokenConfig.symbol}`, busy: false }
  })()

  return (
    <div className="space-y-6">
      <Card variant="gradient" className="gap-0 border border-border bg-card p-4">
        <h4 className="mb-3 text-sm font-medium text-foreground">Your Position</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="block text-secondary-foreground">Leverage Tokens</span>
            <span className="font-medium text-foreground">
              {isLeverageTokenBalanceLoading ? (
                <Skeleton className="inline-block h-4 w-16" />
              ) : (
                selectedToken.balance
              )}
            </span>
          </div>
          <div>
            <span className="block text-secondary-foreground">Current Value</span>
            <span className="font-medium text-foreground">
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
            <span className="block text-secondary-foreground">Total Earned</span>
            {isUserMetricsLoading ? (
              <Skeleton className="inline-block h-4 w-20" />
            ) : earnedDisplay ? (
              <div className="flex items-center gap-2">
                <span className={cn('font-medium', totalEarnedClass)}>{earnedDisplay}</span>
                {showEarnedUsdSecondary ? (
                  <span className="text-xs text-secondary-foreground">({earnedUsd})</span>
                ) : null}
              </div>
            ) : (
              <span className="font-medium text-muted-foreground">$N/A</span>
            )}
          </div>
          <div>
            <span className="block text-secondary-foreground">Originally Minted</span>
            {isUserMetricsLoading ? (
              <Skeleton className="inline-block h-4 w-20" />
            ) : mintedPrimary ? (
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{mintedPrimary}</span>
                {mintedUsd ? (
                  <span className="text-xs text-secondary-foreground">({mintedUsd})</span>
                ) : null}
              </div>
            ) : (
              <span className="font-medium text-muted-foreground">$N/A</span>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor={redeemAmountId} className="text-sm font-medium text-foreground">
            Redemption Amount
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
              className="text-brand-purple transition-colors hover:text-[color-mix(in_srgb,var(--brand-secondary) 85%,black 15%)]"
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
                        ? 'border border-[var(--brand-secondary)] bg-[var(--brand-secondary)] text-[var(--primary-foreground)] hover:bg-[color-mix(in_srgb,var(--brand-secondary) 85%,black 15%)]'
                        : 'border border-border text-secondary-foreground hover:bg-accent hover:text-foreground',
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

      <div className="space-y-4">
        <div className="text-sm font-medium text-foreground">Redeem to</div>
        <div className="flex space-x-3">
          {availableAssets.map((asset) => (
            <Button
              key={asset.id}
              variant={selectedAssetId === asset.id ? 'default' : 'outline'}
              onClick={() => onAssetChange(asset.id)}
              disabled={disabledAssets.includes(asset.id)}
              className={cn(
                'flex-1 transition-colors',
                selectedAssetId === asset.id
                  ? 'border border-[var(--brand-secondary)] bg-[var(--brand-secondary)] text-[var(--primary-foreground)] hover:bg-[color-mix(in_srgb,var(--brand-secondary) 85%,black 15%)]'
                  : 'border border-border text-secondary-foreground hover:bg-accent hover:text-foreground',
                disabledAssets.includes(asset.id) && 'cursor-not-allowed opacity-50',
              )}
            >
              {asset.symbol}
            </Button>
          ))}
        </div>
      </div>

      <Card variant="gradient" className="gap-2 border border-border bg-card p-4">
        <h4 className="mb-3 text-sm font-medium text-foreground">Transaction Summary</h4>
        <div className="space-y-2 text-sm">
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
          <div className="flex justify-between font-medium">
            <span className="text-foreground">You will receive</span>
            <div className="text-right">
              <div className="text-foreground">
                {isCalculating ? (
                  <span className="inline-flex items-center" aria-live="polite">
                    <Loader2 className="h-3 w-3 animate-spin" aria-label="Calculating" />
                  </span>
                ) : (
                  <>
                    {expectedAmount} {selectedAssetSymbol}
                    {expectedDebtAmount && expectedDebtAmount !== '0' && debtAssetSymbol && (
                      <>
                        {' '}
                        + {expectedDebtAmount} {debtAssetSymbol}
                      </>
                    )}
                  </>
                )}
              </div>
              {!isCalculating &&
                expectedAmount &&
                parseFloat(expectedAmount) > 0 &&
                selectedAssetPrice && (
                  <div className="text-xs text-secondary-foreground">
                    ≈ ${(() => {
                      const mainAssetValue = parseFloat(expectedAmount) * selectedAssetPrice
                      const debtAssetValue =
                        expectedDebtAmount &&
                        expectedDebtAmount !== '0' &&
                        debtAssetSymbol &&
                        debtAssetPrice
                          ? parseFloat(expectedDebtAmount) * debtAssetPrice
                          : 0
                      return (mainAssetValue + debtAssetValue).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    })()}
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
