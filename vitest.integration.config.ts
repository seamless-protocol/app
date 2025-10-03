/// <reference types="vitest/config" />
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    // No global setup that mocks modules — integration uses real modules
    globals: true,
    // Tenderly static VNets cannot handle concurrent snapshots across workers.
    // Force Vitest to run integration files sequentially so mint/redeem suites don't collide.
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
