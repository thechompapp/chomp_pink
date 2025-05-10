/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Add proxy configuration to handle CORS issues
  server: {
    proxy: {
      // Proxy API requests to the backend server
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        // Rewrite path to remove /api prefix for backend
        // Comment this out if backend already expects /api prefix
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    // --- Add this 'deps' section ---
    deps: {
      // Force React and related libraries to be processed by Vite during tests
      inline: ['react', 'react-dom', '@testing-library/react'],
      // Alternatively, a broader rule (might be slower):
      // inline: [/^(?!.*vitest).*$/]
    }
    // --- End of 'deps' section ---
  },
})

