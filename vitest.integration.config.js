import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

// Workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    setupFilesAfterEnv: ['./tests/setup/integration-setup.js'],
    include: ['tests/integration/**/*.test.js'],
    testTimeout: 30000, // Increased to 30 seconds
    threads: false, // Disable threads for more reliable testing
    forceRerunTriggers: [], // Disable file watching
    watch: false, // Disable watch mode
    hookTimeout: 30000, // 30 second hook timeout
    teardownTimeout: 30000, // 30 second teardown timeout,
    environmentOptions: {
      jsdom: {
        resources: 'usable',
        runScripts: 'dangerously',
        url: 'http://localhost:5001' // Set the base URL for jsdom
      }
    },
    deps: {
      inline: ['axios']
    },
    
    // Module resolution
    alias: {
      '^@/(.*)$': path.resolve(__dirname, './src/$1'),
      '^axios$': path.resolve(__dirname, 'node_modules/axios/dist/axios.js'),
    },
    
    // Environment variables
    env: {
      NODE_ENV: 'test',
      TEST: 'true',
      API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5001/api'
    },
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      all: true,
      include: ['src/**/*.js'],
      exclude: [
        '**/*.test.js',
        '**/__mocks__/**',
        '**/__tests__/**',
        '**/node_modules/**'
      ]
    }
  },
  
  // Global resolve configuration
  resolve: {
    alias: {
      '^@/(.*)$': path.resolve(__dirname, './src/$1')
    }
  }
});
