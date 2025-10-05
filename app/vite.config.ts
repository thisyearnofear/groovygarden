import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Simplified config for hackathon - removed custom plugins causing startup hang
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
  },
})
