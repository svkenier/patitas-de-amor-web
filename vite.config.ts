import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@ui': path.resolve(__dirname, './src/ui'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8788', // Proxy para Cloudflare Pages local (wrangler)
        changeOrigin: true,
      },
      '/public': {
        target: 'http://127.0.0.1:8788', // Redirigir llamadas públicas también
        changeOrigin: true,
      }
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
          'utils-vendor': ['dayjs', 'yup', 'formik', 'embla-carousel-react']
        }
      }
    }
  }
})

