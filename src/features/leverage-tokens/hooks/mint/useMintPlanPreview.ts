import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import type { Address, PublicClient } from 'viem'
import { type Config, usePublicClient } from 'wagmi'
import type { MintPlan } from '@/domain/mint/planner/plan'
import { planMint } from '@/domain/mint/planner/plan'
import type { QuoteFn } from '@/domain/mint/planner/types'
import { getLeverageTokenConfig } from '@/features/leverage-tokens/leverageTokens.config'
import { ltKeys } from '@/features/leverage-tokens/utils/queryKeys'

interface UseMintPlanPreviewParams {
  config: Config
  token: Address
  equityInCollateralAsset: bigint | undefined
  slippageBps: number
  swapSlippageBps: number
  chainId: number
  enabled: boolean
  quote?: QuoteFn
  debounceMs?: number
}

export function useMintPlanPreview({
  token,
  equityInCollateralAsset,
  slippageBps,
  swapSlippageBps,
  chainId,
  enabled = true,
  quote,
  debounceMs = 500,
}: UseMintPlanPreviewParams) {
  const publicClient = usePublicClient({ chainId }) as PublicClient
  const debounced = useDebouncedBigint(equityInCollateralAsset, debounceMs)

  const enabledQuery =
    enabled && typeof debounced === 'bigint' && debounced > 0n && typeof quote === 'function'

  const keyParams = {
    chainId,
    addr: token,
    amount: debounced ?? 0n,
    slippageBps,
    swapSlippageBps,
  }

  const query = useQuery<MintPlan, Error>({
    queryKey: [
      ...ltKeys.simulation.mintKey(keyParams),
      `slippage:${slippageBps}`,
      `swapSlippage:${swapSlippageBps}`,
    ],
    enabled: enabledQuery,
    // Periodically refresh quotes while user is editing
    refetchInterval: enabled ? 30_000 : false,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
    retry: 1,
    queryFn: async () => {
      const leverageTokenConfig = getLeverageTokenConfig(token, chainId)
      if (!leverageTokenConfig) throw new Error('Leverage token config not found')

      return planMint({
        publicClient: publicClient,
        leverageTokenConfig,
        equityInCollateralAsset: debounced as bigint,
        slippageBps,
        swapSlippageBps,
        quoteDebtToCollateral: quote as QuoteFn,
      })
    },
  })

  return {
    plan: query.data,
    // Only show loading when the query is actually fetching and inputs are valid
    isLoading: enabled && query.isFetching,
    error: query.error,
    refetch: query.refetch,
    quoteSourceName: query.data?.quoteSourceName,
    quoteSourceId: query.data?.quoteSourceId,
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
