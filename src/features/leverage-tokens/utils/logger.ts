/**
 * Feature-scoped logger using the shared app logger
 */
import type { LogContext } from '@/lib/logger'
import { createLogger } from '@/lib/logger'

export const logger = createLogger('LeverageTokens', { feature: 'leverage-tokens' })

/**
 * Typed helpers for specific logging scenarios with enforced context
 */

// Context required for write operations (minting, approving, etc.)
interface WriteContext extends LogContext {
  chainId: number
  token: string
  method: string
}

// Context required for query operations
interface QueryContext extends LogContext {
  chainId: number
  method: string
}

/**
 * Log write operation errors with required context
 */
export function logWriteError(message: string, ctx: WriteContext) {
  logger.error(message, ctx)
}

/**
 * Log write operation success with required context
 */
export function logWriteSuccess(message: string, ctx: WriteContext & { hash?: string }) {
  logger.info(message, ctx)
}

/**
 * Log query operation errors with required context
 */
export function logQueryError(message: string, ctx: QueryContext) {
  logger.error(message, ctx)
}
