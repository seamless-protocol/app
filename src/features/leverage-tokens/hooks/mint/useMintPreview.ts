import { useQuery } from '@tanstack/react-query'
import { getPublicClient } from '@wagmi/core'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Address } from 'viem'
import type { Config } from 'wagmi'
import { readLeverageManagerPreviewMint } from '@/lib/contracts/generated'
import { ltKeys } from '../../utils/queryKeys'

type Preview = Awaited<ReturnType<typeof readLeverageManagerPreviewMint>>

export function useMintPreview(params: {
  config: Config
  token: Address
  equityInCollateralAsset: bigint | undefined
  debounceMs?: number
}) {
  const { config, token, equityInCollateralAsset, debounceMs = 350 } = params

  // Local debounce of the raw bigint input so the query only runs after idle
  const debounced = useDebouncedBigint(equityInCollateralAsset, debounceMs)
  const enabled = useMemo(() => typeof debounced === 'bigint' && debounced > 0n, [debounced])

  // Derive active chain id from wagmi config for multi-chain cache isolation
  const chainId = getPublicClient(config)?.chain?.id

  const amountForKey = enabled && typeof debounced === 'bigint' ? (debounced as bigint) : 0n
  const queryKey = ltKeys.simulation.mintKey({ chainId, addr: token, amount: amountForKey })

  const query = useQuery<Preview, Error>({
    queryKey,
    // Only executes when enabled=true
    queryFn: () =>
      readLeverageManagerPreviewMint(config, {
        args: [token, debounced ?? 0n],
      }),
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
    // Keep behavior deterministic for keystroke-driven UX
    staleTime: 0,
  })

  // Map React Query statuses to the previous API surface
  const isLoading = enabled ? query.isPending || query.isFetching : false
  const data = query.data
  const error = query.error

  return { data, isLoading, error }
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
