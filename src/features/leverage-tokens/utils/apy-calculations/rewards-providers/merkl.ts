import type { Address } from 'viem'
import type { BaseRewardsAprData, RewardsAprFetcher } from './types'

// Types for Merkl API responses
interface MerklOpportunity {
  id: string
  chainId: number // Chain ID for this opportunity
  apr?: number // Merkl provides APR directly in opportunity data
  campaigns?: Array<MerklCampaign>
  tokenAddress?: string // The LT token address this opportunity is for
}

interface MerklCampaign {
  id: string
  apr?: number
  rewardAmount?: string
  duration?: number
}

/**
 * Configuration for Merkl API
 */
export interface MerklConfig {
  chainId: number
}

/**
 * Merkl rewards APR provider implementation
 *
 * This provider fetches rewards APR data from Merkl API for Base chain.
 * Merkl distributes rewards on Base even for activities on other chains.
 *
 * The provider queries Merkl opportunities by LT token address and chain ID
 * and uses Merkl's provided APR directly from the opportunity data.
 */
export class MerklRewardsAprProvider implements RewardsAprFetcher {
  protocolId = 'merkl'
  protocolName = 'Merkl'

  /**
   * Fetch rewards APR for a given token address from Merkl
   * Queries all opportunities for the token and sums up APRs from all relevant opportunities
   */
  async fetchRewardsApr(tokenAddress: Address, chainId?: number): Promise<BaseRewardsAprData> {
    try {
      console.log(`[Merkl] Fetching rewards APR for token: ${tokenAddress}`)

      // Query Merkl for opportunities by token address, optionally filtered by chain ID
      const opportunities = await this.fetchOpportunitiesByToken(tokenAddress, chainId)

      if (!opportunities || opportunities.length === 0) {
        console.log(`[Merkl] No opportunities found for token: ${tokenAddress}, returning default data`)
        return {
          rewardsAPR: 0,
        }
      }

      // Sum up APRs from all opportunities (already filtered by chain ID if provided)
      const totalAPR = opportunities.reduce((sum, opportunity) => {
        const apr = this.extractAPRFromOpportunity(opportunity)
        return sum + apr
      }, 0)

      const result: BaseRewardsAprData = {
        // Divide by 100 to convert to percentage
        rewardsAPR: totalAPR / 100,
      }

      console.log(
        `[Merkl] Successfully fetched rewards APR: ${totalAPR}% from ${opportunities.length} opportunities`,
      )
      return result
    } catch (error) {
      console.error('[Merkl] Error fetching rewards APR:', error)
      throw error
    }
  }

  /**
   * Fetch opportunities by token address from Merkl
   * Optionally filters by chain ID for better performance
   */
  private async fetchOpportunitiesByToken(
    tokenAddress: Address,
    chainId?: number,
  ): Promise<Array<MerklOpportunity>> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      // Build URL with optional chain ID filter
      const url = chainId
        ? `https://api.merkl.xyz/v4/opportunities?identifier=${tokenAddress}&chainId=${chainId}`
        : `https://api.merkl.xyz/v4/opportunities?identifier=${tokenAddress}`

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`No Merkl opportunities found for token: ${tokenAddress}`)
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return Array.isArray(data) ? data : data.opportunities || []
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[Merkl] Request timeout while fetching opportunities')
      } else {
        console.error('[Merkl] Error fetching opportunities:', error)
      }
      throw error
    }
  }

  /**
   * Extract APR from opportunity data
   * Merkl provides APR directly in opportunity data
   */
  private extractAPRFromOpportunity(opportunity: MerklOpportunity): number {
    try {
      // Merkl provides APR directly in the opportunity data
      if (typeof opportunity.apr === 'number') {
        return opportunity.apr
      }

      // Fallback: if APR is not provided, return 0
      console.warn('[Merkl] No APR found in opportunity data, returning 0')
      return 0
    } catch (error) {
      console.error('[Merkl] Error extracting APR from opportunity:', error)
      return 0
    }
  }
}
