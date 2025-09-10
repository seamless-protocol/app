import { defineConfig, devices } from '@playwright/test'
import { getTestRpcUrl } from './tests/shared/backend'
import { ANVIL_DEFAULT_PRIVATE_KEY } from './tests/shared/env'

// Get RPC URL from centralized backend detection
const BASE_RPC_URL = getTestRpcUrl()

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Fail fast in CI to avoid long timeouts stacking up
  maxFailures: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 0 : 0,
  workers: process.env.CI ? 1 : undefined,
  // Keep tests short by default; individual expects can override
  timeout: 30_000,
  reporter: 'html',

  // Global setup to start Anvil before tests (skipped when using non-Anvil backend)
  globalSetup: './tests/e2e/global-setup.ts',

  use: {
    baseURL: 'http://127.0.0.1:3000',
    // Tighter default timeouts to reduce hang time
    navigationTimeout: 15_000,
    actionTimeout: 10_000,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    // Run dev server in test mode with mock wallet; RPC URL is determined automatically
    command: `bunx --bun vite --port 3000 --host 127.0.0.1 --strictPort`,
    env: {
      VITE_TEST_MODE: 'mock',
      VITE_BASE_RPC_URL: BASE_RPC_URL,
      VITE_ANVIL_RPC_URL: BASE_RPC_URL,
      VITE_TEST_PRIVATE_KEY: ANVIL_DEFAULT_PRIVATE_KEY,
    },
    port: 3000, // Use port instead of url - fixes macOS hanging issue
    reuseExistingServer: !process.env.CI,
    timeout: 120_000, // Give Vite + plugins extra time in CI
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
