import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  optimizeDeps: {
    include: ["react-leaflet", "leaflet"],
  },
  preview: {
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    strictPort: false,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'evenpappfrontend-production.up.railway.app',
      '.railway.app'
    ]
  },
  server: {
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
    strictPort: false,
    open: false,
    proxy: {
      '/api': {
        // Use production API by default, can be overridden with VITE_PROXY_TARGET env var
        target: process.env.VITE_PROXY_TARGET || 'https://apimarketplace.whiz-cloud.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path // Keep the path as-is since it already includes /api/v1
      }
    },
    fs: {
      strict: false,
      allow: ['..']
    },
    middlewareMode: false
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  }
})
