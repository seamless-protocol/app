import { getEnvVar } from '@/lib/env'

export interface GraphQLResponse<T = unknown> {
  data?: T
  errors?: Array<{
    message: string
    locations?: Array<{ line: number; column: number }>
    path?: Array<string>
  }>
}

export interface GraphQLRequest {
  query: string
  variables?: Record<string, unknown>
}

// Network-specific subgraph endpoints
const SUBGRAPH_ENDPOINTS = {
  1: getEnvVar(
    'VITE_LEVERAGE_TOKENS_SUBGRAPH_ETHEREUM',
    'https://gateway.thegraph.com/api/subgraphs/id/2vzaVmMnkzbcfgtP2nqKbVWoqAUumvj24RzHPE1NxPkg',
  ), // Ethereum
  8453: getEnvVar(
    'VITE_LEVERAGE_TOKENS_SUBGRAPH_BASE',
    'https://api.studio.thegraph.com/query/113147/seamless-leverage-tokens-base/version/latest',
  ), // Base
} as const

export type SupportedChainId = keyof typeof SUBGRAPH_ENDPOINTS

/**
 * Get all supported chain IDs from the configuration
 */
export function getSupportedChainIds(): Array<SupportedChainId> {
  return Object.keys(SUBGRAPH_ENDPOINTS).map(Number) as Array<SupportedChainId>
}

/**
 * Get the appropriate subgraph endpoint for a given chain ID
 */
export function getSubgraphEndpoint(chainId: number): string {
  const endpoint = SUBGRAPH_ENDPOINTS[chainId as SupportedChainId]
  if (!endpoint) {
    throw new Error(
      `Unsupported chain ID: ${chainId}. Supported chains: ${Object.keys(SUBGRAPH_ENDPOINTS).join(', ')}`,
    )
  }
  return endpoint
}

/**
 * Generic GraphQL request function
 */
export async function graphqlRequest<T>(chainId: number, request: GraphQLRequest): Promise<T> {
  const apiKey = getEnvVar('VITE_THEGRAPH_API_KEY')
  if (!apiKey) {
    throw new Error('VITE_THEGRAPH_API_KEY environment variable is required')
  }

  const endpoint = getSubgraphEndpoint(chainId)

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result = await response.json()

  if (result.errors && result.errors.length > 0) {
    throw new Error(
      `GraphQL errors: ${result.errors.map((e: { message: string }) => e.message).join(', ')}`,
    )
  }

  return result.data
}
