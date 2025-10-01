import { Percent, Settings, TrendingDown } from 'lucide-react'
import { useId } from 'react'
import { cn } from '@/lib/utils/cn'
import { Alert } from '../../../../components/ui/alert'
import { Button } from '../../../../components/ui/button'
import { Card } from '../../../../components/ui/card'
import { Input } from '../../../../components/ui/input'
import { Skeleton } from '../../../../components/ui/skeleton'
import { AMOUNT_PERCENTAGE_PRESETS, SLIPPAGE_PRESETS_PERCENT_DISPLAY } from '../../constants'

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
  redemptionFee?: bigint | undefined
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
}: InputStepProps) {
  const redeemAmountId = useId()

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
      : 'text-[var(--text-muted)]'

  const earnedUsd = hasEarnedUsd ? formatUsdValue(earnings.earnedUsd as number) : undefined
  const showEarnedUsdSecondary = hasEarnedDebt && earnedUsd

  const balanceFloat = parseFloat(selectedToken.balance)
  const pricePerToken = balanceFloat > 0 ? selectedToken.price / balanceFloat : 0

  return (
    <div className="space-y-6">
      <Card
        variant="gradient"
        className="gap-0 border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] p-4"
      >
        <h4 className="mb-3 text-sm font-medium text-[var(--text-primary)]">Your Position</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="block text-[var(--text-secondary)]">Leverage Tokens</span>
            <span className="font-medium text-[var(--text-primary)]">
              {isLeverageTokenBalanceLoading ? (
                <Skeleton className="inline-block h-4 w-16" />
              ) : (
                selectedToken.balance
              )}
            </span>
          </div>
          <div>
            <span className="block text-[var(--text-secondary)]">Current Value</span>
            <span className="font-medium text-[var(--text-primary)]">
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
            <span className="block text-[var(--text-secondary)]">Total Earned</span>
            {isUserMetricsLoading ? (
              <Skeleton className="inline-block h-4 w-20" />
            ) : earnedDisplay ? (
              <div className="flex items-center gap-2">
                <span className={cn('font-medium', totalEarnedClass)}>{earnedDisplay}</span>
                {showEarnedUsdSecondary ? (
                  <span className="text-xs text-[var(--text-secondary)]">({earnedUsd})</span>
                ) : null}
              </div>
            ) : (
              <span className="font-medium text-[var(--text-muted)]">$N/A</span>
            )}
          </div>
          <div>
            <span className="block text-[var(--text-secondary)]">Originally Minted</span>
            {isUserMetricsLoading ? (
              <Skeleton className="inline-block h-4 w-20" />
            ) : mintedPrimary ? (
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--text-primary)]">{mintedPrimary}</span>
                {mintedUsd ? (
                  <span className="text-xs text-[var(--text-secondary)]">({mintedUsd})</span>
                ) : null}
              </div>
            ) : (
              <span className="font-medium text-[var(--text-muted)]">$N/A</span>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label
            htmlFor={redeemAmountId}
            className="text-sm font-medium text-[var(--text-primary)]"
          >
            Redemption Amount (Tokens)
          </label>
          <div className="text-xs text-[var(--text-secondary)]">
            Available:{' '}
            {isLeverageTokenBalanceLoading ? (
              <Skeleton className="inline-block h-3 w-16" />
            ) : (
              `${selectedToken.balance} tokens`
            )}
          </div>
        </div>

        <Card
          variant="gradient"
          className="gap-0 border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex-1">
              <Input
                id={redeemAmountId}
                type="text"
                placeholder="0"
                value={amount}
                onChange={(e) => onAmountChange(e.target.value)}
                className="h-auto border-0 bg-transparent px-3 text-2xl font-medium text-[var(--text-primary)] focus:ring-0 focus:ring-offset-0"
              />
              <div className="mt-1 text-xs text-[var(--text-secondary)]">
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
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--brand-secondary) 20%,transparent)]">
                <TrendingDown className="h-3 w-3 text-[var(--brand-secondary)]" />
              </div>
              <span className="text-sm font-medium text-[var(--text-primary)]">Tokens</span>
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
                  className="h-7 border border-[var(--divider-line)] px-2 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[color-mix(in_srgb,var(--surface-elevated) 35%,transparent)] hover:text-[var(--text-primary)]"
                >
                  {percentage === 100 ? 'MAX' : `${percentage}%`}
                </Button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleAdvanced}
              className="text-[var(--brand-secondary)] transition-colors hover:text-[color-mix(in_srgb,var(--brand-secondary) 85%,black 15%)]"
            >
              <Settings className="mr-1 h-4 w-4 text-[inherit]" />
              Advanced
            </Button>
          </div>
        </Card>

        {showAdvanced && (
          <Card
            variant="gradient"
            className="gap-0 border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] p-4"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-[var(--text-primary)]">
                Slippage Tolerance
              </div>
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
                        : 'border border-[var(--divider-line)] text-[var(--text-secondary)] hover:bg-[color-mix(in_srgb,var(--surface-elevated) 35%,transparent)] hover:text-[var(--text-primary)]',
                    )}
                  >
                    {value}%
                  </Button>
                ))}
                <div className="flex items-center space-x-1">
                  <Input
                    type="text"
                    value={slippage}
                    onChange={(e) => onSlippageChange(e.target.value)}
                    className="h-8 w-16 border border-[var(--divider-line)] bg-[var(--input-background)] text-center text-xs text-[var(--text-primary)]"
                    placeholder="0.5"
                  />
                  <Percent className="h-3 w-3 text-[var(--text-muted)]" />
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <div className="text-sm font-medium text-[var(--text-primary)]">Redeem to</div>
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
                  : 'border border-[var(--divider-line)] text-[var(--text-secondary)] hover:bg-[color-mix(in_srgb,var(--surface-elevated) 35%,transparent)] hover:text-[var(--text-primary)]',
                disabledAssets.includes(asset.id) && 'cursor-not-allowed opacity-50',
              )}
            >
              {asset.symbol}
            </Button>
          ))}
        </div>
      </div>

      <Card
        variant="gradient"
        className="gap-2 border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] p-4"
      >
        <h4 className="mb-3 text-sm font-medium text-[var(--text-primary)]">Transaction Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Redeem Amount</span>
            <span className="text-[var(--text-primary)]">
              {amount || '0'} {selectedToken.symbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Redemption Fee</span>
            <span className="text-[var(--text-primary)]">
              {isRedemptionFeeLoading ? (
                <Skeleton className="inline-block h-4 w-12" />
              ) : typeof redemptionFee === 'bigint' ? (
                `${Number(redemptionFee) / 100}%`
              ) : (
                <Skeleton className="inline-block h-4 w-12" />
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Slippage Tolerance</span>
            <span className="text-[var(--text-primary)]">{slippage}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Approval Status</span>
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
          <div className="flex justify-between font-medium">
            <span className="text-[var(--text-primary)]">You will receive</span>
            <span className="text-[var(--text-primary)]">
              {isCalculating ? (
                <Skeleton className="inline-block h-4 w-24" />
              ) : (
                `${expectedAmount} ${selectedAssetSymbol}`
              )}
            </span>
          </div>
        </div>
      </Card>

      <div className="rounded-lg border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] p-3">
        <div className="flex items-center text-sm text-[var(--text-secondary)]">
          <TrendingDown className="mr-2 h-4 w-4 text-[var(--state-warning-text)]" />
          <div>
            <p className="font-medium text-[var(--text-primary)]">Redemption Fee</p>
            <p className="text-xs mt-1">
              {isRedemptionFeeLoading ? (
                <Skeleton className="inline-block h-3 w-48" />
              ) : typeof redemptionFee === 'bigint' ? (
                `A ${Number(redemptionFee) / 100}% redemption fee applies to cover rebalancing costs.`
              ) : (
                'A redemption fee applies to cover rebalancing costs.'
              )}
            </p>
          </div>
        </div>
      </div>

      {error && <Alert type="error" title="Error" description={error} />}

      <Button
        onClick={onApprove}
        disabled={!canProceed}
        variant="gradient"
        className="h-12 w-full font-medium"
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
