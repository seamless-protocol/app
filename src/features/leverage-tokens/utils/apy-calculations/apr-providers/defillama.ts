import { captureApiError } from '@/lib/observability/sentry'
import { elapsedMsSince, getNowMs } from '@/lib/utils/time'
import type { AprFetcher, BaseAprData } from './types'

// DeFi Llama API response structure
interface DefiLlamaApiResponse {
  timestamp: string
  tvlUsd: number
  apy: number
  apyBase: number
  apyReward: number | null
  il7d: number | null
  apyBase7d: number | null
}

/**
 * DeFi Llama APR provider implementation
 * Fetches APR data from DeFi Llama API for various protocols
 * Uses 24-hour average for more current APR values
 */
export class DefiLlamaAprProvider implements AprFetcher {
  protocolId = 'defillama'
  protocolName = 'DeFi Llama'

  constructor(private id: string) {}

  /**
   * Fetch APR data from DeFi Llama API
   * Calculates 24-hour average for current values
   */
  async fetchApr(): Promise<BaseAprData> {
    const url = `https://yields.llama.fi/chart/${this.id}`
    const provider = 'defillama'
    const method = 'GET'
    const start = getNowMs()

    try {
      // Use a "simple request" with no custom headers to avoid CORS preflight,
      const response = await fetch(url, { method })

      const elapsed = elapsedMsSince(start)

      if (!response.ok) {
        const error = new Error(`DeFi Llama API error: ${response.status} ${response.statusText}`)
        captureApiError({
          provider,
          method,
          url,
          status: response.status,
          durationMs: elapsed,
          error,
        })
        throw error
      }

      const responseData: { status: string; data: Array<DefiLlamaApiResponse> } =
        await response.json()

      if (
        responseData.status !== 'success' ||
        !Array.isArray(responseData.data) ||
        responseData.data.length === 0
      ) {
        const error = new Error('DeFi Llama API returned empty or invalid data')
        captureApiError({
          provider,
          method,
          url,
          durationMs: elapsed,
          error,
        })
        throw error
      }

      const data = responseData.data

      // Calculate 24-hour average APR by filtering to last 24 hours from the most recent entry
      // Get the most recent entry to determine the cutoff date
      const mostRecentEntry = data[data.length - 1]
      if (!mostRecentEntry) {
        const error = new Error('No data entries found')
        captureApiError({
          provider,
          method,
          url,
          durationMs: elapsed,
          error,
        })
        throw error
      }

      // Calculate 24 hours ago from the most recent entry (excluding current moment)
      const mostRecentDate = new Date(mostRecentEntry.timestamp)
      const oneDayAgo = new Date(mostRecentDate.getTime() - 24 * 60 * 60 * 1000)

      // Filter data to only include entries from the last 24 hours (excluding current moment)
      const last24HoursData = data.filter((item) => {
        const itemDate = new Date(item.timestamp)
        return (
          itemDate >= oneDayAgo &&
          itemDate < mostRecentDate &&
          item.apy != null &&
          !Number.isNaN(item.apy)
        )
      })

      if (last24HoursData.length === 0) {
        const error = new Error('No valid APR data found in the last 24 hours')
        captureApiError({
          provider,
          method,
          url,
          durationMs: elapsed,
          error,
        })
        throw error
      }

      const validData = last24HoursData

      // Calculate average APR over the last 24 hours
      // This gives us a current APR value based on the most recent day of data
      const averageAPR = validData.reduce((sum, item) => sum + item.apy, 0) / validData.length

      return {
        stakingAPR: averageAPR,
        restakingAPR: 0, // DeFi Llama doesn't provide restaking APR
        totalAPR: averageAPR,
        averagingPeriod: '24-hour average',
      }
    } catch (error) {
      const elapsed = elapsedMsSince(start)

      if (error instanceof Error) {
        captureApiError({
          provider,
          method,
          url,
          durationMs: elapsed,
          error,
        })
        throw error
      }

      const unknownError = new Error('Unknown error fetching DeFi Llama APR data')
      captureApiError({
        provider,
        method,
        url,
        durationMs: elapsed,
        error: unknownError,
      })
      throw unknownError
    }
  }
}
