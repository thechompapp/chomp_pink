/* src/queryClient.ts */
import { QueryClient, QueryClientConfig } from '@tanstack/react-query';

// Define options with types (optional, but good practice)
const queryClientOptions: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes global stale time
      refetchOnWindowFocus: true,
      // Optional: Add gcTime (garbage collection time) if needed
      // gcTime: 1000 * 60 * 30, // e.g., 30 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 404 or 401/403 errors globally
        // Individual queries can override this
        if (error?.status === 404 || error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Default retry count (e.g., retry 1 time)
        return failureCount < 1;
      }
    },
    mutations: {
      // Optional: Default mutation options
      // onError: (error: any) => { console.error("Global mutation error:", error?.message || error); },
    },
  },
};


// Create and export the client instance
export const queryClient = new QueryClient(queryClientOptions);