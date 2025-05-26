/* src/pages/Home/Results.jsx */
import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import AddIcon from '@mui/icons-material/Add';
import { Link } from 'react-router-dom';
import InfiniteScroll from 'react-infinite-scroll-component';

// Import services
import { listService } from '@/services/listService.js';
import { searchService } from '@/services/searchService.js';

// Import utilities
import { logDebug, logError, logWarn } from '@/utils/logger.js';
import { isOfflineMode } from '@/services/api';

// Import stores and context
import useFollowStore from '@/stores/useFollowStore';
import { useQuickAdd } from '@/context/QuickAddContext';

// Import UI components
import CardFactory from '@/components/UI/CardFactory.jsx';
import ListCardSkeleton from '@/pages/Lists/ListCardSkeleton.jsx';
import RestaurantCardSkeleton from '@/components/UI/RestaurantCardSkeleton.jsx';
import DishCardSkeleton from '@/components/UI/DishCardSkeleton.jsx';

const ItemSkeleton = ({ type }) => {
  switch (type) {
    case 'lists':
      return <ListCardSkeleton />;
    case 'restaurants':
      return <RestaurantCardSkeleton />;
    case 'dishes':
      return <DishCardSkeleton />;
    default:
      // Fallback skeleton with matching grid styles
      return <div className="border dark:border-gray-700 p-4 rounded-lg shadow-sm bg-gray-100 dark:bg-gray-800 h-56 animate-pulse" />;
  }
};

