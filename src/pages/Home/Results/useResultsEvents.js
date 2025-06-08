/**
 * Results Events Hook
 * 
 * Handles event listeners and query invalidation for results.
 * Extracted from Results.jsx for better separation of concerns.
 */

import { useEffect } from 'react';
import { logDebug } from '@/utils/logger.js';

/**
 * Hook for managing results-related events and query invalidation
 */
export const useResultsEvents = ({ contentType, queryClient }) => {
  useEffect(() => {
    if (contentType !== 'lists') return;
    
    const handleListItemAdded = (event) => {
      logDebug('[useResultsEvents] listItemAdded event detected, invalidating lists queries.', event.detail);
      queryClient.invalidateQueries({ queryKey: ['results', 'lists'], exact: false });
    };
    
    const handleFollowStateChanged = (event) => {
      logDebug('[useResultsEvents] followStateChanged event detected, invalidating lists queries.', event.detail);
      queryClient.invalidateQueries({ queryKey: ['results', 'lists'], exact: false });
    };
    
    window.addEventListener('listItemAdded', handleListItemAdded);
    window.addEventListener('followStateChanged', handleFollowStateChanged);
    
    return () => {
      window.removeEventListener('listItemAdded', handleListItemAdded);
      window.removeEventListener('followStateChanged', handleFollowStateChanged);
    };
  }, [contentType, queryClient]);

  // This hook doesn't return anything as it only manages side effects
  return null;
};

export default useResultsEvents; 