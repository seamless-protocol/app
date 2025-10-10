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

      // Calculate 7-day average APR (or max available if less than 7 days)
      // Get up to the last 7 data points (most recent days available)
      const maxDays = Math.min(7, data.length)
      const lastDays = data.slice(-maxDays)
      const validData = lastDays.filter((item) => item.apy != null && !Number.isNaN(item.apy))

      if (validData.length === 0) {
        const error = new Error('No valid APR data found')
        captureApiError({
          provider,
          method,
          url,
          durationMs: elapsed,
          error,
        })
        throw error
      }

      // Calculate average APR over available days
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
