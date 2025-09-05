import path, { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 120_000,
    hookTimeout: 60_000,
    isolate: true,
  },
  envDir: resolve(__dirname),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src'),
    },
  },
})
