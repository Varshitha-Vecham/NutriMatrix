import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Keep browser API calls on the Vite origin in development.  The proxy reads
// API_PORT from .env, so changing the backend port cannot leave the client
// pointing at the OCR service (which also uses port 5001).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiPort = env.API_PORT || '5001'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      open: true,
      proxy: {
        '/api': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true
        }
      }
    }
  }
})
