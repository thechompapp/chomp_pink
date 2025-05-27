import React from 'react';
import { render } from '@testing-library/react';
import { renderHook as rtlRenderHook } from '@testing-library/react-hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Create a wrapper component with all necessary providers
const createWrapper = (options = {}) => {
  const { queryClient } = options;
  
  return function Wrapper({ children }) {
    const client = queryClient || new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
        },
      },
    });

    return (
      <QueryClientProvider client={client}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    );
  };
};

// Custom render hook with providers
const renderHook = (hook, options = {}) => {
  const wrapper = createWrapper(options);
  return rtlRenderHook(hook, { wrapper, ...options });
};

export * from '@testing-library/react-hooks';
export { renderHook };
