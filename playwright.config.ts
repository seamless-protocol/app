import { defineConfig, devices } from '@playwright/test'
import {
  ADDR,
  ANVIL_DEFAULT_PRIVATE_KEY,
  DEFAULT_CHAIN_ID,
  LEVERAGE_TOKEN_KEY,
  LEVERAGE_TOKEN_ADDRESS,
  LEVERAGE_TOKEN_LABEL,
  TOKEN_SOURCE,
  RPC,
} from './tests/shared/env'

const BASE_RPC_URL = RPC.primary
const ADMIN_RPC_URL = RPC.admin
const E2E_TOKEN_SOURCE = (process.env['E2E_TOKEN_SOURCE'] ?? TOKEN_SOURCE).toLowerCase()
const INCLUDE_TEST_TOKENS = E2E_TOKEN_SOURCE !== 'prod'

// Ensure the process env is populated so tests can read the resolved value
process.env['E2E_TOKEN_SOURCE'] = E2E_TOKEN_SOURCE
process.env['E2E_LEVERAGE_TOKEN_ADDRESS'] = LEVERAGE_TOKEN_ADDRESS
process.env['E2E_LEVERAGE_TOKEN_LABEL'] = LEVERAGE_TOKEN_LABEL
process.env['E2E_CHAIN_ID'] = String(DEFAULT_CHAIN_ID)
process.env['E2E_LEVERAGE_TOKEN_KEY'] = LEVERAGE_TOKEN_KEY
process.env['VITE_TEST_RPC_URL'] = BASE_RPC_URL
process.env['TENDERLY_ADMIN_RPC_URL'] = ADMIN_RPC_URL
process.env['VITE_CONTRACT_ADDRESS_OVERRIDES'] =
  process.env['VITE_CONTRACT_ADDRESS_OVERRIDES'] ?? ''

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  // Fail fast in CI to avoid long timeouts stacking up
  maxFailures: process.env['CI'] ? 1 : 0,
  retries: process.env['CI'] ? 0 : 0,
  workers: process.env['CI'] ? 1 : 1,
  // Keep tests short by default; individual expects can override
  timeout: 45_000,
  expect: {
    timeout: 2_500,
  },
  reporter: 'html',

  // Global setup to start Anvil before tests (skipped when using non-Anvil backend)
  globalSetup: './tests/e2e/global-setup.ts',

  use: {
    baseURL: 'http://127.0.0.1:3000',
    // Slightly relaxed navigation timeout to deflake initial loads
    navigationTimeout: 45_000,
    actionTimeout: 10_000,
    serviceWorkers: 'block',
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
    url: 'http://127.0.0.1:3000', // Explicit URL for Playwright to wait for
    env: {
      VITE_E2E: '1',
      VITE_TEST_MODE: 'mock',
      VITE_BASE_RPC_URL: BASE_RPC_URL,
      VITE_ANVIL_RPC_URL: BASE_RPC_URL,
      VITE_TEST_RPC_URL: BASE_RPC_URL,
      // Forward LiFi integrator/API key if provided to avoid rate limits in tests
      ...(process.env['VITE_LIFI_INTEGRATOR'] || process.env['LIFI_INTEGRATOR']
        ? {
            VITE_LIFI_INTEGRATOR:
              process.env['VITE_LIFI_INTEGRATOR'] ?? process.env['LIFI_INTEGRATOR']!,
          }
        : {}),
      ...(process.env['VITE_LIFI_API_KEY'] || process.env['LIFI_API_KEY']
        ? {
            VITE_LIFI_API_KEY:
              process.env['VITE_LIFI_API_KEY'] ?? process.env['LIFI_API_KEY']!,
          }
        : {}),
      VITE_TEST_PRIVATE_KEY: ANVIL_DEFAULT_PRIVATE_KEY,
      // Minimum required env vars for app bootstrap during tests
      VITE_WALLETCONNECT_PROJECT_ID:
        process.env['VITE_WALLETCONNECT_PROJECT_ID'] ?? 'playwright-test-walletconnect',
      VITE_ETHEREUM_RPC_URL:
        process.env['VITE_ETHEREUM_RPC_URL'] ?? BASE_RPC_URL,
      VITE_THEGRAPH_API_KEY: process.env['VITE_THEGRAPH_API_KEY'] ?? 'playwright-test-thegraph-key',
      VITE_ROUTER_V2_ADDRESS: ADDR.routerV2 ?? ADDR.router ?? '',
      VITE_MANAGER_V2_ADDRESS: ADDR.managerV2 ?? ADDR.manager ?? '',
      VITE_MULTICALL_EXECUTOR_ADDRESS: ADDR.executor ?? '',
      VITE_CONTRACT_ADDRESS_OVERRIDES: process.env['VITE_CONTRACT_ADDRESS_OVERRIDES'] ?? '',
      TENDERLY_ADMIN_RPC_URL: ADMIN_RPC_URL,
      E2E_TOKEN_SOURCE,
      E2E_LEVERAGE_TOKEN_KEY: LEVERAGE_TOKEN_KEY,
      E2E_LEVERAGE_TOKEN_ADDRESS: LEVERAGE_TOKEN_ADDRESS,
      E2E_LEVERAGE_TOKEN_LABEL: LEVERAGE_TOKEN_LABEL,
      E2E_CHAIN_ID: String(DEFAULT_CHAIN_ID),
      ...(INCLUDE_TEST_TOKENS ? { VITE_INCLUDE_TEST_TOKENS: 'true' } : {}),
    },
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000, // Give Vite + plugins extra time in CI
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
