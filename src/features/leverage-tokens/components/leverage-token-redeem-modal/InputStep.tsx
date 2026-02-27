import { AlertTriangle, ArrowDown, Loader2, Settings } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { SlippageInput } from '@/features/leverage-tokens/components/SlippageInput'
import { cn } from '@/lib/utils/cn'
import { Alert } from '../../../../components/ui/alert'
import { AssetDisplay } from '../../../../components/ui/asset-display'
import { Button } from '../../../../components/ui/button'
import { Card } from '../../../../components/ui/card'
import { Input } from '../../../../components/ui/input'
import { Separator } from '../../../../components/ui/separator'
import { Skeleton } from '../../../../components/ui/skeleton'
import {
  AMOUNT_PERCENTAGE_PRESETS,
  DEFAULT_COLLATERAL_SLIPPAGE_PERCENT_DISPLAY,
  DEFAULT_COLLATERAL_SWAP_ADJUSTMENT_PERCENT_DISPLAY,
  DEFAULT_SWAP_SLIPPAGE_PERCENT_DISPLAY,
  MIN_REDEEM_AMOUNT_DISPLAY,
} from '../../constants'
import type { SwapConfig } from '../../leverageTokens.config'

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
  slippagePresets?: {
    redeem?: {
      defaultCollateralSlippage?: string
      presetsCollateralSlippage?: Array<string>
    }
  }
  swaps?: {
    collateralToDebt?: SwapConfig
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
  collateralSlippage: string
  onCollateralSlippageChange: (value: string) => void
  swapSlippage: string
  onSwapSlippageChange: (value: string) => void
  collateralSwapAdjustment: string
  onCollateralSwapAdjustmentChange: (value: string) => void
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
  collateralSlippage,
  onCollateralSlippageChange,
  swapSlippage,
  onSwapSlippageChange,
  collateralSwapAdjustment,
  onCollateralSwapAdjustmentChange,
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
  const collateralSlippageInputRef = useRef<HTMLInputElement>(null)

  const redeemAmountId = useId()

  // Auto-select and focus collateral slippage input when advanced is shown
  useEffect(() => {
    if (showAdvanced && collateralSlippageInputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        collateralSlippageInputRef.current?.focus()
        collateralSlippageInputRef.current?.select()
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

            <div className="ml-4 flex items-center gap-1.5 pb-2">
              <div className="flex -space-x-1">
                <AssetDisplay
                  asset={leverageTokenConfig.collateralAsset}
                  size="sm"
                  variant="logo-only"
                />
                <AssetDisplay asset={leverageTokenConfig.debtAsset} size="sm" variant="logo-only" />
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
          <>
            <SlippageInput
              label={`${leverageTokenConfig.collateralAsset.symbol} Slippage Tolerance`}
              tooltipText={`The maximum allowed difference between the previewed ${leverageTokenConfig.collateralAsset.symbol} amount received and actual amount received when executed onchain.`}
              defaultValue={
                leverageTokenConfig.slippagePresets?.redeem?.defaultCollateralSlippage ??
                DEFAULT_COLLATERAL_SLIPPAGE_PERCENT_DISPLAY
              }
              value={collateralSlippage}
              onChange={onCollateralSlippageChange}
              inputRef={collateralSlippageInputRef}
              step={0.1}
              min={0}
              max={50}
              precision={1}
            />
            <SlippageInput
              label={`Collateral Swap Adjustment`}
              tooltipText="Advanced setting. The default value works in most cases."
              defaultValue={DEFAULT_COLLATERAL_SWAP_ADJUSTMENT_PERCENT_DISPLAY}
              value={collateralSwapAdjustment}
              onChange={onCollateralSwapAdjustmentChange}
              step={0.01}
              min={0}
              max={50}
              precision={2}
            />
            <SlippageInput
              label="Swap Slippage Tolerance"
              tooltipText="Advanced setting. The default value works in most cases."
              defaultValue={DEFAULT_SWAP_SLIPPAGE_PERCENT_DISPLAY}
              value={swapSlippage}
              onChange={onSwapSlippageChange}
              step={0.01}
              min={0.01}
              max={10}
              precision={2}
            />
          </>
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
            <div className="flex items-center gap-1.5">
              {isCalculating && (
                <Loader2 className="h-3 w-3 animate-spin text-slate-400" aria-label="Calculating" />
              )}
              <AssetDisplay
                asset={leverageTokenConfig.collateralAsset}
                size="sm"
                variant="logo-only"
              />
              <span className="text-sm font-medium text-foreground">{collateralAssetSymbol}</span>
            </div>
          </div>

          <div>
            <div className="text-2xl font-semibold text-foreground">
              {isCalculating ? <Skeleton className="h-7 w-28" /> : expectedTokens}
            </div>
            {!isCalculating && (
              <>
                <div className="text-xs text-secondary-foreground">
                  {expectedExcessDebt && expectedExcessDebt !== '0' && debtAssetSymbol && (
                    <>
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
