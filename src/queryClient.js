// src/queryClient.js
import { QueryClient } from '@tanstack/react-query';

// Create and export the client instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes global stale time
      refetchOnWindowFocus: false,
    },
  },
});