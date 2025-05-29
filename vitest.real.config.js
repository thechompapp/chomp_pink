import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      './tests/setup/real-setup.js',
      '@testing-library/jest-dom/vitest',
    ],
    setupFilesAfterEnv: [
      './tests/setup/test-utils.jsx',
    ],
    include: ['**/*.test.{js,jsx,ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
    ],
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:5001',
      },
    },
    server: {
      deps: {
        inline: ['axios'],
      },
    },
    testTimeout: 30000, // Increased timeout for API calls
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
