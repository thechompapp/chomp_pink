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

