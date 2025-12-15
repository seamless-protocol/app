/// <reference types="vitest/config" />
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    // No global setup that mocks modules — integration uses real modules
    globals: true,
    // Anvil can't properly isolate nonces when test files run in parallel with same account
    // Keep sequential execution to avoid nonce conflicts and state interference
    fileParallelism: false,
    include: [
      'tests/integration/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: ['tests/e2e/**/*', 'node_modules/**/*', 'src/**/*.stories.{js,jsx,ts,tsx}'],
    testTimeout: 120_000,
    hookTimeout: 60_000,
    isolate: true,
    environmentOptions: {
      jsdom: { resources: 'usable' },
    },
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
