import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import * as apiClient from '@/services/apiClient';

// Create a test query client
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {},
    },
  });
};

export const renderWithProviders = (
  ui,
  {
    initialAuthState = {},
    initialRoute = '/',
    queryClient,
    ...renderOptions
  } = {}
) => {
  const testQueryClient = queryClient || createTestQueryClient();

  const Wrapper = ({ children }) => (
    <QueryClientProvider client={testQueryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthProvider initialAuthState={initialAuthState}>
          {children}
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    testQueryClient,
  };
};

// Helper to wait for loading states
export const waitForLoading = async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
};

/**
 * Helper to simulate successful API responses
 * @param {string} method - The API client method to mock (e.g., 'get', 'post')
 * @param {any} response - The response data or function that returns the response
 * @param {Object} options - Configuration options
 * @param {string} [options.path='*'] - The API path to match
 * @param {number} [options.delay=0] - Delay in milliseconds before resolving the promise
 * @returns {import('vitest').Mock} The mock function
 */
export const mockApiResponse = (method, response, options = {}) => {
  const { path = '*', delay = 0 } = options;
  const mock = vi.fn().mockImplementation((...args) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Check if the path matches if provided
        if (path !== '*' && args[0] !== path) {
          resolve({
            data: null,
            status: 404,
            statusText: 'Not Found',
            headers: {},
            config: { url: args[0] },
          });
          return;
        }
        resolve({
          data: typeof response === 'function' ? response(...args) : response,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: { url: args[0] },
        });
      }, delay);
    });
  });
  
  // Mock the specified method on the API client
  vi.spyOn(apiClient, method).mockImplementation(mock);
  
  return mock;
};

/**
 * Helper to simulate API errors
 * @param {string} method - The API client method to mock
 * @param {Error} error - The error to throw
 * @param {Object} options - Configuration options
 * @param {string} [options.path='*'] - The API path to match
 * @param {number} [options.status=500] - The HTTP status code to return
 * @returns {import('vitest').Mock} The mock function
 */
export const mockApiError = (method, error, options = {}) => {
  const { path = '*', status = 500 } = options;
  const mock = vi.fn().mockRejectedValueOnce({
    response: {
      status,
      data: { error: error.message || 'An error occurred' },
    },
    isAxiosError: true,
  });
  
  // Mock the specified method on the API client
  vi.spyOn(apiClient, method).mockImplementation(mock);
  
  return mock;
};
