/**
 * Results Data Hook
 * 
 * Handles data fetching for search results with infinite scrolling.
 * Extracted from Results.jsx for better separation of concerns.
 */

import { useCallback, useState, useMemo } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { listService } from '@/services/listService.js';
import { searchService } from '@/services/searchService.js';
import { logDebug, logError, logWarn } from '@/utils/logger.js';
import { isOfflineMode } from '@/services/api';

const RESULTS_PER_PAGE = 25;

/**
 * Hook for managing results data fetching with infinite scrolling
 */
export const useResultsData = ({
  cityId,
  boroughId,
  neighborhoodId,
  hashtags,
  contentType,
  searchQuery
}) => {
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState(null);

  // Enhanced fetch function with better error handling
  const fetchFunction = useCallback(async ({ pageParam = 1 }) => {
    logDebug(`[useResultsData] Fetching page ${pageParam} for type: ${contentType}, query: '${searchQuery}'`);
    
    // Clear previous errors when starting a new fetch
    setApiError(null);
    
    const limit = RESULTS_PER_PAGE;
    
    // Check if we're offline and handle accordingly
    if (isOfflineMode()) {
      logWarn('[useResultsData] Device is offline, returning cached data if available');
      return {
        success: true,
        data: [],
        pagination: { page: pageParam, limit, total: 0, totalPages: 0 },
        hasMore: false,
        page: pageParam,
        message: 'Device is offline. Some content may not be available.',
        isOffline: true
      };
    }
    
    try {
      let response;
      let items = [];
      let total = 0;
      let responsePagination = null;
      let success = false;
      let message = '';

      if (contentType === 'lists') {
        const params = {
          page: pageParam, 
          limit, 
          cityId, 
          boroughId, 
          neighborhoodId, 
          hashtags: hashtags || [],
          searchTerm: searchQuery,
          isPublic: true,
          sortBy: 'popularity',
          sortOrder: 'desc'
        };
        
        logDebug('[useResultsData] Fetching public lists with params:', params);
        
        // Add timeout to prevent hanging requests
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timed out')), 15000);
        });
        
        response = await Promise.race([
          listService.getLists(params),
          timeoutPromise
        ]);
        
        logDebug('[useResultsData] Received lists service response:', response);

        success = response?.success ?? false;
        message = response?.message || (success ? 'Lists fetched' : 'Failed to fetch lists');
        items = Array.isArray(response?.data) ? response.data : [];
        responsePagination = response?.pagination;
        total = responsePagination?.total ?? items.length;

      } else {
        // Handle restaurants and dishes via searchService
        const offset = (pageParam - 1) * limit;
        
        // Filter out null/undefined values to avoid sending invalid parameters
        const cleanFilters = {};
        if (cityId != null) cleanFilters.cityId = cityId;
        if (boroughId != null) cleanFilters.boroughId = boroughId;
        if (neighborhoodId != null) cleanFilters.neighborhoodId = neighborhoodId;
        if (hashtags && hashtags.length > 0) cleanFilters.hashtags = hashtags;
        
        const params = { 
          q: searchQuery, 
          type: contentType, 
          limit, 
          offset,
          ...cleanFilters
        };
        
        logDebug(`[useResultsData] Fetching ${contentType} with searchService params:`, params);
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timed out')), 15000);
        });
        
        response = await Promise.race([
          searchService.search(params),
          timeoutPromise
        ]);
        
        logDebug(`[useResultsData] Received ${contentType} service response:`, response);
        
        success = response?.success ?? (response?.[contentType] != null);
        message = response?.message || (success ? `${contentType} fetched` : `Failed to fetch ${contentType}`);
        items = Array.isArray(response?.[contentType]) ? response[contentType] : [];
        
        const totalKey = `total${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`;
        total = response?.[totalKey] ?? items.length;
        
        responsePagination = { 
          page: pageParam, 
          limit, 
          total, 
          totalPages: Math.ceil(total / limit) 
        };
      }
      
      // If we got an empty response but expected data, treat as partial error
      if (success && items.length === 0 && pageParam === 1) {
        logWarn(`[useResultsData] Received empty ${contentType} results on first page`);
      }
        
      const returnValue = {
        success,
        data: items,
        pagination: responsePagination || { page: pageParam, limit, total, totalPages: Math.ceil(total / limit) },
        hasMore: (pageParam * limit) < total,
        page: pageParam,
        message
      };
      
      logDebug('[useResultsData] fetchFunction returning:', {
        success: returnValue.success,
        dataType: Array.isArray(returnValue.data) ? 'array' : typeof returnValue.data,
        dataLength: Array.isArray(returnValue.data) ? returnValue.data.length : 'not array',
        firstItemKeys: Array.isArray(returnValue.data) && returnValue.data.length > 0 && returnValue.data[0] ? 
          Object.keys(returnValue.data[0]).slice(0, 5) : 'no items'
      });
        
      return returnValue;
      
    } catch (error) {
      // Store the error for UI feedback
      setApiError({
        message: error.message || `Failed to fetch ${contentType}`,
        retryable: true,
        contentType
      });
      
      logError(`[useResultsData] Error in fetchFunction for ${contentType}:`, error);
      
      // Check if this is a URL-related error
      const isUrlError = error.message && (
        error.message.includes('undefined (reading \'url\')') ||
        error.message.includes('URL is required')
      );
      
      if (isUrlError) {
        logError('[useResultsData] URL-related error detected. This may be an API client configuration issue.');
      }
      
      return {
        success: false,
        data: [],
        pagination: { page: pageParam, limit: RESULTS_PER_PAGE, total: 0, totalPages: 0 },
        message: error.message || `Failed to fetch ${contentType} due to an unexpected error.`,
        error: true,
        page: pageParam,
        hasMore: false,
        isUrlError
      };
    }
  }, [contentType, searchQuery, cityId, boroughId, neighborhoodId, hashtags]);

  // Infinite query
  const {
    data, 
    error: infiniteQueryError,
    fetchNextPage, 
    hasNextPage, 
    isLoading, 
    isFetching,
    isFetchingNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: ['results', contentType, searchQuery, cityId, boroughId, neighborhoodId, JSON.stringify(hashtags || [])],
    queryFn: fetchFunction,
    getNextPageParam: (lastPage) => {
      if (lastPage && lastPage.success && lastPage.hasMore) {
        logDebug('[useResultsData:getNextPageParam] Requesting next page:', lastPage.page + 1);
        return lastPage.page + 1;
      }
      logDebug('[useResultsData:getNextPageParam] No more pages. Last page:', lastPage);
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
  });

  // Process pages into items
  const { items, totalItems, processedPageError } = useMemo(() => {
    if (infiniteQueryError) {
      logError(`[useResultsData:useMemo] Error from useInfiniteQuery hook:`, infiniteQueryError);
      return { items: [], totalItems: 0, processedPageError: infiniteQueryError.message || `Failed to load ${contentType}.` };
    }

    if (!data || !data.pages || data.pages.length === 0) {
      logDebug('[useResultsData:useMemo] No data or empty pages array.');
      return { items: [], totalItems: 0, processedPageError: null };
    }

    logDebug('[useResultsData:useMemo] Processing data pages. Page count:', data.pages.length);

    let accumulatedItems = [];
    let pageLevelErrorMessage = null;

    for (const page of data.pages) {
      if (!page) {
        logWarn('[useResultsData:useMemo] Encountered an undefined page.');
        continue;
      }
      
      if (page.success === false) {
        if (!pageLevelErrorMessage) {
          pageLevelErrorMessage = page.message || `An error occurred while loading some ${contentType}.`;
          logError(`[useResultsData:useMemo] Page-level error: ${pageLevelErrorMessage}`, page);
        }
        if (Array.isArray(page.data)) accumulatedItems.push(...page.data);
      } else if (Array.isArray(page.data)) {
        accumulatedItems.push(...page.data);
      } else {
        logWarn('[useResultsData:useMemo] Page data is not an array or page was unsuccessful without message:', page);
      }
    }

    const firstPage = data.pages[0];
    const currentTotalItems = firstPage?.pagination?.total ?? accumulatedItems.length;

    logDebug(`[useResultsData:useMemo] Extracted ${accumulatedItems.length} items. Total according to pagination: ${currentTotalItems}. Page-level error: ${pageLevelErrorMessage}`);

    return {
      items: accumulatedItems,
      totalItems: currentTotalItems,
      processedPageError: pageLevelErrorMessage,
    };
  }, [data, infiniteQueryError, contentType]);

  return {
    // Data
    items,
    totalItems,
    
    // Query state
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    
    // Error states
    apiError,
    infiniteQueryError,
    processedPageError,
    
    // Actions
    fetchNextPage,
    hasNextPage,
    refetch,
    setApiError,
    
    // Query client for invalidation
    queryClient,
    
    // Constants
    RESULTS_PER_PAGE
  };
};

export default useResultsData; 