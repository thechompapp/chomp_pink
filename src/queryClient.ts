/* src/queryClient.ts */
import { QueryClient } from '@tanstack/react-query';

// Define options with types for consistency
const queryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes global stale time
      refetchOnWindowFocus: true,
      retry: (failureCount: number, error: any) => {
        // Don't retry on 404 or 401/403 errors globally
        if (error?.status === 404 || error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Retry once by default
        return failureCount < 1;
      },
    },
    mutations: {
      // Optional global error handler for mutations
      onError: (error: any) => {
        console.error('[QueryClient] Global mutation error:', error?.message || error);
      },
    },
  },
};

// Create and export the client instance
export const queryClient = new QueryClient(queryClientOptions);