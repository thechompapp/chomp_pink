import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';

// Create a custom render function that includes all providers
export function renderWithProviders(
  ui,
  {
    preloadedState = {},
    route = '/',
    ...renderOptions
  } = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <ThemeProvider>
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// Re-export everything from RTL
export * from '@testing-library/react';

// Override render method
export { renderWithProviders as render };

// Helper to create a test store
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import useAuthenticationStore from '@/stores/auth/useAuthenticationStore';

// Create a test version of the store that can be used outside of React components
export const createTestStore = (initialState = {}) => {
  return create(
    devtools(
      persist(
        (set, get) => ({
          // Default state
          isAuthenticated: false,
          user: null,
          token: null,
          isLoading: false,
          error: null,
          initialized: false,
          
          // Actions
          setUser: (user, token) => set({ user, token, isAuthenticated: !!user }),
          setLoading: (isLoading) => set({ isLoading }),
          setError: (error) => set({ error }),
          reset: () => set({
            isAuthenticated: false,
            user: null,
            token: null,
            isLoading: false,
            error: null,
          }),
          
          // Mock implementations of store methods
          login: async (credentials) => {
            set({ isLoading: true, error: null });
            try {
              // This would be mocked in tests
              return Promise.resolve({ user: { id: '1', ...credentials }, token: 'test-token' });
            } catch (error) {
              set({ error });
              throw error;
            } finally {
              set({ isLoading: false });
            }
          },
          
          logout: async () => {
            set({ isLoading: true });
            try {
              // This would be mocked in tests
              return Promise.resolve();
            } finally {
              set({
                isAuthenticated: false,
                user: null,
                token: null,
                isLoading: false,
              });
            }
          },
          
          // Add any other store methods needed for testing
          ...initialState,
        }),
        {
          name: 'test-auth-storage',
          getStorage: () => ({
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          }),
        }
      )
    )
  );
};
