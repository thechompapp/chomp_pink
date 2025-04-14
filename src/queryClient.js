/* src/queryClient.js */
/* REMOVED: TypeScript type annotations */
import { QueryClient } from '@tanstack/react-query';

// Define options without types
const queryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes global stale time
      refetchOnWindowFocus: true,
      // REMOVED: Type annotations for failureCount and error
      retry: (failureCount, error) => {
        // Don't retry on 404 or 401/403 errors globally
        // Use optional chaining ?. for safer access
        const status = error?.status;
        if (status === 404 || status === 401 || status === 403) {
          return false;
        }
        // Retry once by default
        return failureCount < 1;
      },
    },
    mutations: {
      // Optional global error handler for mutations
      // REMOVED: Type annotation for error
      onError: (error) => {
        console.error('[QueryClient] Global mutation error:', error?.message || error);
      },
    },
  },
};

// Create and export the client instance
export const queryClient = new QueryClient(queryClientOptions);