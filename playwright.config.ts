import { defineConfig, devices } from '@playwright/test'

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

  // Global setup to start Anvil before tests
  globalSetup: './tests/e2e/global-setup.ts',

  use: {
    baseURL: 'http://localhost:3000',
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
    // Run dev server in test mode with mock wallet and Anvil RPC
    command:
      'VITE_TEST_MODE=mock VITE_BASE_RPC_URL=http://127.0.0.1:8545 VITE_ANVIL_RPC_URL=http://127.0.0.1:8545 VITE_TEST_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 bun dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30000, // Allow more time for test mode startup
  },
})
