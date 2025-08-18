import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [TanStackRouterVite(), react(), tailwindcss()],

  // CRITICAL for IPFS: Use relative paths
  base: './',

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

  // Development server
  server: {
    port: 3000,
    strictPort: false,
    open: true,
  },

  // Preview server (for testing production builds)
  preview: {
    port: 4173,
    strictPort: false,
  },
}))
