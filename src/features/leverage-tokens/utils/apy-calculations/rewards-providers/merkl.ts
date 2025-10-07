import type { Address } from 'viem'
import { createLogger } from '@/lib/logger'
import { captureApiError } from '@/lib/observability/sentry'
import type { BaseRewardsAprData, RewardsAprFetcher } from './types'

const logger = createLogger('merkl-rewards')

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
      logger.info('Fetching rewards APR for token', { tokenAddress })

      // Query Merkl for opportunities by token address, optionally filtered by chain ID
      const opportunities = await this.fetchOpportunitiesByToken(tokenAddress, chainId)

      if (!opportunities || opportunities.length === 0) {
        logger.info('No opportunities found for token, returning default data', { tokenAddress })
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

      logger.info('Successfully fetched rewards APR', {
        totalAPR,
        opportunitiesCount: opportunities.length,
        tokenAddress,
      })
      return result
    } catch (error) {
      logger.error('Error fetching rewards APR', { error, tokenAddress })
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
    const start =
      typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()
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
        const durationMs = Math.round(
          (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) -
            start,
        )
        const error =
          response.status === 404
            ? new Error(`No Merkl opportunities found for token: ${tokenAddress}`)
            : new Error(`HTTP error! status: ${response.status}`)
        captureApiError({
          provider: 'merkl',
          method: 'GET',
          url,
          status: response.status,
          durationMs,
          feature: 'apr',
          ...(typeof chainId === 'number' ? { chainId } : {}),
          token: tokenAddress,
          error,
        })
        throw error
      }

      const data = await response.json()
      return Array.isArray(data) ? data : data.opportunities || []
    } catch (error) {
      const durationMs = Math.round(
        (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) -
          start,
      )
      if (error instanceof Error && error.name === 'AbortError') {
        captureApiError({
          provider: 'merkl',
          method: 'GET',
          url: chainId
            ? `https://api.merkl.xyz/v4/opportunities?identifier=${tokenAddress}&chainId=${chainId}`
            : `https://api.merkl.xyz/v4/opportunities?identifier=${tokenAddress}`,
          status: 0,
          durationMs,
          feature: 'apr',
          ...(typeof chainId === 'number' ? { chainId } : {}),
          token: tokenAddress,
          error,
        })
      } else {
        captureApiError({
          provider: 'merkl',
          method: 'GET',
          url: chainId
            ? `https://api.merkl.xyz/v4/opportunities?identifier=${tokenAddress}&chainId=${chainId}`
            : `https://api.merkl.xyz/v4/opportunities?identifier=${tokenAddress}`,
          status: 0,
          durationMs,
          feature: 'apr',
          ...(typeof chainId === 'number' ? { chainId } : {}),
          token: tokenAddress,
          error,
        })
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
      logger.warn('No APR found in opportunity data, returning 0', { opportunity })
      return 0
    } catch (error) {
      logger.error('Error extracting APR from opportunity', { error, opportunity })
      return 0
    }
  }
}
