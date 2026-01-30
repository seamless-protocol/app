import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import '@rainbow-me/rainbowkit/styles.css'
import { type LazyExoticComponent, lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { type Config, WagmiProvider } from 'wagmi'
import { validateEnv } from './lib/env'
import { createLogger } from './lib/logger'
import './index.css'

const logger = createLogger('main')

import { BalmySDKProvider } from './components/BalmySDKProvider'
import { ErrorBoundary } from './components/error-boundary'
import { LiFiSync } from './components/lifi-sync'
import { RainbowThemeWrapper } from './components/rainbow-theme-wrapper'
import { ThemeProvider } from './components/theme-provider'
import { features } from './lib/config/features'
import { queryClient } from './lib/config/query.config'
import { initSentry } from './lib/config/sentry.config'
import { config } from './lib/config/wagmi.config'
import { router } from './router'

declare global {
  interface Window {
    __APP_READY__?: boolean
    sentrySmoke?: (kind?: string) => void
  }
}

function markAppReady() {
  if (typeof window === 'undefined') return
  const mark = () => {
    window.__APP_READY__ = true
    document.body.dataset['appReady'] = 'true'
  }

  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => setTimeout(mark, 0))
  } else {
    setTimeout(mark, 0)
  }
}

// Validate environment variables before app starts
try {
  validateEnv()
} catch (error) {
  logger.error('Environment validation failed', {
    error,
    environment: import.meta.env['MODE'],
  })
  // In development, show the error in the UI
  if (import.meta.env['MODE'] === 'development') {
    const errorDiv = document.createElement('div')
    errorDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #ef4444;
      color: white;
      padding: 20px;
      font-family: monospace;
      white-space: pre-wrap;
      z-index: 99999;
    `
    errorDiv.textContent = error instanceof Error ? error.message : String(error)
    document.body.appendChild(errorDiv)
  }
  throw error
}

// Initialize Sentry and GA4 before app renders
initSentry()
// No test-only smoke hooks in production bundles

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Failed to find root element')
}

console.log('[app] Booting Seamless front-end', {
  viteE2EFlag: import.meta.env['VITE_E2E'],
  mode: import.meta.env['MODE'],
})

// Load React Query Devtools only in development builds and keep it out of prod bundles
type DevtoolsComponent = typeof import('@tanstack/react-query-devtools')['ReactQueryDevtools']
let ReactQueryDevtoolsLazy: LazyExoticComponent<DevtoolsComponent> | null = null
if (import.meta.env.MODE === 'development') {
  ReactQueryDevtoolsLazy = lazy(() =>
    import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools })),
  )
}

// Bypass LiFi's wagmi sync in test mode so connectors stay intact
function LiFiWrapper({ config, children }: { config: Config; children: React.ReactNode }) {
  if (features.testMode) {
    return <>{children}</>
  }
  // Type assertion is safe here because we only use LiFiSync in prod mode
  return <LiFiSync config={config}>{children}</LiFiSync>
}

try {
  const root = createRoot(rootElement)

  root.render(
    <StrictMode>
      <ErrorBoundary>
        <ThemeProvider defaultTheme="dark">
          <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
              <BalmySDKProvider>
                <LiFiWrapper config={config}>
                  <RainbowThemeWrapper>
                    <RouterProvider router={router} />
                    {ReactQueryDevtoolsLazy ? (
                      <Suspense fallback={null}>
                        <ReactQueryDevtoolsLazy initialIsOpen={false} />
                      </Suspense>
                    ) : null}
                  </RainbowThemeWrapper>
                </LiFiWrapper>
              </BalmySDKProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </StrictMode>,
  )

  queueMicrotask(markAppReady)
} catch (error) {
  console.error('[app] Failed to initialize application', error)
  if (typeof document !== 'undefined') {
    document.body.dataset['appReady'] = 'error'
  }
  if (typeof window !== 'undefined') {
    window.__APP_READY__ = false
  }
  throw error
}
