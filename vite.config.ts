import path from 'path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Fixed at 4173 (Vite's conventional preview port) instead of the 5173 default —
// keynor-rpg-client also defaults to 5173, and keynor-core's CORS allowlist only
// trusts 4173/5173 for this origin. strictPort fails the server instead of silently
// picking a different port that keynor-core would then reject with a CORS error.
const DEV_PORT = 4173

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: DEV_PORT,
    strictPort: true,
  },
  preview: {
    port: DEV_PORT,
    strictPort: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
