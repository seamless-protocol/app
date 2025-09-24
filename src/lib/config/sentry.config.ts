import * as Sentry from '@sentry/react'

/**
 * Initialize Sentry for error monitoring
 * Only initializes if VITE_SENTRY_DSN is provided
 */
export function initSentry() {
  const dsn = import.meta.env['VITE_SENTRY_DSN']

  if (!dsn) {
    console.log('[Sentry] No DSN provided, skipping initialization')
    return
  }

  try {
    Sentry.init({
      dsn,
      environment: import.meta.env['VITE_SENTRY_ENVIRONMENT'] || import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      // Release tracking
      release: import.meta.env['VITE_SENTRY_RELEASE'],
      // Enhanced error filtering and context
      beforeSend(event) {
        // Log in development but don't send
        if (import.meta.env.MODE === 'development') {
          console.log('[Sentry] Event captured (dev mode, not sent):', event)
          return null
        }

        // Filter out known non-critical errors
        if (event.exception) {
          const error = event.exception.values?.[0]
          if (error?.value?.includes('User rejected') || error?.value?.includes('User denied')) {
            return null // Don't send user rejection errors
          }
        }

        // Add additional context
        event.tags = {
          ...event.tags,
          environment: import.meta.env['VITE_SENTRY_ENVIRONMENT'] || import.meta.env.MODE,
          version: import.meta.env['VITE_SENTRY_RELEASE'] || 'unknown',
        }

        return event
      },
    })

    console.log('[Sentry] Initialized successfully')
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error)
  }
}
