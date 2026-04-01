import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'frontend',
      'localhost',
      '127.0.0.1',
      'nginx'
    ],
    hmr: {
      overlay: false,
    },
    host: '0.0.0.0',
    port: 5173,
    // --- ADD PROXY CONFIG ---
    proxy: {
      '/api': {
        target: 'http://backend:8000', // Docker service name
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
