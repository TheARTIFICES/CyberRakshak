import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    allowedHosts: [
      'frontend',
      'localhost',
      '127.0.0.1',
      'nginx',
      'cyberrakshak.govt.hu',
      '.cyberrakshak.govt.hu'
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
