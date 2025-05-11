/* src/queryClient.js */
/* REMOVED: TypeScript type annotations */
import { QueryClient } from '@tanstack/react-query';
import { logInfo } from '@/utils/logger';

// Define the query client options
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

// Helper function to invalidate queries with logging and better error handling
export const invalidateQueries = async (queryKey) => {
  try {
    logInfo(`[QueryClient] Invalidating queries with key:`, queryKey);
    // Make sure we pass the queryKey in the expected format
    const formattedQueryKey = Array.isArray(queryKey) ? queryKey : [queryKey];
    await queryClient.invalidateQueries({ queryKey: formattedQueryKey });
    logInfo(`[QueryClient] Successfully invalidated queries with key:`, formattedQueryKey);
    return true;
  } catch (error) {
    logInfo(`[QueryClient] Error invalidating queries with key ${JSON.stringify(queryKey)}:`, error);
    // Don't throw, just return false so the calling code can continue
    return false;
  }
};