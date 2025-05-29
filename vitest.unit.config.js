import { defineConfig, mergeConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const baseConfig = {
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      './tests/setup/vitest.setup.js',
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
      '**/e2e/**',
      '**/integration/**',
      '**/.{idea,git,cache,output,temp}/**',
    ],
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:5001',
      },
    },
    alias: [
      {
        find: /^@\/(.*)$/,
        replacement: path.resolve(__dirname, './src/$1'),
      },
    ],
    server: {
      deps: {
        inline: ['axios'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/tests/**',
        '**/*.config.js',
        '**/src/main.jsx',
        '**/src/App.jsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
};

// Mock modules that cause issues in tests
const mockModules = {
  '@/utils/logger': 'tests/setup/mocks/logger.js',
  '@/services/http/OfflineModeHandler': 'tests/setup/mocks/OfflineModeHandler.js',
  'react-hot-toast': 'tests/setup/mocks/react-hot-toast.js',
  'classnames': 'tests/setup/mocks/classnames.js',
  '@/services/auth/tokenStorage': 'tests/setup/mocks/tokenStorage.js',
};

// Add mocks to alias
Object.entries(mockModules).forEach(([modulePath, mockPath]) => {
  baseConfig.test.alias.push({
    find: modulePath,
    replacement: path.resolve(__dirname, mockPath),
  });
});

export default defineConfig(baseConfig);
