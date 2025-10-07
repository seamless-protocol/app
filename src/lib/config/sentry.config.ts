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
      integrations: [Sentry.browserTracingIntegration()],
      // Performance Monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      // Session Replay disabled
      replaysSessionSampleRate: 0, // disabled
      replaysOnErrorSampleRate: 0, // disabled
      // Enhanced error filtering and context

      beforeSend(event) {
        // Log in development but don't send
        if (environment === 'development') {
          console.log('[Sentry] Event captured (dev mode, not sent):', event)
          return null
        }

        // Filter out known non-critical errors
        if (event.exception) {
          const err = event.exception.values?.[0]
          if (err?.value?.includes('User rejected') || err?.value?.includes('User denied')) {
            return null // Don't send user rejection errors
          }
          const type = err?.type || ''
          const val = err?.value || ''
          // Optionally drop request AbortError timeouts as noise
          if (type === 'AbortError' || (typeof val === 'string' && val.includes('AbortError'))) {
            return null
          }
        }

        // Add additional context + normalize tags
        const tags: Record<string, unknown> = {
          ...(event.tags || {}),
          environment: import.meta.env.MODE,
        }

        const extra = (event.extra || {}) as Record<string, unknown>

        // Privacy: remove raw wallet addresses from payload
        if (event.tags && 'userAddress' in (event.tags as Record<string, unknown>)) {
          delete (event.tags as Record<string, unknown>)['userAddress']
        }
        if ('userAddress' in extra) {
          delete extra['userAddress']
        }

        // Derive endpointPath from URL if present and not already set
        const url =
          (extra['url'] as string | undefined) || (extra['requestUrl'] as string | undefined)
        let endpointPath =
          (tags['endpointPath'] as string | undefined) ||
          (extra['endpointPath'] as string | undefined)
        if (!endpointPath && typeof url === 'string') {
          try {
            endpointPath = new URL(url).pathname
          } catch {}
        }

        // Promote selected extra fields to tags (stringify scalars)
        const promote = (key: string, value: unknown) => {
          if (value === undefined || value === null) return
          const v = typeof value === 'bigint' ? value.toString() : String(value)
          ;(tags as Record<string, string>)[key] = v
        }

        const candidateKeys = [
          'provider',
          'method',
          'status',
          'feature',
          'flow',
          'chainId',
          'connectedChainId',
          'token',
          'inputAsset',
          'outputAsset',
          'slippageBps',
          'durationMs',
          'attempt',
          'route',
          'quoteOrder',
          'swapKey',
          'errorName',
        ] as const

        for (const k of candidateKeys) {
          if (k in extra) promote(k, (extra as Record<string, unknown>)[k])
          else if (event.tags && k in (event.tags as Record<string, unknown>))
            promote(k, (event.tags as Record<string, unknown>)[k])
        }

        if (endpointPath) promote('endpointPath', endpointPath)

        // Compute a deterministic fingerprint to stabilize grouping
        const t = tags as Record<string, string>
        const hasApiShape = Boolean(t['provider'] && t['method'] && t['endpointPath'])
        const isTxFlow = t['flow'] === 'mint' || t['flow'] === 'redeem'

        if (!event.fingerprint) {
          if (hasApiShape) {
            const status = t['status'] ?? '0'
            event.fingerprint = [
              'api',
              String(t['provider']),
              String(t['method']),
              String(t['endpointPath']),
              status,
            ]
          } else if (isTxFlow && t['chainId'] && t['token']) {
            const decoded =
              (extra['decodedName'] as string | undefined) ||
              (t['errorName'] as string | undefined) ||
              (event.exception?.values?.[0]?.type as string | undefined) ||
              'revert'
            event.fingerprint = [
              'tx',
              String(t['flow']),
              String(t['chainId']),
              String(t['token']),
              decoded,
            ]
          }
        }

        // Make issue titles consistent and scannable
        const first = event.exception?.values?.[0]
        if (hasApiShape) {
          const status = t['status'] ?? 'unknown'
          const title = `ExternalAPIError: ${String(t['provider'])} ${String(t['method'])} ${String(t['endpointPath'])} ${String(status)}`
          if (first) first.value = title
          else event.message = title
        } else if (isTxFlow) {
          const decoded =
            (extra['decodedName'] as string | undefined) ||
            (t['errorName'] as string | undefined) ||
            (event.exception?.values?.[0]?.type as string | undefined) ||
            'revert'
          const title = `OnChainError: ${String(t['flow'])} ${decoded}`
          if (first) first.value = title
          else event.message = title
        }

        event.tags = tags as Record<string, string>

        return event
      },
    })

    console.log('[Sentry] Initialized successfully')
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error)
  }
}
