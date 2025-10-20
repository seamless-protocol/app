import { type QueryClient, useQuery } from '@tanstack/react-query'
import { REFRESH_INTERVAL, STALE_TIME } from '@/features/vaults/utils/constants'
import { vaultKeys } from '@/features/vaults/utils/queryKeys'
import { getSeamlessVaultsMaxAPYFromMorpho } from '@/lib/morpho/fetchSeamlessVaultsAPY'

/**
 * Fetch max net APY across Seamless‑curated Morpho vaults via Morpho GraphQL.
 */
export function useMorphoVaultsMaxAPY(opts?: { staleTimeMs?: number; refetchIntervalMs?: number }) {
  const staleTime = opts?.staleTimeMs ?? STALE_TIME.apy
  const refetchInterval = opts?.refetchIntervalMs ?? REFRESH_INTERVAL.apy

  const { data, isLoading, isError } = useQuery({
    queryKey: vaultKeys.apy(),
    staleTime,
    refetchInterval,
    queryFn: async () => {
      const maxNetApy = await getSeamlessVaultsMaxAPYFromMorpho()
      return { maxNetApy }
    },
  })

  return { maxNetApy: data?.maxNetApy, isLoading, isError }
}

export async function prefetchMorphoVaultsMaxAPY(queryClient: QueryClient) {
  await queryClient.prefetchQuery({
    queryKey: vaultKeys.apy(),
    queryFn: async () => {
      const maxNetApy = await getSeamlessVaultsMaxAPYFromMorpho()
      return { maxNetApy }
    },
  })
}