const Results = ({ cityId, boroughId, neighborhoodId, hashtags, contentType, searchQuery }) => {
  const RESULTS_PER_PAGE = 25;
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (contentType === 'lists') {
      localStorage.removeItem('use_mock_data'); // Assuming this is for debugging specific scenarios
      logDebug('[Results] Ensuring real data mode for lists.');
    }
  }, [contentType]);
  
  const { openQuickAdd } = useQuickAdd();
  const { initializeFollowedLists } = useFollowStore();

  // Track API errors for better user feedback
  const [apiError, setApiError] = useState(null);

  // Enhanced fetch function with better error handling
  const fetchFunction = useCallback(async ({ pageParam = 1 }) => {
    logDebug(`[Results] Fetching page ${pageParam} for type: ${contentType}, query: '${searchQuery}'`);
    
    // Clear previous errors when starting a new fetch
    setApiError(null);
    
    const limit = RESULTS_PER_PAGE;
    
    // Check if we're offline and handle accordingly
    if (isOfflineMode()) {
      logWarn('[Results] Device is offline, returning cached data if available');
      // Return empty results with offline flag
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
          view: 'all', 
          page: pageParam, 
          limit, 
          cityId, 
          boroughId, 
          neighborhoodId, 
          hashtags: hashtags || [], // Ensure hashtags is an array
          query: searchQuery
        };
        
        logDebug('[Results] Fetching lists with params:', params);
        
        // Add timeout to prevent hanging requests
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timed out')), 15000);
        });
        
        // Race between the actual request and the timeout
        response = await Promise.race([
          listService.getUserLists(params),
          timeoutPromise
        ]);
        
        logDebug('[Results] Received lists service response:', response);

        success = response?.success ?? false;
        message = response?.message || (success ? 'Lists fetched' : 'Failed to fetch lists');
        items = Array.isArray(response?.data) ? response.data : [];
        responsePagination = response?.pagination;
        total = responsePagination?.total ?? items.length;

      } else { // Handle restaurants and dishes (or other types via searchService)
        const offset = (pageParam - 1) * limit;
        const params = { 
          q: searchQuery, 
          type: contentType, 
          limit, 
          offset, 
          cityId, 
          boroughId, 
          neighborhoodId, 
          hashtags: hashtags || []
        };
        
        logDebug(`[Results] Fetching ${contentType} with searchService params:`, params);
        
        // Add timeout to prevent hanging requests
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timed out')), 15000);
        });
        
        // Race between the actual request and the timeout
        response = await Promise.race([
          searchService.search(params),
          timeoutPromise
        ]);
        
        logDebug(`[Results] Received ${contentType} service response:`, response);
        
        // Assuming searchService response is { success: true, data: { [contentType]: [], total: N } } or similar
        success = response?.success ?? (response?.data != null); // Consider successful if data is present
        message = response?.message || (success ? `${contentType} fetched` : `Failed to fetch ${contentType}`);
        items = Array.isArray(response?.data?.[contentType]) ? response.data[contentType] : [];
        total = response?.data?.total ?? items.length;
        
        // searchService might not return pagination in the same structure as listService
        responsePagination = { 
            page: pageParam, 
            limit, 
            total, 
            totalPages: Math.ceil(total / limit) 
        };
      }
      
      // If we got an empty response but expected data, treat as partial error
      if (success && items.length === 0 && pageParam === 1) {
        logWarn(`[Results] Received empty ${contentType} results on first page`);
      }
        
      return {
        success,
        data: items,
        pagination: responsePagination || { page: pageParam, limit, total, totalPages: Math.ceil(total / limit) },
        hasMore: (pageParam * limit) < total,
        page: pageParam,
        message
      };
      
    } catch (error) {
      // Store the error for UI feedback
      setApiError({
        message: error.message || `Failed to fetch ${contentType}`,
        retryable: true,
        contentType
      });
      
      logError(`[Results] Error in fetchFunction for ${contentType}:`, error);
      
      // Check if this is a URL-related error
      const isUrlError = error.message && (
        error.message.includes('undefined (reading \'url\')') ||
        error.message.includes('URL is required')
      );
      
      if (isUrlError) {
        logError('[Results] URL-related error detected. This may be an API client configuration issue.');
      }
      
      return {
        success: false,
        data: [],
        pagination: { page: pageParam, limit: RESULTS_PER_PAGE, total: 0, totalPages: 0 },
        message: error.message || `Failed to fetch ${contentType} due to an unexpected error.`,
        error: true, // Explicitly flag error
        page: pageParam,
        hasMore: false,
        isUrlError: isUrlError // Flag URL-specific errors
      };
    }
  }, [contentType, searchQuery, cityId, boroughId, neighborhoodId, hashtags]);
  
  useEffect(() => {
    if (contentType !== 'lists') return;
    
    const handleListItemAdded = (event) => {
      logDebug('[Home/Results] listItemAdded event detected, invalidating lists queries.', event.detail);
      queryClient.invalidateQueries({ queryKey: ['results', 'lists'], exact: false });
    };
    
    const handleFollowStateChanged = (event) => {
      logDebug('[Home/Results] followStateChanged event detected, invalidating lists queries.', event.detail);
      queryClient.invalidateQueries({ queryKey: ['results', 'lists'], exact: false });
    };
    
    window.addEventListener('listItemAdded', handleListItemAdded);
    window.addEventListener('followStateChanged', handleFollowStateChanged);
    
    return () => {
      window.removeEventListener('listItemAdded', handleListItemAdded);
      window.removeEventListener('followStateChanged', handleFollowStateChanged);
    };
  }, [contentType, queryClient]);

  const {
    data, 
    error: infiniteQueryError, // Error from the useInfiniteQuery hook itself
    fetchNextPage, 
    hasNextPage, 
    isLoading, 
    isFetching,
    isFetchingNextPage,
    refetch // For the retry button
  } = useInfiniteQuery({
    queryKey: ['results', contentType, searchQuery, cityId, boroughId, neighborhoodId, JSON.stringify(hashtags || [])],
    queryFn: fetchFunction,
    getNextPageParam: (lastPage) => {
      if (lastPage && lastPage.success && lastPage.hasMore) {
        logDebug('[Results:getNextPageParam] Requesting next page:', lastPage.page + 1);
        return lastPage.page + 1;
      }
      logDebug('[Results:getNextPageParam] No more pages. Last page:', lastPage);
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 1 * 60 * 1000, // 1 minute staleTime for potentially frequently changing home page results
    refetchOnWindowFocus: true, // Re-evaluate if this is desired for home page
  });

  const { items, totalItems, processedPageError } = useMemo(() => {
    if (infiniteQueryError) {
      logError(`[Results:useMemo] Error from useInfiniteQuery hook:`, infiniteQueryError);
      return { items: [], totalItems: 0, processedPageError: infiniteQueryError.message || `Failed to load ${contentType}.` };
    }

    if (!data || !data.pages || data.pages.length === 0) {
      logDebug('[Results:useMemo] No data or empty pages array.');
      return { items: [], totalItems: 0, processedPageError: null };
    }

    logDebug('[Results:useMemo] Processing data pages. Page count:', data.pages.length);

    let accumulatedItems = [];
    let pageLevelErrorMessage = null;

    for (const page of data.pages) {
      if (!page) {
        logWarn('[Results:useMemo] Encountered an undefined page.');
        continue;
      }
      if (page.success === false) {
        if (!pageLevelErrorMessage) {
          pageLevelErrorMessage = page.message || `An error occurred while loading some ${contentType}.`;
          logError(`[Results:useMemo] Page-level error: ${pageLevelErrorMessage}`, page);
        }
        if (Array.isArray(page.data)) accumulatedItems.push(...page.data);
      } else if (Array.isArray(page.data)) {
        accumulatedItems.push(...page.data);
      } else {
        logWarn('[Results:useMemo] Page data is not an array or page was unsuccessful without message:', page);
      }
    }

    const firstPage = data.pages[0];
    const currentTotalItems = firstPage.pagination.total ?? accumulatedItems.length;

    logDebug(`[Results:useMemo] Extracted ${accumulatedItems.length} items. Total according to pagination: ${currentTotalItems}. Page-level error: ${pageLevelErrorMessage}`);

    return {
      items: accumulatedItems,
      totalItems: currentTotalItems,
      processedPageError: pageLevelErrorMessage,
    };
  }, [data, infiniteQueryError, contentType]);

  const renderSkeletons = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(10)].map((_, i) => (
          <ItemSkeleton key={`skeleton-${contentType}-${i}`} type={contentType} />
        ))}
      </div>
    );
  };

  const renderContent = () => {
    // Show error state if we have an API error
    if (apiError) {
      return renderError();
    }
    
    if (isLoading) {
      return renderSkeletons();
    }

    if (isError) {
      return renderError();
    }

    if (!data || !data.pages || data.pages.length === 0) {
      return renderEmpty();
    }

    // Check if the first page indicates offline mode
    if (data.pages[0].isOffline) {
      return renderEmpty();
    }

    const allItems = data.pages.flatMap(page => page.data || []);

    if (allItems.length === 0) {
      return renderEmpty();
    }
    
    return (
      <InfiniteScroll
        dataLength={items.length}
        next={fetchNextPage}
        hasMore={hasNextPage ?? false}
        loader={
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 col-span-full pt-4">
            {[...Array(RESULTS_PER_PAGE > items.length ? Math.min(5, RESULTS_PER_PAGE - items.length % RESULTS_PER_PAGE) : 5)].map((_, i) => (
              <ItemSkeleton key={`loader-skeleton-${contentType}-${i}`} type={contentType} />
            ))}
          </div>
        }
        endMessage={
          !isFetchingNextPage && items.length > 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8 col-span-full">
              You've reached the end of the {contentType}.
            </p>
          ) : null
        }
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
        scrollThreshold={0.95} 
      >
        {items.map((item) => (
          item && item.id != null ? (
            <CardFactory
              key={`${contentType}-${item.id}-${item.name}`}
              type={contentType}
              data={item}
              onQuickAdd={openQuickAdd}
            />
          ) : (
            logWarn('[Results] Attempted to render a null item or item without ID.', item) && null
          )
        ))}
        {processedPageError && items.length > 0 && (
          <div className="col-span-full text-center p-4 text-red-500 dark:text-red-400">
            <ErrorOutlineIcon className="inline-block mr-2" />
            There was an issue loading more {contentType}: {processedPageError}
            <button
              onClick={() => refetch()}
              className="ml-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-chomp-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshIcon className="-ml-1 mr-1 h-3 w-3" />
              Retry
            </button>
          </div>
        )}
      </InfiniteScroll>
    );
  };

  logDebug(`[Results Render] Displaying content for ${contentType}`);
  return renderContent();
};

export default Results;