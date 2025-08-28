import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from '@tanstack/react-router'
import '@rainbow-me/rainbowkit/styles.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { validateEnv } from './lib/env'
import './index.css'
import { ErrorBoundary } from './components/error-boundary'
import { RainbowThemeWrapper } from './components/rainbow-theme-wrapper'
import { ThemeProvider } from './components/theme-provider'
import { features } from './lib/config/features'
import { queryClient } from './lib/config/query.config'
import { initSentry } from './lib/config/sentry.config'
import { config as prodConfig } from './lib/config/wagmi.config'
import { testConfig } from './lib/config/wagmi.config.test'
import { router } from './router'

// Add startup debugging for CI
console.log('🚀 Starting React app...')
console.log('Environment mode:', import.meta.env.MODE)
console.log('CI mode:', import.meta.env['CI'])
console.log('Test mode:', import.meta.env['VITE_TEST_MODE'])
console.log('Debug mode:', import.meta.env['VITE_CI_DEBUG'])

// Validate environment variables before app starts
try {
  console.log('🔍 Validating environment variables...')
  validateEnv()
  console.log('✅ Environment validation passed')
} catch (error) {
  console.error('❌ Environment validation failed:', error)
  // In development, show the error in the UI
  if (import.meta.env.DEV) {
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

// Initialize Sentry before app renders
initSentry()

console.log('🔍 Finding root element...')
const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('❌ Root element not found!')
  throw new Error('Failed to find root element')
}
console.log('✅ Root element found:', rootElement)

console.log('🔧 Creating React root...')
const root = createRoot(rootElement)
console.log('✅ React root created')

console.log('🎨 Rendering React app...')
root.render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system">
        {/* biome-ignore lint/suspicious/noExplicitAny: prodConfig typing is safe here */}
        <WagmiProvider config={features.testMode ? testConfig : (prodConfig as any)}>
          <QueryClientProvider client={queryClient}>
            <RainbowThemeWrapper>
              <RouterProvider router={router} />
              <ReactQueryDevtools initialIsOpen={false} />
            </RainbowThemeWrapper>
          </QueryClientProvider>
        </WagmiProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)

console.log('✅ React app render initiated')

// Add global error handling for debugging
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})
