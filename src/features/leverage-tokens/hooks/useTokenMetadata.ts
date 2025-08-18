import { useQuery } from '@tanstack/react-query'
import { readContracts } from '@wagmi/core'
import type { Address } from 'viem'
import { config } from '@/lib/config/wagmi.config'
import { leverageTokenAbi } from '@/lib/contracts/generated'
import type { TokenMetadata } from '../types'
import { STALE_TIME } from '../utils/constants'
import { ltKeys } from '../utils/queryKeys'

/**
 * Fetches token metadata using multicall for efficiency
 * Batches all reads into a single RPC call
 */
export function useTokenMetadata(token: Address) {
  return useQuery({
    queryKey: ltKeys.metadata(token),
    queryFn: async (): Promise<TokenMetadata> => {
      // Batch all metadata reads in a single multicall
      const results = await readContracts(config, {
        contracts: [
          {
            address: token,
            abi: leverageTokenAbi,
            functionName: 'name',
          },
          {
            address: token,
            abi: leverageTokenAbi,
            functionName: 'symbol',
          },
          {
            address: token,
            abi: leverageTokenAbi,
            functionName: 'decimals',
          },
          {
            address: token,
            abi: leverageTokenAbi,
            functionName: 'totalSupply',
          },
          // Add more contract reads here as needed
          // e.g., underlying token, leverage ratio from factory, etc.
        ],
      })

      const [nameResult, symbolResult, decimalsResult, _totalSupplyResult] = results

      // Handle potential errors from individual calls
      if (
        nameResult.status === 'failure' ||
        symbolResult.status === 'failure' ||
        decimalsResult.status === 'failure'
      ) {
        throw new Error('Failed to fetch token metadata')
      }

      return {
        name: nameResult.result || '',
        symbol: symbolResult.result || '',
        decimals: decimalsResult.result || 18,
        leverageRatio: 3, // TODO: Fetch from factory contract
        underlying: {
          // TODO: Fetch actual underlying token from contract
          address: '0x0000000000000000000000000000000000000000' as Address,
          symbol: 'WETH',
          decimals: 18,
        },
      }
    },
    staleTime: STALE_TIME.metadata,
  })
}
