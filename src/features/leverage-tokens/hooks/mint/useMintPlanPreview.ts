import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Address } from 'viem'
import { formatUnits } from 'viem'
import type { Config } from 'wagmi'
import type { MintPlanV2 } from '@/domain/mint/planner/plan.v2'
import { planMintV2 } from '@/domain/mint/planner/plan.v2'
import type { QuoteFn } from '@/domain/mint/planner/types'
import { ltKeys } from '@/features/leverage-tokens/utils/queryKeys'
import type { SupportedChainId } from '@/lib/contracts/addresses'

interface UseMintPlanPreviewParams {
  config: Config
  token: Address
  inputAsset: Address
  equityInCollateralAsset: bigint | undefined
  slippageBps: number
  chainId: number
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
  epsilonBps,
  collateralUsdPrice,
  debtUsdPrice,
  collateralDecimals,
  debtDecimals,
}: UseMintPlanPreviewParams) {
  const debounced = useDebouncedBigint(equityInCollateralAsset, debounceMs)
  const enabled = typeof debounced === 'bigint' && debounced > 0n && typeof quote === 'function'

  const keyParams = {
    chainId,
    addr: token,
    amount: debounced ?? 0n,
    slippageBps,
    ...(typeof epsilonBps === 'number' ? { epsilonBps } : {}),
  }

  const query = useQuery<MintPlanV2, Error>({
    queryKey: [
      ...ltKeys.simulation.mintKey(keyParams),
      `slippage:${slippageBps}`,
      ...(typeof epsilonBps === 'number' ? [`epsilon:${epsilonBps}`] : []),
    ],
    enabled,
    // Periodically refresh quotes while user is editing
    refetchInterval: enabled ? 30_000 : false,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
    retry: 1,
    queryFn: async () => {
      // Inputs guaranteed by `enabled`
      return planMintV2({
        config,
        token,
        inputAsset,
        equityInInputAsset: debounced as bigint,
        slippageBps,
        quoteDebtToCollateral: quote as QuoteFn,
        chainId: chainId as SupportedChainId,
        ...(typeof epsilonBps === 'number' ? { epsilonBps } : {}),
      })
    },
  })

  // Derived USD estimates from the plan (nice-weather and worst-case)
  const expectedUsdOut = useMemo(() => {
    const plan = query.data
    if (!plan) return undefined
    if (typeof collateralUsdPrice !== 'number' || typeof debtUsdPrice !== 'number') return undefined
    if (typeof collateralDecimals !== 'number' || typeof debtDecimals !== 'number') return undefined
    try {
      const totalCollateral = Number(formatUnits(plan.expectedTotalCollateral, collateralDecimals))
      const totalDebt = Number(formatUnits(plan.expectedDebt, debtDecimals))
      if (!Number.isFinite(totalCollateral) || !Number.isFinite(totalDebt)) return undefined
      const usd = totalCollateral * collateralUsdPrice - totalDebt * debtUsdPrice
      return Number.isFinite(usd) ? Math.max(usd, 0) : undefined
    } catch {
      return undefined
    }
  }, [query.data, collateralUsdPrice, debtUsdPrice, collateralDecimals, debtDecimals])

  const guaranteedUsdOut = useMemo(() => {
    const plan = query.data
    if (!plan) return undefined
    if (typeof collateralUsdPrice !== 'number' || typeof debtUsdPrice !== 'number') return undefined
    if (typeof collateralDecimals !== 'number' || typeof debtDecimals !== 'number') return undefined
    try {
      const worstCollateral = Number(
        formatUnits((plan.equityInInputAsset ?? 0n) + (plan.swapMinOut ?? 0n), collateralDecimals),
      )
      const worstDebt = Number(formatUnits(plan.worstCaseRequiredDebt ?? 0n, debtDecimals))
      if (!Number.isFinite(worstCollateral) || !Number.isFinite(worstDebt)) return undefined
      const usd = worstCollateral * collateralUsdPrice - worstDebt * debtUsdPrice
      return Number.isFinite(usd) ? Math.max(usd, 0) : undefined
    } catch {
      return undefined
    }
  }, [query.data, collateralUsdPrice, debtUsdPrice, collateralDecimals, debtDecimals])

  return {
    plan: query.data,
    expectedUsdOut,
    guaranteedUsdOut,
    // Only show loading when the query is actually fetching and inputs are valid
    isLoading: enabled && query.isFetching,
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
