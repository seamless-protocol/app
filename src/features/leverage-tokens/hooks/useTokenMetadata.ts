import { useQuery } from '@tanstack/react-query'
import { 
  useReadLeverageTokenName,
  useReadLeverageTokenSymbol,
  useReadLeverageTokenDecimals,
  useReadLeverageTokenTotalSupply 
} from '@/lib/contracts/generated'
import { ltKeys } from '../utils/queryKeys'
import { STALE_TIME } from '../utils/constants'
import type { Address } from 'viem'
import type { TokenMetadata } from '../types'

/**
 * Example hook using Wagmi CLI generated hooks
 * Fetches token metadata using the generated read hooks
 */
export function useTokenMetadata(token: Address) {
  // Use generated hooks for individual reads
  const { data: name } = useReadLeverageTokenName({
    address: token,
    query: {
      staleTime: STALE_TIME.metadata,
    }
  })
  
  const { data: symbol } = useReadLeverageTokenSymbol({
    address: token,
    query: {
      staleTime: STALE_TIME.metadata,
    }
  })
  
  const { data: decimals } = useReadLeverageTokenDecimals({
    address: token,
    query: {
      staleTime: STALE_TIME.metadata,
    }
  })
  
  const { data: totalSupply } = useReadLeverageTokenTotalSupply({
    address: token,
    query: {
      staleTime: STALE_TIME.supply,
    }
  })
  
  // Combine into a single metadata object
  return useQuery({
    queryKey: ltKeys.metadata(token),
    queryFn: async (): Promise<TokenMetadata> => {
      // This would normally fetch additional data like leverage ratio
      // from the factory or a different source
      return {
        name: name || '',
        symbol: symbol || '',
        decimals: decimals || 18,
        leverageRatio: 3, // This would come from factory
        underlying: {
          address: '0x0000000000000000000000000000000000000000' as Address,
          symbol: 'WETH',
          decimals: 18,
        }
      }
    },
    enabled: !!name && !!symbol && decimals !== undefined,
    staleTime: STALE_TIME.metadata,
  })
}