// E2E env source
// - Uses tests/shared/env to derive TEST_RPC_URL (Tenderly VirtualNet or Anvil)
// - The dev server is started with VITE_BASE_RPC_URL/VITE_ANVIL_RPC_URL set to that value
// - This ensures E2E and integration can share the exact same RPC in CI or locally
import { defineConfig, devices } from '@playwright/test'
import { ENV } from './tests/shared/env'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  // Global setup to start Anvil before tests
  globalSetup: './tests/e2e/global-setup.ts',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    // Run dev server in test mode with mock wallet and selected RPC (Tenderly or Anvil)
    command: 'bun dev',
    env: {
      VITE_TEST_MODE: 'mock',
      VITE_BASE_RPC_URL: ENV.RPC_URL,
      VITE_ANVIL_RPC_URL: ENV.RPC_URL,
      VITE_TEST_PRIVATE_KEY: process.env.VITE_TEST_PRIVATE_KEY ?? '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    },
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 30000, // Allow more time for test mode startup
  },
})
