/// <reference types="vitest/config" />
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
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
    coverage: {
      reporter: ['text', 'html', 'clover', 'json'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        '_figma/**',
        'src/**/*.stories.*',
        'src/stories/**',
        '**/*.stories.*',
      ],
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
