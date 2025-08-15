import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { validateEnv } from './lib/env'
import './index.css'
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
    <RouterProvider router={router} />
  </StrictMode>,
)
