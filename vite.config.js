import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite config for NutriMatrix React project
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
})
