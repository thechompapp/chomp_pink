import { useState, useEffect, useCallback } from 'react';
import { getLoadingState, subscribeToLoadingState } from '../interceptors/loadingInterceptor';

/**
 * Hook to access HTTP loading state in React components
 * @returns {Object} Loading state and utility functions
 */
export const useHttpLoading = () => {
  const [loadingState, setLoadingState] = useState(getLoadingState());

  // Subscribe to loading state changes
  useEffect(() => {
    const unsubscribe = subscribeToLoadingState(setLoadingState);
    return () => unsubscribe();
  }, []);

  // Check if a specific URL is loading
  const isLoadingUrl = useCallback(
    (url) => {
      if (!url) return false;
      return loadingState.loadingByUrl.has(url);
    },
    [loadingState.loadingByUrl]
  );

  return {
    // Current loading state
    isLoading: loadingState.isLoading,
    pending: loadingState.pending,
    loadingByUrl: loadingState.loadingByUrl,
    lastActivity: loadingState.lastActivity,
    
    // Utility functions
    isLoadingUrl,
    getLoadingState: useCallback(() => loadingState, [loadingState])
  };
};

// For backward compatibility
export default useHttpLoading;
