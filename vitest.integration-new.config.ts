/// <reference types="vitest/config" />
import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'integration',
    include: ['tests/integration_new/**/*.{test,spec}.{ts,tsx}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/integration_new/setup.ts',
    testTimeout: 270_000,
    hookTimeout: 180_000,
    poolOptions: { threads: { singleThread: true } }, // avoid Prool port clashes
    sequence: { hooks: 'list' },
    server: {
      deps: {
        inline: ['zod'],
      }
    }
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})