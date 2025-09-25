import { ArrowDownUp, Percent, RefreshCw, Settings, TrendingUp } from 'lucide-react'
import { useId } from 'react'
import { cn } from '@/lib/utils/cn'
import { Alert } from '../../../../components/ui/alert'
import { AssetDisplay } from '../../../../components/ui/asset-display'
import { Button } from '../../../../components/ui/button'
import { Card } from '../../../../components/ui/card'
import { FilterDropdown } from '../../../../components/ui/filter-dropdown'
import { Input } from '../../../../components/ui/input'
import { Separator } from '../../../../components/ui/separator'
import { Skeleton } from '../../../../components/ui/skeleton'
import { formatAPY } from '../../../../lib/utils/formatting'
import { AMOUNT_PERCENTAGE_PRESETS, SLIPPAGE_PRESETS_PERCENT_DISPLAY } from '../../constants'

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
  apy?: number | undefined
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
  apy,
}: InputStepProps) {
  const mintAmountId = useId()

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor={mintAmountId} className="text-sm font-medium text-[var(--text-primary)]">
            Mint Amount
          </label>
          <div className="text-xs text-[var(--text-secondary)]">
            Balance:{' '}
            {isCollateralBalanceLoading ? (
              <Skeleton className="inline-block h-3 w-16" />
            ) : (
              `${selectedToken.balance} ${selectedToken.symbol}`
            )}
          </div>
        </div>

        <Card
          variant="gradient"
          className="gap-0 border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] p-4"
        >
          <div className="mb-3 flex items-end justify-between">
            <div className="flex-1">
              <div className="flex">
                <Input
                  id={mintAmountId}
                  type="text"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => onAmountChange(e.target.value)}
                  className="h-auto px-3 text-lg font-medium text-[var(--text-primary)] focus:ring-0 focus:ring-offset-0"
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
              <div className="mt-1 text-xs text-[var(--text-secondary)]">
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
              className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              <Settings className="mr-1 h-4 w-4" />
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

      <div className="space-y-3">
        <div className="flex justify-center">
          <div className="rounded-full border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 90%,transparent)] p-2">
            <ArrowDownUp className="h-4 w-4 text-[var(--text-muted)]" />
          </div>
        </div>

        <Card
          variant="gradient"
          className="gap-0 border border-[var(--divider-line)] bg-[color-mix(in_srgb,var(--surface-card) 92%,transparent)] p-4"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm text-[var(--text-secondary)]">You will receive</div>
            {isCalculating && (
              <div className="flex items-center text-xs text-[var(--text-secondary)]">
                <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                <Skeleton className="h-3 w-20" />
              </div>
            )}
          </div>

          <div className="flex items-end justify-between">
            <div className="flex-1">
              <div className="text-xl font-medium text-[var(--text-primary)]">
                {isCalculating ? <Skeleton className="h-6 w-20" /> : expectedTokens}
              </div>
              <div className="mt-1 text-sm text-[var(--text-secondary)]">Leverage Tokens</div>
            </div>

            <div className="ml-4 flex items-center space-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--brand-secondary) 20%,transparent)]">
                <TrendingUp className="h-3 w-3 text-[var(--brand-secondary)]" />
              </div>
              <span className="text-sm font-medium text-[var(--text-primary)]">
                {leverageTokenConfig.symbol}
              </span>
            </div>
          </div>

          {parseFloat(expectedTokens) > 0 && (
            <div className="mt-3 border-t border-[var(--divider-line)] pt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Target Leverage</span>
                <div className="flex items-center text-[var(--brand-secondary)]">
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
        <h4 className="mb-3 text-sm font-medium text-[var(--text-primary)]">Transaction Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Mint Amount</span>
            <span className="text-[var(--text-primary)]">
              {amount || '0'} {selectedToken.symbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Current APY</span>
            <span className="text-[var(--state-success-text)]">
              {apy ? formatAPY(apy, 2) : '0%'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-secondary)]">Management Fee</span>
            <span className="text-[var(--text-primary)]">2.0%</span>
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
          <Separator className="my-2 bg-[var(--divider-line)]" />
          <div className="flex justify-between font-medium">
            <span className="text-[var(--text-primary)]">You will receive</span>
            <span className="text-[var(--text-primary)]">{expectedTokens} tokens</span>
          </div>
        </div>
      </Card>

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
              ? 'Insufficient balance'
              : !canProceed && parseFloat(amount || '0') < 0.01
                ? 'Minimum mint: 0.01'
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
