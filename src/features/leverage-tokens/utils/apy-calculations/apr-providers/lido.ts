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
      const smaApr = data.data.smaApr

      const result: BaseAprData = {
        stakingAPR: smaApr,
        restakingAPR: 0, // Lido doesn't have restaking rewards
        totalAPR: smaApr,
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
