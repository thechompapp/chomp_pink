import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), 'tests/.env') });

// Workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  // Use our custom test environment
  testEnvironment: './tests/setup/test-environment.js',
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    setupFilesAfterEnv: ['./tests/setup/integration-setup.js'],
    include: ['tests/integration/**/*.test.js'],
    testTimeout: 30000,
    
    // Configure module resolution
    alias: {
      '^axios$': path.resolve(__dirname, 'node_modules/axios/dist/axios.js'),
      '^@/(.*)$': path.resolve(__dirname, './src/$1'),
    },
    
    // Handle ESM/CJS interop
    deps: {
      inline: [
        'axios',
        'node-fetch',
        '@testing-library/dom',
        '@testing-library/react',
        '@testing-library/user-event',
        '@testing-library/jest-dom'
      ],
      interopDefault: true,
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
      ],
      include: [
        'src/**/*.{js,jsx,ts,tsx}',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
