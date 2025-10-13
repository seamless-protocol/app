import { captureApiError } from '@/lib/observability/sentry'
import { elapsedMsSince, getNowMs } from '@/lib/utils/time'
import type { AprFetcher, BaseAprData } from './types'

/**
 * Lido API response interface
 */
interface LidoApiResponse {
  data: {
    aprs: Array<{
      timeUnix: number
      apr: number
    }>
    smaApr: number
  }
  meta: {
    symbol: string
    address: string
    chainId: number
  }
}

/**
 * Lido APR provider implementation
 * Fetches APR data from Lido API for stETH
 */
export class LidoAprProvider implements AprFetcher {
  protocolId = 'lido'
  protocolName = 'Lido'

  /**
   * Fetch APR data from Lido API
   */
  async fetchApr(): Promise<BaseAprData> {
    const url = `https://eth-api.lido.fi/v1/protocol/steth/apr/sma`
    const provider = 'lido'
    const method = 'GET'
    const start = getNowMs()

    try {
      const response = await fetch(url)

      if (!response.ok) {
        const durationMs = elapsedMsSince(start)
        const error = new Error(
          `Failed to fetch Lido data (status ${response.status}): ${response.statusText}`,
        )
        let responseSnippet: string | undefined
        try {
          const text = await response.text()
          responseSnippet = text.slice(0, 500)
        } catch {}
        captureApiError({
          provider,
          method,
          url,
          status: response.status,
          durationMs,
          feature: 'apr',
          ...(responseSnippet ? { responseSnippet } : {}),
          error,
        })
        throw error
      }

      const data: LidoApiResponse = await response.json()

      // Calculate 7-day average from the last 7 entries (excluding most recent)
      const aprs = data.data.aprs
      if (aprs.length < 7) {
        const error = new Error('Insufficient APR data for 7-day average calculation')
        captureApiError({
          provider,
          method,
          url,
          durationMs: elapsedMsSince(start),
          error,
        })
        throw error
      }

      // Take the last 7 entries (excluding the most recent one)
      const last7Days = aprs.slice(-8, -1) // Get entries 2-8 from the end (7 entries)
      const averageAPR = last7Days.reduce((sum, item) => sum + item.apr, 0) / last7Days.length

      const result: BaseAprData = {
        stakingAPR: averageAPR,
        restakingAPR: 0, // Lido doesn't have restaking rewards
        totalAPR: averageAPR,
      }

      return result
    } catch (error) {
      const durationMs = elapsedMsSince(start)
      captureApiError({
        provider,
        method,
        url,
        status: 0,
        durationMs,
        feature: 'apr',
        error,
      })
      throw new Error(
        `Failed to fetch Lido APR data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }
}
