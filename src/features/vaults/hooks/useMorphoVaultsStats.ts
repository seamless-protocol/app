import { type QueryClient, useQuery } from '@tanstack/react-query'
import { REFRESH_INTERVAL, STALE_TIME } from '@/features/vaults/utils/constants'
import { vaultKeys } from '@/features/vaults/utils/queryKeys'
import { getSeamlessVaultsTVL } from '@/lib/defillama/fetchSeamlessVaultsTVL'

export function useMorphoVaultsStats(opts?: { staleTimeMs?: number; refetchIntervalMs?: number }) {
  const staleTime = opts?.staleTimeMs ?? STALE_TIME.tvl
  const refetchInterval = opts?.refetchIntervalMs ?? REFRESH_INTERVAL.tvl

  const {
    data: stats,
    isLoading,
    isError,
  } = useQuery({
    queryKey: vaultKeys.stats(),
    enabled: true,
    staleTime,
    refetchInterval,
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 2000,
    queryFn: async () => {
      const tvlUsd = await getSeamlessVaultsTVL()
      return { tvlUsd }
    },
  })

  return { tvlUsd: stats?.tvlUsd, isLoading, isError }
}

export async function prefetchMorphoVaultsStats(queryClient: QueryClient) {
  await queryClient.prefetchQuery({
    queryKey: vaultKeys.stats(),
    queryFn: async () => {
      const tvlUsd = await getSeamlessVaultsTVL()
      return { tvlUsd }
    },
  })
}
