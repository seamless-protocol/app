import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { execSync } from 'node:child_process'

function resolveCommitHash(): string {
  try {
    const hash = execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
    return hash
  } catch {
    // Fallback to env-provided commit if available
    return (
      process.env['VITE_COMMIT_SHA'] ||
      process.env['VERCEL_GIT_COMMIT_SHA'] ||
      process.env['GITHUB_SHA'] ||
      ''
    )
  }
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [tanstackRouter(), react(), tailwindcss()],

  // CRITICAL: Use absolute paths for development, relative for IPFS production builds
  base: command === 'serve' ? '/' : './',

  // Path resolution for aliases
  resolve: {
    alias: {
      '@': path.resolve('./src'),
      '@components': path.resolve('./src/components'),
      '@hooks': path.resolve('./src/hooks'),
      '@lib': path.resolve('./src/lib'),
      '@utils': path.resolve('./src/lib/utils'),
      '@constants': path.resolve('./src/lib/constants'),
      '@types': path.resolve('./src/types'),
      '@routes': path.resolve('./src/routes'),
      '@features': path.resolve('./src/features'),
      '@assets': path.resolve('./src/assets'),
    },
  },

  // Build optimizations for IPFS
  build: {
    // Smaller chunks for better IPFS performance
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          router: ['@tanstack/react-router'],
          blockchain: ['wagmi', 'viem'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
    // Generate source maps for error tracking (dev only, not production IPFS)
    sourcemap: mode !== 'production',
    // Asset inlining threshold
    assetsInlineLimit: 4096,
  },

  // Inject build metadata
  define: {
    __APP_COMMIT_HASH__: JSON.stringify(resolveCommitHash()),
  },

  // Development server
  server: {
    port: 3000,
    strictPort: false,
    // Ensure predictable binding for Playwright; disable auto-open in tests
    host: process.env['VITE_TEST_MODE'] ? '127.0.0.1' : true,
    open: process.env['VITE_TEST_MODE'] ? false : true,
  },

  // Preview server (for testing production builds)
  preview: {
    port: 4173,
    strictPort: false,
  },
}))
