/// <reference types="vitest/config" />
import path from 'node:path'
import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    name: 'integration',
    include: ['tests/integration_new/**/*.{test,spec}.{ts,tsx}'],
    environment: 'happy-dom',
    globals: true,
    setupFiles: './tests/integration_new/setup.ts',
    testTimeout: 60_000,
    hookTimeout: 30_000,
    poolOptions: { threads: { singleThread: true } }, // avoid Prool port clashes
    sequence: { hooks: 'list' },
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})