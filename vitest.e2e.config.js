import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup/global-setup.js'],
    testTimeout: 60000, // 60 seconds for E2E tests
    include: ['**/tests/e2e/**/*.test.{js,jsx,ts,tsx}'],
    exclude: ['node_modules/**'],
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
