import type { AprFetcher, BaseAprData } from './types'

/**
 * EtherFi-specific APR data interface
 */
export interface EtherFiAprData extends BaseAprData {
  sevenDayApr: number
  sevenDayRestakingApr: number
  bufferEth: number
  metadata: {
    raw: any
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
    try {
      const response = await fetch(
        'https://misc-cache.seamlessprotocol.com/etherfi-protocol-detail',
      )

      if (!response.ok) {
        throw new Error(
          `Failed to fetch EtherFi data (status ${response.status}): ${response.statusText}`,
        )
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
        metadata: {
          raw,
          useRestakingApr: true,
        },
      }

      // Debug logging for EtherFi APR
      console.log('=== ETHERFI APR DEBUG ===')
      console.log('Raw API Response:', raw)
      console.log('Calculated Staking APR:', sevenDayApr)
      console.log('Calculated Restaking APR:', sevenDayRestakingApr)
      console.log('========================')

      return result
    } catch (error) {
      console.error('Error fetching EtherFi APR:', error)
      throw new Error(
        `Failed to fetch EtherFi APR data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }
}
