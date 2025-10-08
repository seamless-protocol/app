/**
 * App-wide logger utility
 * - Dev: logs to console
 * - Prod: sends errors to Sentry with useful tags
 */

import * as Sentry from '@sentry/react'

export interface LogContext {
  chainId?: number
  token?: string
  method?: string
  error?: unknown
  feature?: string
  transactionHash?: string
  userAddress?: string
  [key: string]: unknown
}

class BaseLogger {
  // Treat any non-production mode or Vitest environment as local console logging
  private isLocal = (() => {
    // Be resilient when running in non-Vite contexts (e.g., wagmi CLI, Node scripts)
    const maybeEnv = (typeof import.meta !== 'undefined' && (import.meta as any)?.env) || undefined
    const mode = maybeEnv?.MODE
    const isProd = mode === 'production'
    const isVitest = typeof import.meta !== 'undefined' && Boolean((import.meta as any).vitest)
    return !isProd || isVitest
  })()

  constructor(
    private namespace: string,
    private defaults?: LogContext,
  ) {}

  /**
   * Create a child logger with merged default context
   */
  child(extraDefaults?: LogContext) {
    return new BaseLogger(this.namespace, { ...(this.defaults || {}), ...(extraDefaults || {}) })
  }

  /**
   * Log an error with context
   */
  error(message: string, context?: LogContext) {
    const merged = { ...(this.defaults || {}), ...(context || {}) }

    if (this.isLocal) {
      // Always log to console in development
      // Include namespace for easy filtering
      console.error(`[${this.namespace}] ${message}`, merged)
      return
    }

    // In production, send to Sentry
    const tags: Record<string, string> = {
      logger: this.namespace,
    }

    if (merged['chainId'] !== undefined) tags['chainId'] = String(merged['chainId'])
    if (merged['token'] !== undefined) tags['token'] = String(merged['token'])
    if (merged['method'] !== undefined) tags['method'] = String(merged['method'])
    if (merged['feature'] !== undefined) tags['feature'] = String(merged['feature'])
    if (merged['transactionHash'] !== undefined)
      tags['transactionHash'] = String(merged['transactionHash'])
    // Do not add userAddress as a tag to avoid PII in Sentry

    // Remove userAddress from extra context sent to Sentry (privacy)
    const { userAddress: _omitUserAddress, ...sanitizedExtra } = merged
    const sentryContext = {
      tags,
      extra: sanitizedExtra,
    }

    Sentry.captureException(merged.error || new Error(message), sentryContext)
  }

  /**
   * Log a warning (console-only in dev)
   */
  warn(message: string, context?: LogContext) {
    if (!this.isLocal) return
    const merged = { ...(this.defaults || {}), ...(context || {}) }
    console.warn(`[${this.namespace}] ${message}`, merged)
  }

  /**
   * Log info (console-only in dev)
   */
  info(message: string, context?: LogContext) {
    if (!this.isLocal) return
    const merged = { ...(this.defaults || {}), ...(context || {}) }
    console.log(`[${this.namespace}] ${message}`, merged)
  }
}

/**
 * Factory for creating namespaced loggers that can be reused across the app.
 */
export function createLogger(namespace: string, defaults?: LogContext) {
  return new BaseLogger(namespace, defaults)
}

export type Logger = ReturnType<typeof createLogger>
