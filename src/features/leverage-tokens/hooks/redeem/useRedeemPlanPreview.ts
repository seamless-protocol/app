import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import type { Address } from 'viem'
import type { Config } from 'wagmi'
import { getQuoteIntentForAdapter } from '@/domain/redeem/orchestrate'
import { planRedeem } from '@/domain/redeem/planner/plan'
import type { QuoteFn } from '@/domain/redeem/planner/types'
import { parseUsdPrice, toScaledUsd, usdAdd, usdToFixedString } from '@/domain/shared/prices'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { ltKeys } from '@/features/leverage-tokens/utils/queryKeys'

interface UseRedeemPlanPreviewParams {
  config: Config
  token: Address
  sharesToRedeem: bigint | undefined
  slippageBps: number
  chainId: number
  enabled: boolean
  collateralAsset: Address | undefined
  debtAsset: Address | undefined
  collateralDecimals: number | undefined
  debtDecimals: number | undefined
  quote?: QuoteFn
  managerAddress?: Address
  swapKey?: string
  outputAsset?: Address
  // For derived USD estimates (optional; omit to skip)
  collateralUsdPrice?: number | undefined
  debtUsdPrice?: number | undefined
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
  collateralAsset,
  debtAsset,
  collateralUsdPrice,
  debtUsdPrice,
  collateralDecimals,
  debtDecimals,
}: UseRedeemPlanPreviewParams) {
  const enabledQuery =
    enabled &&
    typeof sharesToRedeem === 'bigint' &&
    sharesToRedeem > 0n &&
    typeof quote === 'function' &&
    !!collateralAsset &&
    !!debtAsset &&
    typeof collateralDecimals === 'number' &&
    typeof debtDecimals === 'number'

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
    // Periodically refresh quotes while user is editing
    refetchInterval: enabled ? 30_000 : false,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
    retry: 1,
    queryFn: async () => {
      // Inputs guaranteed by `enabledQuery`
      if (!collateralAsset || !debtAsset) {
        throw new Error('Leverage token assets not loaded')
      }
      if (typeof collateralDecimals !== 'number' || typeof debtDecimals !== 'number') {
        throw new Error('Leverage token decimals not provided')
      }

      const intent = getQuoteIntentForAdapter(
        getLeverageTokenConfig(token, chainId)?.swaps?.collateralToDebt?.type ?? 'velora',
      )

      return planRedeem({
        config,
        token,
        sharesToRedeem: sharesToRedeem as bigint,
        slippageBps,
        quoteCollateralToDebt: quote as QuoteFn,
        chainId,
        collateralAsset,
        debtAsset,
        collateralAssetDecimals: collateralDecimals,
        debtAssetDecimals: debtDecimals,
        ...(managerAddress ? { managerAddress } : {}),
        ...(outputAsset ? { outputAsset } : {}),
        intent,
      })
    },
  })

  // Derived USD estimate from the plan (expected outcome)
  // Total value = expectedCollateral + expectedDebtPayout (mirrors planner logic)
  const expectedUsdOutScaled = useMemo(() => {
    const plan = query.data
    if (!plan) return undefined
    if (typeof collateralUsdPrice !== 'number' || typeof debtUsdPrice !== 'number') return undefined
    if (typeof collateralDecimals !== 'number' || typeof debtDecimals !== 'number') return undefined
    try {
      const priceColl = parseUsdPrice(collateralUsdPrice)
      const priceDebt = parseUsdPrice(debtUsdPrice)
      const usdFromCollateral = toScaledUsd(plan.expectedCollateral, collateralDecimals, priceColl)
      const usdFromDebt = toScaledUsd(plan.expectedDebtPayout, debtDecimals, priceDebt)
      return usdAdd(usdFromCollateral, usdFromDebt)
    } catch {
      return undefined
    }
  }, [query.data, collateralUsdPrice, debtUsdPrice, collateralDecimals, debtDecimals])

  // Derived USD estimate (worst-case guarantee based on minCollateralForSender)
  // Worst case = minCollateral + expectedDebtPayout (debt payout is relatively stable)
  const guaranteedUsdOutScaled = useMemo(() => {
    const plan = query.data
    if (!plan) return undefined
    if (typeof collateralUsdPrice !== 'number' || typeof debtUsdPrice !== 'number') return undefined
    if (typeof collateralDecimals !== 'number' || typeof debtDecimals !== 'number') return undefined
    try {
      const priceColl = parseUsdPrice(collateralUsdPrice)
      const priceDebt = parseUsdPrice(debtUsdPrice)
      const usdFromCollateral = toScaledUsd(
        plan.minCollateralForSender,
        collateralDecimals,
        priceColl,
      )
      const usdFromDebt = toScaledUsd(plan.expectedDebtPayout, debtDecimals, priceDebt)
      return usdAdd(usdFromCollateral, usdFromDebt)
    } catch {
      return undefined
    }
  }, [query.data, collateralUsdPrice, debtUsdPrice, collateralDecimals, debtDecimals])

  return {
    plan: query.data,
    expectedUsdOutScaled,
    guaranteedUsdOutScaled,
    expectedUsdOutStr:
      typeof expectedUsdOutScaled === 'bigint'
        ? usdToFixedString(expectedUsdOutScaled, 2)
        : undefined,
    guaranteedUsdOutStr:
      typeof guaranteedUsdOutScaled === 'bigint'
        ? usdToFixedString(guaranteedUsdOutScaled, 2)
        : undefined,
    isLoading: query.isPending || query.isFetching,
    error: query.error,
  }
}
