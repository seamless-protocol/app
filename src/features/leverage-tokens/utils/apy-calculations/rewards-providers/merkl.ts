import type { Address } from 'viem'
import { createLogger } from '@/lib/logger'
import { captureApiError } from '@/lib/observability/sentry'
import { elapsedMsSince, getNowMs } from '@/lib/utils/time'
import type { BaseRewardsAprData, RewardsAprFetcher } from './types'

const logger = createLogger('merkl-rewards')

// Types for Merkl API responses
interface MerklRewardToken {
  id: string
  name: string
  chainId: number
  address: string
  decimals: number
  symbol: string
  displaySymbol?: string
  icon?: string
  price?: number
}

interface MerklRewardBreakdown {
  token: MerklRewardToken
  amount: string
  value: number
  distributionType: string
  campaignId?: string
}

interface MerklRewardsRecord {
  total: number
  timestamp: string
  breakdowns: Array<MerklRewardBreakdown>
}

interface MerklAprBreakdown {
  distributionType: string
  identifier: string
  type: string
  value: number // APR value for this campaign
  timestamp: string
}

interface MerklAprRecord {
  cumulated: number
  timestamp: string
  breakdowns: Array<MerklAprBreakdown>
}

interface MerklOpportunity {
  id: string
  chainId: number
  identifier: string // The LT token address
  name: string
  apr?: number // Total APR
  aprRecord?: MerklAprRecord
  rewardsRecord?: MerklRewardsRecord
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
   * Also extracts individual reward token breakdown
   */
  async fetchRewardsApr(tokenAddress: Address, chainId?: number): Promise<BaseRewardsAprData> {
    try {
      // Query Merkl for opportunities by token address, optionally filtered by chain ID
      const opportunities = await this.fetchOpportunitiesByToken(tokenAddress, chainId)

      if (!opportunities || opportunities.length === 0) {
        logger.info('No opportunities found for token, returning default data', { tokenAddress })
        return {
          rewardsAPR: 0,
          rewardTokens: [],
        }
      }

      // Extract individual reward tokens and their APRs from rewardsRecord
      const rewardTokenMap = new Map<string, { symbol: string; decimals: number; apr: number }>()

      // For each opportunity, extract reward tokens
      // Since each campaign typically has one reward token, assign the opportunity's APR to each token
      for (const opportunity of opportunities) {
        const opportunityApr = this.extractAPRFromOpportunity(opportunity)

        if (
          opportunity.rewardsRecord?.breakdowns &&
          opportunity.rewardsRecord.breakdowns.length > 0
        ) {
          for (const rewardBreakdown of opportunity.rewardsRecord.breakdowns) {
            const token = rewardBreakdown.token
            const tokenKey = token.address.toLowerCase()

            const existingToken = rewardTokenMap.get(tokenKey)

            if (existingToken) {
              // Sum APRs if this token appears in multiple opportunities/campaigns
              existingToken.apr += opportunityApr
            } else {
              // Use the opportunity's APR directly from Merkl
              rewardTokenMap.set(tokenKey, {
                symbol: token.displaySymbol || token.symbol,
                decimals: token.decimals,
                apr: opportunityApr,
              })
            }
          }
        }
      }

      // Sum up APRs from all opportunities (already filtered by chain ID if provided)
      const totalAPR = opportunities.reduce((sum, opportunity) => {
        const apr = this.extractAPRFromOpportunity(opportunity)
        return sum + apr
      }, 0)

      // Convert reward token map to array
      const rewardTokens = Array.from(rewardTokenMap.entries()).map(([address, data]) => ({
        tokenAddress: address as Address,
        tokenSymbol: data.symbol,
        tokenDecimals: data.decimals,
        apr: data.apr / 100, // Merkl returns APR as whole number (e.g., 91.82), convert to decimal (e.g., 0.9182)
      }))

      // Build result with conditional rewardTokens (for exactOptionalPropertyTypes)
      const result: BaseRewardsAprData = {
        // Divide by 100 to convert from whole number (e.g., 91.82) to decimal (e.g., 0.9182)
        rewardsAPR: totalAPR / 100,
      }

      if (rewardTokens.length > 0) {
        result.rewardTokens = rewardTokens
      }

      logger.info('Successfully fetched rewards APR', {
        totalAPR,
        opportunitiesCount: opportunities.length,
        rewardTokensCount: rewardTokens.length,
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
    const start = getNowMs()
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      // Build URL with optional chain ID filter
      const url = chainId
        ? `https://api.merkl.xyz/v4/opportunities?identifier=${tokenAddress}&chainId=${chainId}`
        : `https://api.merkl.xyz/v4/opportunities?identifier=${tokenAddress}`

      // Use a "simple request" with no custom headers to avoid CORS preflight
      const response = await fetch(url, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const durationMs = elapsedMsSince(start)
        const error =
          response.status === 404
            ? new Error(`No Merkl opportunities found for token: ${tokenAddress}`)
            : new Error(`HTTP error! status: ${response.status}`)
        let responseSnippet: string | undefined
        try {
          const text = await response.text()
          responseSnippet = text.slice(0, 500)
        } catch {}
        captureApiError({
          provider: 'merkl',
          method: 'GET',
          url,
          status: response.status,
          durationMs,
          feature: 'apr',
          ...(typeof chainId === 'number' ? { chainId } : {}),
          token: tokenAddress,
          ...(responseSnippet ? { responseSnippet } : {}),
          error,
        })
        throw error
      }

      const data = await response.json()
      return Array.isArray(data) ? data : data.opportunities || []
    } catch (error) {
      const durationMs = elapsedMsSince(start)
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
