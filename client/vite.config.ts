import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // "@/..." means "src/..." (keep in sync with tsconfig.app.json "paths")
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
