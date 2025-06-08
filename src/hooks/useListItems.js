import { useMemo, useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listService } from '@/services/listService';
import { engagementService } from '@/services/engagementService';
import { logDebug, logError } from '@/utils/logger';

/**
 * Loads and manages list items data with expandable/collapsible functionality
 * 
 * @param {string|number} listId - ID of the list to load items for
 * @param {Object} options - Configuration options
 * @param {boolean} options.initialExpanded - Whether the list starts expanded (default: false)
 * @param {number} options.previewLimit - Number of items to show in preview mode (default: 3)
 * @param {number} options.expandedLimit - Number of items to show in expanded mode (default: 50)
 * @returns {Object} Object containing list items data, loading states, and toggle functions
 */
export function useListItems(listId, { 
  initialExpanded = false,
  previewLimit = 3,
  expandedLimit = 50
} = {}) {
  // Track expanded state
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  
  // Query for preview items (not expanded)
  const {
    data: previewItemsData,
    isLoading: isLoadingPreview,
    error: previewError,
    refetch: refetchPreview
  } = useQuery({
    queryKey: ['listPreviewItems', listId],
    queryFn: () => listService.getListItems(listId, { limit: previewLimit }),
    enabled: !!listId && !isExpanded,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (response) => {
      // Handle different response shapes - the API returns { success: true, data: [...] }
      if (!response) return [];
      
      // If response.data exists and is an array, use it
      if (response.data && Array.isArray(response.data)) {
        return response.data.slice(0, previewLimit);
      }
      
      // If response itself is an array (fallback)
      if (Array.isArray(response)) {
        return response.slice(0, previewLimit);
      }
      
      return [];
    },
    placeholderData: [],
  });

  // Query for full list items (when expanded)
  const {
    data: fullItemsData,
    isLoading: isLoadingFull,
    error: fullError,
    refetch: refetchFull
  } = useQuery({
    queryKey: ['listFullItems', listId, 'expanded'],
    queryFn: () => listService.getListItems(listId, { limit: expandedLimit }),
    enabled: !!listId && isExpanded,
    staleTime: 2 * 60 * 1000, // 2 minutes
    select: (response) => {
      // Handle different response shapes - the API returns { success: true, data: [...] }
      if (!response) return [];
      
      // If response.data exists and is an array, use it
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      // If response itself is an array (fallback)
      if (Array.isArray(response)) {
        return response;
      }
      
      return [];
    },
    placeholderData: [],
  });
  
  // Current items to display based on expanded state
  const items = useMemo(() => 
    isExpanded ? (fullItemsData || []) : (previewItemsData || []), 
    [isExpanded, fullItemsData, previewItemsData]
  );
  
  // Loading state based on current view mode
  const isLoading = isExpanded ? isLoadingFull : isLoadingPreview;
  
  // Error state based on current view mode
  const error = isExpanded ? fullError : previewError;
  
  // Handler for toggling expanded state with engagement logging
  const toggleExpand = useCallback((e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setIsExpanded(prev => {
      const newState = !prev;
      
      // Log the expand/collapse event
      if (listId) {
        engagementService.logEngagement({
          item_id: parseInt(String(listId), 10),
          item_type: 'list',
          engagement_type: newState ? 'expand_preview' : 'collapse_preview',
        }).catch(err => {
          logError('[useListItems] Failed to log expand/collapse engagement:', err);
        });
      }
      
      return newState;
    });
  }, [listId]);
  
  // Force refresh of current items data
  const refreshItems = useCallback(() => {
    if (isExpanded) {
      return refetchFull();
    } else {
      return refetchPreview();
    }
  }, [isExpanded, refetchFull, refetchPreview]);
  
  // Calculate if there are more items than shown in preview
  const hasMoreThanPreview = useMemo(() => {
    // If we have both preview and full data, compare lengths
    if (previewItemsData && fullItemsData) {
      return fullItemsData.length > previewItemsData.length;
    }
    
    // If we only have preview data but know the total count
    if (previewItemsData && previewItemsData.length >= previewLimit) {
      return true;
    }
    
    return false;
  }, [previewItemsData, fullItemsData, previewLimit]);
  
  return {
    items,
    previewItems: previewItemsData || [],
    fullItems: fullItemsData || [],
    isLoading,
    isLoadingPreview,
    isLoadingFull,
    error,
    isExpanded,
    setIsExpanded,
    toggleExpand,
    refreshItems,
    hasMoreThanPreview
  };
}

export default useListItems; 