/// <reference types="vitest/config" />
import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    include: [
      'tests/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
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

