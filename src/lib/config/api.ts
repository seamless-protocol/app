/**
 * API endpoints configuration for Seamless Protocol
 */

// Default API endpoints
export const API_ENDPOINTS = {
  morpho: 'https://api.morpho.org',
  seamlessSubgraph: 'https://api.thegraph.com/subgraphs/name/seamless/seamless-v2',
  fuul: 'https://api.fuul.xyz',
  fuulSubgraph: 'https://api.thegraph.com/subgraphs/name/fuul/fuul-rewards',
  coingecko: 'https://api.coingecko.com/api/v3',
} as const

// Explicit mapping of API keys to environment variable names
export const API_ENV_OVERRIDE_MAP: Record<keyof typeof API_ENDPOINTS, string> = {
  morpho: 'VITE_MORPHO_API_URL',
  seamlessSubgraph: 'VITE_SEAMLESS_SUBGRAPH_URL',
  fuul: 'VITE_FUUL_API_URL',
  fuulSubgraph: 'VITE_FUUL_SUBGRAPH_URL',
  coingecko: 'VITE_COINGECKO_API_URL',
} as const

// Get API endpoint with environment override support
export function getApiEndpoint(key: keyof typeof API_ENDPOINTS): string {
  const envKey = API_ENV_OVERRIDE_MAP[key]
  // Safe dynamic access with proper typing
  const dynamicEnv = import.meta.env as unknown as Record<string, string | undefined>
  return dynamicEnv[envKey] ?? API_ENDPOINTS[key]
}
