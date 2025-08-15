import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from '@tanstack/react-router'
import '@rainbow-me/rainbowkit/styles.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { validateEnv } from './lib/env'
import { WagmiProvider } from 'wagmi'
import './index.css'
import { ErrorBoundary } from './components/error-boundary'
import { ThemeProvider } from './components/theme-provider'
import { queryClient } from './lib/config/query.config'
import { config } from './lib/config/wagmi.config'
import { router } from './router'

// Validate environment variables before app starts
try {
  validateEnv()
} catch (error) {
  console.error('Environment validation failed:', error)
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

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Failed to find root element')
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system">
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider modalSize="compact" showRecentTransactions={true}>
              <RouterProvider router={router} />
              <ReactQueryDevtools initialIsOpen={false} />
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)