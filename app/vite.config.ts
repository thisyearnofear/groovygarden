import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Web3-optimized Vite config for Base ecosystem
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    hmr: {
      overlay: false
    },
    // Web3 wallet connection support - Base Account SDK requirements
    headers: {
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
  // Optimize for Web3 libraries
  optimizeDeps: {
    include: [
      '@base-org/account',
      // Add other Web3 libraries as needed
    ],
  },
  build: {
    // Web3 apps often have larger bundles
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate Web3 libraries for better caching
          'web3-vendor': ['@base-org/account'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
  // Define global constants for Web3
  define: {
    global: 'globalThis',
  },
})
