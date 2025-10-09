import { useQuery } from '@tanstack/react-query'
import { createLogger } from '@/lib/logger'

const logger = createLogger('defillama-protocol-tvl')

export interface DeFiLlamaProtocolData {
  name: string
  tvl: number
  tokenSymbol?: string
  cmcId?: string
  chains: Array<string>
  change_1h?: number
  change_1d?: number
  change_7d?: number
  mcap?: number
  fdv?: number
}

/**
 * Hook to fetch protocol TVL data from DeFiLlama
 * Uses 1-hour cache as suggested by the user
 */
export function useDeFiLlamaProtocolTVL() {
  return useQuery<DeFiLlamaProtocolData | null>({
    queryKey: ['defillama', 'protocol', 'tvl'],
    queryFn: async () => {
      const url = 'https://api.llama.fi/protocol/seamless-protocol'

      try {
        logger.info('Fetching protocol TVL from DeFiLlama', { url })

        const response = await fetch(url)

        if (!response.ok) {
          if (response.status === 404) {
            logger.warn('Protocol not found on DeFiLlama', { status: response.status })
            return null
          }

          throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        // Get the most recent TVL value from the historical data array
        const tvlArray = data.tvl
        const currentTvl =
          Array.isArray(tvlArray) && tvlArray.length > 0
            ? tvlArray[tvlArray.length - 1].totalLiquidityUSD
            : 0

        return {
          name: data.name,
          tvl: currentTvl,
          tokenSymbol: data.tokenSymbol,
          cmcId: data.cmcId,
          chains: data.chains || [],
          change_1h: data.change_1h,
          change_1d: data.change_1d,
          change_7d: data.change_7d,
          mcap: data.mcap,
          fdv: data.fdv,
        }
      } catch (error) {
        logger.error('Failed to fetch protocol TVL from DeFiLlama', {
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        throw error
      }
    },
    staleTime: 60 * 60 * 1000, // 1 hour cache
    gcTime: 2 * 60 * 60 * 1000, // 2 hours garbage collection
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}
