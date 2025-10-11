import { DollarSign, Target, TrendingUp } from 'lucide-react'
import { GauntletLogo } from '@/components/icons/logos'
import { MorphoLogo } from '@/components/icons/logos/morpho-logo'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useLeverageTokensTVLSubgraph } from '@/features/leverage-tokens/hooks/useLeverageTokensTVLSubgraph'
import { useDeFiLlamaProtocolTVL } from '@/lib/defillama/useProtocolTVL'
import { cn } from '@/lib/utils/cn'
import { formatCurrency, formatPercentage } from '@/lib/utils/formatting'

type VaultStatCardsProps = {
  className?: string
  /** Optional override for TVL (USD). If omitted, uses DeFiLlama protocol TVL. */
  tvlUsdOverride?: number
  /** Optional override for max APY (decimal, e.g., 0.123 for 12.3%). */
  maxApyOverride?: number
}

export function VaultStatCards({ className, tvlUsdOverride, maxApyOverride }: VaultStatCardsProps) {
  const {
    data: defillama,
    isLoading: isTvlLoading,
    isError: isTvlError,
  } = useDeFiLlamaProtocolTVL()

  const protocolTvlUsd = typeof tvlUsdOverride === 'number' ? tvlUsdOverride : defillama?.tvl
  // Until we wire Morpho vault yield aggregation, present a sensible placeholder
  const maxApy = typeof maxApyOverride === 'number' ? maxApyOverride : 0.123
  // Leverage Tokens TVL via subgraph
  const { tvlUsd: leverageTokensTvlUsd, isLoading: isLeverageTvlLoading } =
    useLeverageTokensTVLSubgraph()
  const vaultsTvlUsd =
    typeof protocolTvlUsd === 'number' && typeof leverageTokensTvlUsd === 'number'
      ? Math.max(protocolTvlUsd - leverageTokensTvlUsd, 0)
      : undefined

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-6', className)}>
      {/* Total Vault TVL */}
      <Card
        className={cn(
          'text-card-foreground flex flex-col gap-6 rounded-xl border',
          'bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90',
          'border-slate-700/60 hover:border-cyan-500/30 transition-all duration-500 backdrop-blur-sm',
        )}
      >
        <CardContent className="p-8 text-center">
          <div className="space-y-6">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 via-cyan-400/15 to-cyan-600/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10">
              <DollarSign className="h-8 w-8 text-cyan-400" />
              <span className="sr-only">Total Vault TVL</span>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground tracking-wide uppercase font-medium">
                Total Vault TVL
              </p>

              {isTvlLoading || isLeverageTvlLoading ? (
                <div className="flex justify-center">
                  <Skeleton className="h-10 w-28" />
                </div>
              ) : isTvlError || typeof vaultsTvlUsd !== 'number' ? (
                <p className="text-4xl font-bold tracking-tight">—</p>
              ) : (
                <p className="text-4xl font-bold text-white tracking-tight">
                  {formatCurrency(vaultsTvlUsd, { millionDecimals: 1, thousandDecimals: 1 })}
                </p>
              )}

              <div className="inline-flex items-center space-x-2 rounded-full px-4 py-2 shadow-sm bg-[var(--tag-info-bg)] text-[var(--tag-info-text)] border border-[color-mix(in_srgb,var(--tag-info-text)_30%,transparent)]">
                <div className="flex items-center space-x-1.5">
                  <div className="w-4 h-4 bg-white/10 rounded-full p-0.5 flex items-center justify-center">
                    <MorphoLogo className="w-3 h-3" />
                    <span className="sr-only">Morpho</span>
                  </div>
                  <div className="w-4 h-4 bg-white/10 rounded-full p-0.5 flex items-center justify-center">
                    <GauntletLogo className="w-3 h-3 object-contain" />
                    <span className="sr-only">Gauntlet</span>
                  </div>
                </div>
                <span className="text-xs font-medium">Secured by Morpho & Gauntlet</span>
              </div>

              {/* Intentionally no extra badges shown here */}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earn up to APY */}
      <Card
        className={cn(
          'text-card-foreground flex flex-col gap-6 rounded-xl border',
          'bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90',
          'border-slate-700/60 hover:border-green-500/30 transition-all duration-500 backdrop-blur-sm',
        )}
      >
        <CardContent className="p-8 text-center">
          <div className="space-y-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 via-green-400/15 to-green-600/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-green-500/10">
              <TrendingUp className="h-8 w-8 text-green-400" />
              <span className="sr-only">APY</span>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground tracking-wide uppercase font-medium">
                Earn up to
              </p>

              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold text-white tracking-tight">
                  {formatPercentage(maxApy, { decimals: 1, showSign: false })}
                </span>
                <span className="text-lg text-muted-foreground font-medium">APY</span>
              </div>

              <div className="flex items-center justify-center pt-2">
                <div className="inline-flex items-center space-x-1.5 text-xs rounded-full px-3 py-1 bg-[var(--tag-success-bg)] text-[var(--tag-success-text)] border border-[color-mix(in_srgb,var(--tag-success-text)_30%,transparent)]">
                  <Target className="h-3.5 w-3.5 text-[var(--tag-success-text)]" />
                  <span className="font-medium">Competitive yields</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
