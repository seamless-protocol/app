import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import { fetchLeverageTokenCaps } from '@/lib/graphql/fetchers/leverage-tokens'
import { STALE_TIME } from '../utils/constants'
import { ltKeys } from '../utils/queryKeys'

export interface UseLeverageTokenCapsParams {
  chainId: number
  addresses: Array<Address>
  enabled?: boolean
}

/**
 * Fetch supply caps for a set of leverage tokens from the subgraph.
 * Returns a map of lowercased token address → cap as bigint.
 */
export function useLeverageTokenCaps({
  chainId,
  addresses,
  enabled = true,
}: UseLeverageTokenCapsParams) {
  return useQuery({
    queryKey: [...ltKeys.tokens(), 'caps', chainId, addresses.map((a) => a.toLowerCase()).sort()],
    queryFn: async () => {
      const raw = await fetchLeverageTokenCaps(chainId, addresses)
      const out: Record<string, bigint> = {}
      for (const [addrLower, capStr] of Object.entries(raw)) {
        try {
          out[addrLower] = BigInt(capStr)
        } catch {
          // Ignore malformed cap values
        }
      }
      return out
    },
    staleTime: STALE_TIME.historical, // caps change rarely; reuse long-ish TTL
    enabled: enabled && addresses.length > 0,
  })
}
