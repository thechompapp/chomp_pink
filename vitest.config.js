import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node', // Changed from 'jsdom' to 'node' for API tests
    setupFiles: ['./tests/setup.js'],
    setupFilesAfterEnv: ['./tests/setup/integration-setup.js'],
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
        'node_modules/',
        '**/*.test.js',
        '**/*.spec.js',
        '**/tests/**',
        '**/__mocks__/**',
        '**/test-utils/**',
        '**/testUtils.*',
      ],
      include: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!src/__tests__/**',
      ],
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
    },
  },
  server: {
    port: 5173, // Match the expected port from CORS settings
  },
});
