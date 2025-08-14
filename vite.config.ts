import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],

  // CRITICAL for IPFS: Use relative paths
  base: './',

  // Path resolution for aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@utils': path.resolve(__dirname, './src/lib/utils'),
      '@constants': path.resolve(__dirname, './src/lib/constants'),
      '@types': path.resolve(__dirname, './src/types'),
      '@routes': path.resolve(__dirname, './src/routes'),
      '@features': path.resolve(__dirname, './src/features'),
      '@assets': path.resolve(__dirname, './src/assets'),
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
