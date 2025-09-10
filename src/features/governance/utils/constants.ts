/**
 * Governance specific constants
 */

import { base } from 'wagmi/chains'
import { contractAddresses, getGovernanceAddresses } from '@/lib/contracts/addresses'

// Seamless Protocol contract addresses (single source of truth via lib/contracts)
const governance = getGovernanceAddresses(base.id)

export const CONTRACTS = {
  TOKEN: contractAddresses[base.id]?.seamlessToken ?? '0x1C7a460413dD4e964f96D8dFC56E7223cE88CD85',
  TIMELOCK: governance.timelockShort ?? '0x639d2dD24304aC2e6A691d8c1cFf4a2665925fee',
} as const

// Governance parameters
export const GOVERNANCE_PARAMS = {
  PROPOSAL_THRESHOLD: '200000000000000000000000', // 200,000 SEAM
  VOTING_PERIOD: '259200', // 3 days in seconds
  VOTING_DELAY: '172800', // 2 days in seconds
} as const

// Tally API configuration
export const TALLY_CONFIG = {
  API_URL: 'https://api.tally.xyz/query',
  ORGANIZATION_ID: '2212190090728309863',
  CHAIN_ID: 'eip155:8453',
} as const

// Query stale times (in milliseconds)
export const STALE_TIME = {
  proposals: 60_000, // 1 minute - proposals don't change often
  votes: 30_000, // 30 seconds - votes can change with user actions
} as const

// Retry configuration
export const RETRY_CONFIG = {
  maxAttempts: 3,
  delay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  shouldRetry: (failureCount: number, error: unknown) => {
    // Don't retry auth errors
    if (error instanceof Error && error.message.includes('401')) return false
    if (error instanceof Error && error.message.includes('403')) return false
    return failureCount < 3
  },
} as const

// Default query settings
export const QUERY_SETTINGS = {
  refetchInterval: 30_000, // 30 seconds
  gcTime: 300_000, // 5 minutes
} as const
