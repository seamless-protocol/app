/**
 * Logger utility for the leverage tokens feature
 * Abstracts logging to allow easy switching between console and monitoring services
 */

interface LogContext {
  chainId?: number
  token?: string
  method?: string
  error?: unknown
  [key: string]: any
}

class Logger {
  private isDev = import.meta.env.DEV

  /**
   * Log an error with context
   * In development: logs to console
   * In production: would send to Sentry or other monitoring service
   */
  error(message: string, context?: LogContext) {
    if (this.isDev) {
      console.error(`[LeverageTokens] ${message}`, context)
    } else {
      // In production, this would send to Sentry
      // For now, we'll still log to console but could easily swap
      console.error(`[LeverageTokens] ${message}`, context)
      
      // Future Sentry integration:
      // if (window.Sentry) {
      //   window.Sentry.captureException(context?.error || new Error(message), {
      //     tags: {
      //       feature: 'leverage-tokens',
      //       chainId: context?.chainId,
      //       token: context?.token,
      //       method: context?.method,
      //     },
      //     extra: context
      //   })
      // }
    }
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