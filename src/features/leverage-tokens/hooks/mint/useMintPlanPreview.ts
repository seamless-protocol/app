import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Address } from 'viem'
import type { Config } from 'wagmi'
import type { MintPlan } from '@/domain/mint/planner/plan'
import { planMint } from '@/domain/mint/planner/plan'
import type { QuoteFn } from '@/domain/mint/planner/types'
import { parseUsdPrice, toScaledUsd, usdDiffFloor, usdToFixedString } from '@/domain/shared/prices'
import { ltKeys } from '@/features/leverage-tokens/utils/queryKeys'
import type { SupportedChainId } from '@/lib/contracts/addresses'
import { useLeverageTokenManagerAssets } from '../useLeverageTokenManagerAssets'

interface UseMintPlanPreviewParams {
  config: Config
  token: Address
  inputAsset: Address
  equityInCollateralAsset: bigint | undefined
  slippageBps: number
  chainId: number
  enabled: boolean
  quote?: QuoteFn
  debounceMs?: number
  epsilonBps?: number
  // For derived USD estimates (optional; omit to skip)
  collateralUsdPrice?: number | undefined
  debtUsdPrice?: number | undefined
  collateralDecimals?: number | undefined
  debtDecimals?: number | undefined
}

export function useMintPlanPreview({
  config,
  token,
  inputAsset,
  equityInCollateralAsset,
  slippageBps,
  chainId,
  quote,
  debounceMs = 500,
  enabled = true,
  epsilonBps,
  collateralUsdPrice,
  debtUsdPrice,
  collateralDecimals,
  debtDecimals,
}: UseMintPlanPreviewParams) {
  const debounced = useDebouncedBigint(equityInCollateralAsset, debounceMs)

  const {
    collateralAsset,
    debtAsset,
    isLoading: assetsLoading,
  } = useLeverageTokenManagerAssets({
    token,
    chainId: chainId as SupportedChainId,
    enabled,
  })

  const enabledQuery =
    enabled &&
    typeof debounced === 'bigint' &&
    debounced > 0n &&
    typeof quote === 'function' &&
    !!collateralAsset &&
    !!debtAsset

  const keyParams = {
    chainId,
    addr: token,
    amount: debounced ?? 0n,
    slippageBps,
    ...(typeof epsilonBps === 'number' ? { epsilonBps } : {}),
  }

  const query = useQuery<MintPlan, Error>({
    queryKey: [
      ...ltKeys.simulation.mintKey(keyParams),
      `slippage:${slippageBps}`,
      ...(typeof epsilonBps === 'number' ? [`epsilon:${epsilonBps}`] : []),
    ],
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

      return planMint({
        config,
        token,
        inputAsset,
        equityInInputAsset: debounced as bigint,
        slippageBps,
        quoteDebtToCollateral: quote as QuoteFn,
        chainId: chainId as SupportedChainId,
        collateralAsset,
        debtAsset,
        ...(typeof epsilonBps === 'number' ? { epsilonBps } : {}),
      })
    },
  })

  // Derived USD estimates from the plan (nice-weather and worst-case)
  const expectedUsdOutScaled = useMemo(() => {
    const plan = query.data
    if (!plan) return undefined
    if (typeof collateralUsdPrice !== 'number' || typeof debtUsdPrice !== 'number') return undefined
    if (typeof collateralDecimals !== 'number' || typeof debtDecimals !== 'number') return undefined
    try {
      const priceColl = parseUsdPrice(collateralUsdPrice)
      const priceDebt = parseUsdPrice(debtUsdPrice)
      const usdFromCollateral = toScaledUsd(
        plan.expectedTotalCollateral,
        collateralDecimals,
        priceColl,
      )
      const usdFromDebt = toScaledUsd(plan.expectedDebt, debtDecimals, priceDebt)
      return usdDiffFloor(usdFromCollateral, usdFromDebt)
    } catch {
      return undefined
    }
  }, [query.data, collateralUsdPrice, debtUsdPrice, collateralDecimals, debtDecimals])

  const guaranteedUsdOutScaled = useMemo(() => {
    const plan = query.data
    if (!plan) return undefined
    if (typeof collateralUsdPrice !== 'number' || typeof debtUsdPrice !== 'number') return undefined
    if (typeof collateralDecimals !== 'number' || typeof debtDecimals !== 'number') return undefined
    try {
      const priceColl = parseUsdPrice(collateralUsdPrice)
      const priceDebt = parseUsdPrice(debtUsdPrice)
      const worstCollRaw = (plan.equityInInputAsset ?? 0n) + (plan.swapMinOut ?? 0n)
      const worstDebtRaw = plan.worstCaseRequiredDebt ?? 0n
      const usdFromCollateral = toScaledUsd(worstCollRaw, collateralDecimals, priceColl)
      const usdFromDebt = toScaledUsd(worstDebtRaw, debtDecimals, priceDebt)
      return usdDiffFloor(usdFromCollateral, usdFromDebt)
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
    // Only show loading when the query is actually fetching and inputs are valid
    isLoading: enabled && (assetsLoading || query.isFetching),
    error: query.error,
    refetch: query.refetch,
  }
}

function useDebouncedBigint(value: bigint | undefined, delay: number) {
  const [debounced, setDebounced] = useState<bigint | undefined>(value)
  const id = useRef(0)
  useEffect(() => {
    const current = ++id.current
    const t = setTimeout(() => {
      if (current === id.current) setDebounced(value)
    }, delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
