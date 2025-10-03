import * as Sentry from '@sentry/react'

/**
 * Initialize Sentry for error monitoring
 * Only initializes if VITE_SENTRY_DSN is provided
 */
export function initSentry() {
  const dsn = import.meta.env['VITE_SENTRY_DSN']
  const environment = import.meta.env.MODE

  console.log('[Sentry] Environment:', environment)

  if (!dsn) {
    console.log('[Sentry] No DSN provided, skipping initialization')
    return
  }

  try {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% of sessions
      replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
      // Enhanced error filtering and context
      beforeSend(event) {
        // Log in development but don't send
        if (environment === 'development') {
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
          environment: import.meta.env.MODE,
        }

        return event
      },
    })

    console.log('[Sentry] Initialized successfully')
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error)
  }
}
