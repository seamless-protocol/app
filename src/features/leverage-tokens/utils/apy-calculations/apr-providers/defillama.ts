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

      const mostRecentDate = new Date(mostRecentEntry.timestamp)
      const now = new Date()
      const hoursSinceMostRecent = (now.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60)

      if (Number.isNaN(hoursSinceMostRecent) || hoursSinceMostRecent > 28) {
        const error = new Error('Most recent APR data is older than 28 hours')
        captureApiError({
          provider,
          method,
          url,
          durationMs: elapsed,
          error,
        })
        throw error
      }

      if (mostRecentEntry.apy == null || Number.isNaN(mostRecentEntry.apy)) {
        const error = new Error('Most recent APR data point is invalid')
        captureApiError({
          provider,
          method,
          url,
          durationMs: elapsed,
          error,
        })
        throw error
      }

      const latestApr = mostRecentEntry.apy

      return {
        stakingAPR: latestApr,
        restakingAPR: 0, // DeFi Llama doesn't provide restaking APR
        totalAPR: latestApr,
        averagingPeriod: `as of ${mostRecentDate.toLocaleString(undefined, { timeZoneName: 'short' })}`,
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
