import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      './tests/setup/vitest.setup.js', // Our new setup file
      '@testing-library/jest-dom/vitest',
    ],
    setupFilesAfterEnv: [
      './tests/setup/test-utils.jsx', // Our test utilities
    ],
    include: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
    ],
    // Mock browser globals
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:5001',
      },
    },
    // Mock modules
    alias: [

      {
        find: 'react-hot-toast',
        replacement: path.resolve(__dirname, './tests/setup/mocks/react-hot-toast.js'),
      },

    ],
    server: {
      deps: {
        inline: ['axios'],
      },
    },
    // Handle axios ESM imports
    deps: {
      inline: ['axios'],
      interopDefault: false,
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/tests/**',
        '**/mocks/**',
        '**/setupTests.js',
        '**/*.config.js',
        '**/*.test.js',
        '**/test-utils/**',
      ],
      exclude: [
        'node_modules/',
        '**/*.test.js',
        '**/*.spec.js',
        '**/tests/**',
        '**/__mocks__/**',
        '**/test-utils/**',
        '**/testUtils.*',
        '**/setup/**',
      ],
      include: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!src/__tests__/**',
      ],
      all: true,
      // Add thresholds for test coverage
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    testTimeout: 30000, // Increase timeout for API tests
    include: [
      '**/tests/unit/**/*.test.{js,jsx,ts,tsx}',
      '**/tests/integration/**/*.test.{js,jsx,ts,tsx}',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Add any additional aliases needed for testing
    },
  },
  server: {
    port: 5173, // Match the expected port from CORS settings
    // Enable CORS for testing
    cors: true,
  },
});
