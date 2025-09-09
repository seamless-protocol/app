import { defineConfig, devices } from '@playwright/test'

// Prefer just-in-time RPC (TEST_RPC_URL), then Tenderly, else local Anvil
const BASE_RPC_URL =
  process.env['TEST_RPC_URL'] ?? process.env['TENDERLY_RPC_URL'] ?? 'http://127.0.0.1:8545'

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

  // Global setup to start Anvil before tests (skipped when Tenderly is set)
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
    // Run dev server in test mode with mock wallet; point to Tenderly or Anvil
    command: `bunx --bun vite --port 3000 --host 127.0.0.1 --strictPort`,
    env: {
      VITE_TEST_MODE: 'mock',
      VITE_BASE_RPC_URL: BASE_RPC_URL,
      VITE_ANVIL_RPC_URL: BASE_RPC_URL,
      VITE_TEST_PRIVATE_KEY:
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    },
    port: 3000, // Use port instead of url - fixes macOS hanging issue
    reuseExistingServer: !process.env.CI,
    timeout: 120_000, // Give Vite + plugins extra time in CI
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
