import { render } from '@testing-library/react';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

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

// Helper to simulate successful API responses
export const mockApiResponse = (method, response, options = {}) => {
  const { path = '*', status = 200, delay = 0 } = options;
  const mock = vi.fn().mockImplementationOnce(() => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: response,
          status,
          statusText: 'OK',
          headers: {},
          config: {},
        });
      }, delay);
    });
  });
  
  const apiClient = require('@/services/apiClient');
  apiClient[method].mockImplementation(mock);
  
  return mock;
};

// Helper to simulate API errors
export const mockApiError = (method, error, options = {}) => {
  const { path = '*', status = 500 } = options;
  const mock = vi.fn().mockRejectedValueOnce({
    response: {
      status,
      data: { error: error.message || 'An error occurred' },
    },
    isAxiosError: true,
  });
  
  const apiClient = require('@/services/apiClient');
  apiClient[method].mockImplementation(mock);
  
  return mock;
};
