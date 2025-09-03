/**
 * Leverage token specific constants
 */

// Query stale times (in milliseconds)
export const STALE_TIME = {
  factory: 60_000, // 1 minute - token list doesn't change often
  metadata: 300_000, // 5 minutes - name/symbol/decimals are static
  price: 10_000, // 10 seconds - prices need to be fresh
  balance: 30_000, // 30 seconds - balances change with user actions
  supply: 30_000, // 30 seconds - supply changes with mints/redeems
  rebalancing: 60_000, // 1 minute - rebalancing status
  historical: 300_000, // 5 minutes - historical data doesn't change often
} as const

// Retry configuration
export const RETRY_CONFIG = {
  maxAttempts: 3,
  delay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  shouldRetry: (failureCount: number, error: unknown) => {
    // Don't retry user errors
    const e = error as { code?: number }
    if (e?.code === 4001 || e?.code === 4902) return false
    return failureCount < 3
  },
} as const

// Transaction settings
export const TX_SETTINGS = {
  confirmations: 1, // Number of confirmations to wait
  timeout: 60_000, // 60 seconds timeout for transactions
} as const
