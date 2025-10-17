import { captureApiError } from '@/lib/observability/sentry'
import { elapsedMsSince, getNowMs } from '@/lib/utils/time'
import type { AprFetcher, BaseAprData } from './types'

/**
 * EtherFi-specific APR data interface
 */
export interface EtherFiAprData extends BaseAprData {
  sevenDayApr: number
  sevenDayRestakingApr: number
  bufferEth: number
  metadata: {
    raw: Record<string, unknown>
    useRestakingApr?: boolean
  }
}

/**
 * EtherFi APR provider implementation
 * Handles fetching APR data from EtherFi protocol
 */
export class EtherFiAprProvider implements AprFetcher {
  protocolId = 'etherfi'
  protocolName = 'Ether.fi'

  async fetchApr(): Promise<BaseAprData> {
    const url = 'https://misc-cache.seamlessprotocol.com/etherfi-protocol-detail'
    const provider = 'etherfi'
    const method = 'GET'
    const start = getNowMs()
    try {
      const response = await fetch(url)

      if (!response.ok) {
        const durationMs = elapsedMsSince(start)
        const error = new Error(
          `Failed to fetch EtherFi data (status ${response.status}): ${response.statusText}`,
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

      const raw = await response.json()

      const sevenDayApr = raw['7_day_apr']
      const sevenDayRestakingApr = raw['7_day_restaking_apr']
      const { buffer_eth: bufferEth } = raw

      const totalAPR = sevenDayApr + sevenDayRestakingApr

      const result: EtherFiAprData = {
        sevenDayApr,
        sevenDayRestakingApr,
        bufferEth,
        totalAPR,
        stakingAPR: sevenDayApr,
        restakingAPR: sevenDayRestakingApr,
        averagingPeriod: '7-day average',
        metadata: {
          raw,
          useRestakingApr: true,
        },
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
        `Failed to fetch EtherFi APR data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }
}
