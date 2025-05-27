// Setup file for testing React hooks
import { renderHook as rtlRenderHook } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Create a test-utils file
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {},
    },
  });
};

export function renderHook(
  callback,
  {
    wrapper: Wrapper,
    queryClient,
    ...options
  } = {}
) {
  const TestWrapper = ({ children }) => {
    const testQueryClient = queryClient || createTestQueryClient();
    
    const wrapper = Wrapper ? (
      <Wrapper>{children}</Wrapper>
    ) : (
      <QueryClientProvider client={testQueryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    );
    
    return wrapper;
  };

  return rtlRenderHook(callback, {
    wrapper: TestWrapper,
    ...options,
  });
}

// Re-export everything
export * from '@testing-library/react-hooks';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({}),
    useParams: () => ({}),
  };
});

// Mock react-query
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn().mockImplementation((...args) => {
      const actualUseQuery = actual.useQuery;
      return actualUseQuery(...args);
    }),
    useMutation: vi.fn().mockImplementation((...args) => {
      const actualUseMutation = actual.useMutation;
      return actualUseMutation(...args);
    }),
  };
});
