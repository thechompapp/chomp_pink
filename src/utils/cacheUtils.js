import { useQueryClient } from '@tanstack/react-query';

/**
 * Utility to invalidate all React Query caches to force fresh data fetching
 * @returns {Function} Function to invalidate caches
 */
export const useInvalidateCaches = () => {
  const queryClient = useQueryClient();
  
  const invalidateAllCaches = () => {
    queryClient.invalidateQueries();
    console.log('[CacheUtils] All caches invalidated');
  };
  
  return invalidateAllCaches;
};

/**
 * Function to invalidate caches from a non-hook context
 */
export const invalidateCaches = () => {
  // This would typically be used in a context where useQueryClient is accessible
  // For now, we'll log a message to indicate intent
  console.log('[CacheUtils] Request to invalidate caches - should be called from a component with access to queryClient');
}; 