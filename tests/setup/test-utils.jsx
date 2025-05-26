/**
 * Test Utilities
 * 
 * Helper functions and custom render methods for testing.
 * Provides consistent test setup with necessary providers.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/auth/context/AuthContext';

// Create a custom render method that includes providers
const customRender = (ui, options = {}) => {
  // Create a fresh Query Client for each test
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });
  
  const AllProviders = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
  
  return render(ui, { wrapper: AllProviders, ...options });
};

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override the render method
export { customRender as render };

/**
 * Mock API response
 * @param {Object} data - Response data
 * @param {number} status - HTTP status code
 * @param {Object} headers - Response headers
 * @returns {Object} Mock response object
 */
export const mockApiResponse = (data, status = 200, headers = {}) => ({
  data,
  status,
  headers,
  ok: status >= 200 && status < 300,
});

/**
 * Create a mock event object
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock event object
 */
export const mockEvent = (overrides = {}) => ({
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  target: { value: '' },
  ...overrides,
});

/**
 * Wait for a specified time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after the specified time
 */
export const waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock local storage for tests
 */
export const mockLocalStorage = () => {
  const store = {};
  
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((key) => {
        delete store[key];
      });
    }),
  };
};
