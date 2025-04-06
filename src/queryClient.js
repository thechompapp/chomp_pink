/* src/queryClient.js */
import { QueryClient } from '@tanstack/react-query';

// Create and export the client instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes global stale time (adjust as needed)
      refetchOnWindowFocus: true, // *** CHANGED to true ***
      // Optional: Add gcTime (garbage collection time) if needed
      // gcTime: 1000 * 60 * 30, // e.g., 30 minutes
    },
    mutations: {
      // Optional: Default mutation options
      // onError: (error) => { console.error("Global mutation error:", error); },
    },
  },
});