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
import { useQuickAdd } from '@/contexts/QuickAddContext';

// Import UI components
import CardFactory from '@/components/UI/CardFactory.jsx';
import ListCardSkeleton from '@/pages/Lists/ListCardSkeleton.jsx';
import RestaurantCardSkeleton from '@/components/UI/RestaurantCardSkeleton.jsx';
import DishCardSkeleton from '@/components/UI/DishCardSkeleton.jsx';
import AddToListModal from '@/components/AddToListModal';
import { GRID_LAYOUTS } from '@/utils/layoutConstants';

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

  // AddToList modal state
  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
  const [itemToAdd, setItemToAdd] = useState(null);

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
          page: pageParam, 
          limit, 
          cityId, 
          boroughId, 
          neighborhoodId, 
          hashtags: hashtags || [], // Ensure hashtags is an array
          searchTerm: searchQuery, // Use searchTerm instead of query for consistency
          isPublic: true, // Ensure we get public lists for home page
          sortBy: 'popularity', // Sort by popularity for trending lists
          sortOrder: 'desc'
        };
        
        logDebug('[Results] Fetching public lists with params:', params);
        
        // Add timeout to prevent hanging requests
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timed out')), 15000);
        });
        
        // Race between the actual request and the timeout
        response = await Promise.race([
          listService.getLists(params), // Use getLists instead of getUserLists for public lists
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
          ...cleanFilters // Only include non-null filter values
        };
        
        logDebug(`[Results] Raw filter values - cityId: ${cityId}, boroughId: ${boroughId}, neighborhoodId: ${neighborhoodId}, hashtags:`, hashtags);
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
        
        // The searchService now returns data directly at the top level:
        // { restaurants: [...], dishes: [...], lists: [...], totalRestaurants: N, totalDishes: N, totalLists: N, success: true }
        success = response?.success ?? (response?.[contentType] != null); // Consider successful if the content type array exists
        message = response?.message || (success ? `${contentType} fetched` : `Failed to fetch ${contentType}`);
        items = Array.isArray(response?.[contentType]) ? response[contentType] : [];
        
        // Get the total count from the response using the pattern total + capitalizedContentType
        const totalKey = `total${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`;
        total = response?.[totalKey] ?? items.length;
        
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
        
      const returnValue = {
        success,
        data: items, // This should be the array of list items, not the entire response
        pagination: responsePagination || { page: pageParam, limit, total, totalPages: Math.ceil(total / limit) },
        hasMore: (pageParam * limit) < total,
        page: pageParam,
        message
      };
      
      // Debug: Log the exact return value
      logDebug('[Results] fetchFunction returning:', {
        success: returnValue.success,
        dataType: Array.isArray(returnValue.data) ? 'array' : typeof returnValue.data,
        dataLength: Array.isArray(returnValue.data) ? returnValue.data.length : 'not array',
        firstItemKeys: Array.isArray(returnValue.data) && returnValue.data.length > 0 ? 
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

  // AddToList handlers
  const handleAddToList = useCallback((item) => {
    console.log('[Results] Opening AddToList modal for:', item);
    setItemToAdd({
      id: item.id,
      name: item.name,
      type: item.type
    });
    setIsAddToListModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsAddToListModalOpen(false);
    setItemToAdd(null);
  }, []);

  const handleItemAdded = useCallback((listId, listItemId) => {
    console.log(`[Results] Item added to list ${listId} with ID ${listItemId}`);
    setIsAddToListModalOpen(false);
    setItemToAdd(null);
    // Optional: Show success notification
  }, []);

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
    queryKey: ['results', contentType, searchQuery, cityId, boroughId, neighborhoodId, JSON.stringify(hashtags || [])], // Remove Date.now() that was causing infinite loop
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
    staleTime: 5 * 60 * 1000, // 5 minutes cache instead of 0
    refetchOnWindowFocus: false, // Disable refetch on window focus to prevent excessive requests
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
      <div className={GRID_LAYOUTS.PRIMARY}>
        {[...Array(10)].map((_, i) => (
          <ItemSkeleton key={`skeleton-${contentType}-${i}`} type={contentType} />
        ))}
      </div>
    );
  };

  const renderError = () => {
    const errorMessage = apiError?.message || 
                        infiniteQueryError?.message || 
                        processedPageError || 
                        `Failed to load ${contentType}. Please try again.`;
    
    return (
      <div className="text-center py-8 px-4 max-w-lg mx-auto">
        <ErrorOutlineIcon className="h-10 w-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-600 mb-4">{errorMessage}</p>
        <button
          onClick={() => {
            setApiError(null);
            refetch();
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-chomp-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshIcon className="-ml-1 mr-2 h-4 w-4" />
          Try Again
        </button>
      </div>
    );
  };

  const renderEmpty = () => {
    const isSearch = searchQuery && searchQuery.length > 0;
    const hasFilters = cityId || boroughId || neighborhoodId || (hashtags && hashtags.length > 0);
    
    return (
      <div className="text-center py-12 px-4">
        <DescriptionOutlinedIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {isSearch || hasFilters ? `No ${contentType} found` : `No ${contentType} yet`}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {isSearch || hasFilters 
            ? `Try adjusting your search or filters to find ${contentType}.`
            : contentType === 'lists' 
              ? `Create your first list to get started!`
              : `Be the first to add ${contentType} to this area.`
          }
        </p>
        {contentType === 'lists' && !isSearch && !hasFilters && (
          <Link 
            to="/lists/new" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-chomp-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <AddIcon className="-ml-1 mr-2 h-4 w-4" />
            Create Your First List
          </Link>
        )}
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

    if (infiniteQueryError) {
      return renderError();
    }

    if (!data || !data.pages || data.pages.length === 0) {
      return renderEmpty();
    }

    // Check if the first page indicates offline mode
    if (data.pages[0].isOffline) {
      return renderEmpty();
    }

    // Use the correctly processed items from useMemo, not a separate calculation
    if (items.length === 0) {
      return renderEmpty();
    }
    
    return (
      <InfiniteScroll
        dataLength={items.length}
        next={fetchNextPage}
        hasMore={hasNextPage ?? false}
        loader={
          <div className={`${GRID_LAYOUTS.PRIMARY} col-span-full pt-4`}>
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
        className={GRID_LAYOUTS.PRIMARY}
        scrollThreshold={0.95} 
      >
        {items.map((item) => {
          return (
            item && item.id != null ? (
              <CardFactory
                key={`${contentType}-${item.id}-${item.name}`}
                type={contentType}
                data={item}
                onQuickAdd={openQuickAdd}
                onAddToList={handleAddToList}
              />
            ) : (
              logWarn('[Results] Attempted to render a null item or item without ID.', item) && null
            )
          );
        })}
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
  return (
    <div>
      {renderContent()}
      
      {/* AddToList Modal */}
      <AddToListModal
        isOpen={isAddToListModalOpen}
        onClose={handleCloseModal}
        itemToAdd={itemToAdd}
        onItemAdded={handleItemAdded}
      />
    </div>
  );
};

export default Results;