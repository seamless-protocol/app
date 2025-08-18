/**
 * Logger utility for the leverage tokens feature
 * Abstracts logging to allow easy switching between console and monitoring services
 */

import * as Sentry from '@sentry/react'

interface LogContext {
  chainId?: number
  token?: string
  method?: string
  error?: unknown
  [key: string]: unknown
}

class Logger {
  private isDev = import.meta.env.DEV

  /**
   * Log an error with context
   * In development: logs to console
   * In production: sends to Sentry
   */
  error(message: string, context?: LogContext) {
    // Always log to console in development
    if (this.isDev) {
      console.error(`[LeverageTokens] ${message}`, context)
      return
    }

    // In production, send to Sentry
    const sentryContext = {
      tags: {
        feature: 'leverage-tokens',
        ...(context?.chainId && { chainId: context.chainId.toString() }),
        ...(context?.token && { token: context.token as string }),
        ...(context?.method && { method: context.method }),
      },
      ...(context && { extra: context }),
    }

    Sentry.captureException(context?.error || new Error(message), sentryContext)
  }

  /**
   * Log a warning
   */
  warn(message: string, context?: LogContext) {
    if (this.isDev) {
      console.warn(`[LeverageTokens] ${message}`, context)
    }
  }

  /**
   * Log info (only in development)
   */
  info(message: string, context?: LogContext) {
    if (this.isDev) {
      console.log(`[LeverageTokens] ${message}`, context)
    }
  }
}

export const logger = new Logger()
