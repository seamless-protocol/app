import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { Address } from 'viem'
import { formatUnits } from 'viem'
import type { Config } from 'wagmi'
import { getQuoteIntentForAdapter } from '@/domain/redeem/orchestrate'
import { planRedeem } from '@/domain/redeem/planner/plan'
import type { QuoteFn } from '@/domain/redeem/planner/types'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { ltKeys } from '@/features/leverage-tokens/utils/queryKeys'

interface UseRedeemPlanPreviewParams {
  config: Config
  token: Address
  sharesToRedeem: bigint | undefined
  slippageBps: number
  chainId: number
  enabled: boolean
  quote?: QuoteFn
  managerAddress?: Address
  swapKey?: string
  outputAsset?: Address
  // For derived USD estimates (optional; omit to skip)
  collateralUsdPrice?: number | undefined
  debtUsdPrice?: number | undefined
  collateralDecimals?: number | undefined
  debtDecimals?: number | undefined
}

export function useRedeemPlanPreview({
  config,
  token,
  sharesToRedeem,
  slippageBps,
  chainId,
  quote,
  managerAddress,
  swapKey,
  outputAsset,
  enabled = true,
  collateralUsdPrice,
  debtUsdPrice,
  collateralDecimals,
  debtDecimals,
}: UseRedeemPlanPreviewParams) {
  const enabledQuery =
    enabled &&
    typeof sharesToRedeem === 'bigint' &&
    sharesToRedeem > 0n &&
    typeof quote === 'function'

  const keyParams = {
    chainId,
    addr: token,
    amount: sharesToRedeem ?? 0n,
    slippageBps,
    ...(managerAddress ? { managerAddress } : {}),
    ...(swapKey ? { swapKey } : {}),
    ...(outputAsset ? { outputAsset } : {}),
  }

  const query = useQuery({
    queryKey: ltKeys.simulation.redeemPlanKey(keyParams),
    enabled: enabledQuery,
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: 1,
    queryFn: async () => {
      if (!enabled || !quote || typeof sharesToRedeem !== 'bigint') {
        throw new Error('Redeem plan prerequisites missing')
      }

      const intent = getQuoteIntentForAdapter(
        getLeverageTokenConfig(token, chainId)?.swaps?.collateralToDebt?.type ?? 'velora',
      )

      return planRedeem({
        config,
        token,
        sharesToRedeem,
        slippageBps,
        quoteCollateralToDebt: quote,
        chainId,
        ...(managerAddress ? { managerAddress } : {}),
        ...(outputAsset ? { outputAsset } : {}),
        intent,
      })
    },
  })

  // Derived USD estimate from the plan (expected outcome)
  // Total value = expectedCollateral + expectedDebtPayout (mirrors planner logic)
  const expectedUsdOut = useMemo(() => {
    const plan = query.data
    if (!plan) return undefined
    if (typeof collateralUsdPrice !== 'number' || typeof debtUsdPrice !== 'number') return undefined
    if (typeof collateralDecimals !== 'number' || typeof debtDecimals !== 'number') return undefined
    try {
      const collateralAmount = Number(formatUnits(plan.expectedCollateral, collateralDecimals))
      const debtPayoutAmount = Number(formatUnits(plan.expectedDebtPayout, debtDecimals))
      if (!Number.isFinite(collateralAmount) || !Number.isFinite(debtPayoutAmount)) return undefined
      const usd = collateralAmount * collateralUsdPrice + debtPayoutAmount * debtUsdPrice
      return Number.isFinite(usd) ? Math.max(usd, 0) : undefined
    } catch {
      return undefined
    }
  }, [query.data, collateralUsdPrice, debtUsdPrice, collateralDecimals, debtDecimals])

  // Derived USD estimate (worst-case guarantee based on minCollateralForSender)
  // Worst case = minCollateral + expectedDebtPayout (debt payout is relatively stable)
  const guaranteedUsdOut = useMemo(() => {
    const plan = query.data
    if (!plan) return undefined
    if (typeof collateralUsdPrice !== 'number' || typeof debtUsdPrice !== 'number') return undefined
    if (typeof collateralDecimals !== 'number' || typeof debtDecimals !== 'number') return undefined
    try {
      const minCollateralAmount = Number(
        formatUnits(plan.minCollateralForSender, collateralDecimals),
      )
      const debtPayoutAmount = Number(formatUnits(plan.expectedDebtPayout, debtDecimals))
      if (!Number.isFinite(minCollateralAmount) || !Number.isFinite(debtPayoutAmount))
        return undefined
      const usd = minCollateralAmount * collateralUsdPrice + debtPayoutAmount * debtUsdPrice
      return Number.isFinite(usd) ? Math.max(usd, 0) : undefined
    } catch {
      return undefined
    }
  }, [query.data, collateralUsdPrice, debtUsdPrice, collateralDecimals, debtDecimals])

  return {
    plan: query.data,
    expectedUsdOut,
    guaranteedUsdOut,
    isLoading: query.isPending || query.isFetching,
    error: query.error,
  }
}
