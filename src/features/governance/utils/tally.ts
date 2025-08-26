import type { TallyProposal } from '../types'
import { TALLY_CONFIG } from './constants'

// GraphQL Queries
const GET_PROPOSALS = `
  query GovernanceProposals($input: ProposalsInput!) {
    proposals(input: $input) {
      nodes {
        ... on Proposal {
          id
          onchainId
          status
          originalId
          createdAt
          quorum
          voteStats {
            votesCount
            percent
            type
            votersCount
          }
          metadata {
            description
          }
          events {
            type
            txHash
          }
          start {
            ... on Block {
              timestamp
            }
            ... on BlocklessTimestamp {
              timestamp
            }
          }
          block {
            timestamp
          }
          governor {
            id
            quorum
            name
            timelockId
            token {
              decimals
            }
          }
        }
      }
      pageInfo {
        firstCursor
        lastCursor
        count
      }
    }
  }
`

/**
 * Generic GraphQL query function for Tally API
 */
async function queryTallyAPI<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const apiKey = import.meta.env['VITE_TALLY_API_KEY']
  if (!apiKey) {
    throw new Error('VITE_TALLY_API_KEY is required for Tally API access')
  }

  try {
    const response = await fetch(TALLY_CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    })

    if (!response.ok) {
      // Provide more specific error messages for better debugging
      const errorText = await response.text()
      throw new Error(`Tally API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()

    if (result.errors) {
      // Handle GraphQL errors more gracefully
      const errorMessages = result.errors.map((err: { message: string }) => err.message).join(', ')
      throw new Error(`GraphQL errors: ${errorMessages}`)
    }

    return result.data
  } catch (error) {
    // Re-throw with additional context for better debugging
    if (error instanceof Error) {
      throw new Error(`Tally API request failed: ${error.message}`)
    }
    throw error
  }
}

/**
 * Fetches governance proposals from Tally API
 */
export async function getProposals(input: {
  filters: { organizationId: string }
  sort?: { sortBy: string; isDescending: boolean }
  page?: { limit: number; afterCursor?: string }
}): Promise<{
  proposals: {
    nodes: Array<TallyProposal>
    pageInfo: { firstCursor: string; lastCursor: string | null; count: number }
  }
}> {
  return queryTallyAPI(GET_PROPOSALS, { input })
}
