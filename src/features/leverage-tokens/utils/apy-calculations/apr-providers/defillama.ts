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
 * Uses 7-day average for more stable APR values
 */
export class DefiLlamaAprProvider implements AprFetcher {
  protocolId = 'defillama'
  protocolName = 'DeFi Llama'

  constructor(private id: string) {}

  /**
   * Fetch APR data from DeFi Llama API
   * Calculates 7-day average for more stable values
   */
  async fetchApr(): Promise<BaseAprData> {
    const url = `https://yields.llama.fi/chart/${this.id}`
    const provider = 'defillama'
    const method = 'GET'
    const start = getNowMs()

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Seamless Protocol Frontend',
        },
      })

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

      // Calculate 7-day average APR by filtering to last 7 days from the most recent entry
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

      // Calculate 7 days ago from the most recent entry (excluding current day)
      const mostRecentDate = new Date(mostRecentEntry.timestamp)
      const sevenDaysAgo = new Date(mostRecentDate.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Filter data to only include entries from the last 7 days (excluding current day)
      const last7DaysData = data.filter((item) => {
        const itemDate = new Date(item.timestamp)
        return (
          itemDate >= sevenDaysAgo &&
          itemDate < mostRecentDate &&
          item.apy != null &&
          !Number.isNaN(item.apy)
        )
      })

      if (last7DaysData.length === 0) {
        const error = new Error('No valid APR data found in the last 7 days')
        captureApiError({
          provider,
          method,
          url,
          durationMs: elapsed,
          error,
        })
        throw error
      }

      const validData = last7DaysData

      // Calculate average APR over the last 7 days
      // This gives us a more stable APR value by smoothing out daily fluctuations
      const averageAPR = validData.reduce((sum, item) => sum + item.apy, 0) / validData.length

      return {
        stakingAPR: averageAPR,
        restakingAPR: 0, // DeFi Llama doesn't provide restaking APR
        totalAPR: averageAPR,
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
