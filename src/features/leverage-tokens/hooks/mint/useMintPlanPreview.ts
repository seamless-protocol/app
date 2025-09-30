import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import type { Address } from 'viem'
import type { Config } from 'wagmi'
import { planMintV2 } from '@/domain/mint/planner/plan.v2'
import type { ManagerPort } from '@/domain/mint/ports'
import type { QuoteFn } from '@/domain/mint/planner/types'
import { ltKeys } from '@/features/leverage-tokens/utils/queryKeys'

interface UseMintPlanPreviewParams {
  config: Config
  token: Address
  inputAsset: Address
  equityInCollateralAsset: bigint | undefined
  slippageBps: number
  chainId: number
  quote?: QuoteFn
  managerAddress?: Address
  debounceMs?: number
  managerPort?: ManagerPort
}

export function useMintPlanPreview({
  config,
  token,
  inputAsset,
  equityInCollateralAsset,
  slippageBps,
  chainId,
  quote,
  managerAddress,
  debounceMs = 350,
  managerPort,
}: UseMintPlanPreviewParams) {
  const debounced = useDebouncedBigint(equityInCollateralAsset, debounceMs)
  const enabled = typeof debounced === 'bigint' && debounced > 0n && typeof quote === 'function'

  const keyParams = {
    chainId,
    addr: token,
    amount: debounced ?? 0n,
    slippageBps,
    ...(managerAddress ? { managerAddress } : {}),
  }

  const query = useQuery({
    queryKey: ltKeys.simulation.mintKey(keyParams),
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: 1,
    queryFn: async () => {
      if (!enabled || !quote || typeof debounced !== 'bigint') {
        throw new Error('Mint plan prerequisites missing')
      }

      return planMintV2({
        config,
        token,
        inputAsset,
        equityInInputAsset: debounced,
        slippageBps,
        quoteDebtToCollateral: quote,
        chainId,
        ...(managerAddress ? { managerAddress } : {}),
        ...(managerPort ? { managerPort } : {}),
      })
    },
  })

  return {
    plan: query.data,
    // Only show loading when the query is actually fetching and inputs are valid
    isLoading: enabled && query.isFetching,
    error: query.error,
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
