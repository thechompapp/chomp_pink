/* src/pages/Home/Results.jsx */
import React, { useMemo, useCallback, useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import InfiniteScroll from 'react-infinite-scroll-component';
import ErrorMessage from '@/components/UI/ErrorMessage.jsx';
import { listService } from '@/services/listService.js';
import { searchService } from '@/services/searchService.js';
import { logDebug, logError, logWarn } from '@/utils/logger.js';
import useFollowStore from '@/stores/useFollowStore';
import { useQuickAdd } from '@/context/QuickAddContext';
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
      return <div className="border dark:border-gray-700 p-4 rounded-lg shadow-sm bg-gray-100 dark:bg-gray-800 h-56 animate-pulse" />;
  }
};

const Results = ({ cityId, boroughId, neighborhoodId, hashtags, contentType, searchQuery }) => {
  const RESULTS_PER_PAGE = 25;
  
  // DIRECT FIX: Always clear mock data flag when showing lists
  // This ensures we don't get stuck in offline mode
  useEffect(() => {
    if (contentType === 'lists') {
      // Force online mode for lists
      localStorage.removeItem('use_mock_data');
      logDebug('[Results] Forcing real data mode for lists');
    }
  }, [contentType]);
  
  // Get the QuickAdd context to enable adding items to lists
  const { openQuickAdd } = useQuickAdd();
  
  // Get the follow store initialization function
  const { initializeFollowedLists } = useFollowStore();

  const fetchFunction = useCallback(async ({ pageParam = 1 }) => {
    logDebug(`[Results] Fetching page ${pageParam} for type: ${contentType}`);
    
    const limit = RESULTS_PER_PAGE;
    const offset = (pageParam - 1) * limit;
    let responseData = { 
      restaurants: [], 
      dishes: [], 
      lists: [], 
      totalRestaurants: 0, 
      totalDishes: 0, 
      totalLists: 0,
      items: [],
      total: 0
    };
    
    try {
      if (contentType === 'lists') {
        // Get lists using listService
        const params = {
          view: 'all', 
          page: pageParam, 
          limit, 
          cityId, 
          boroughId, 
          neighborhoodId, 
          hashtags, 
          query: searchQuery
        };
        
        logDebug(`[Results] Fetching lists with params:`, params);
        const listApiResponse = await listService.getUserLists(params);
        
        // Log the response for debugging
        logDebug(`[Results] List API response:`, listApiResponse);
        
        // Ensure we have a consistent structure
        if (listApiResponse && listApiResponse.data) {
          responseData.lists = listApiResponse.data;
          responseData.totalLists = listApiResponse.total || 0;
          
          // Set general items and total for consistency
          responseData.items = responseData.lists;
          responseData.total = responseData.totalLists;
        } else if (Array.isArray(listApiResponse)) {
          responseData.lists = listApiResponse;
          responseData.totalLists = listApiResponse.length;
          
          // Set general items and total for consistency
          responseData.items = responseData.lists;
          responseData.total = responseData.totalLists;
        } else {
          // Handle other response formats
          responseData.lists = listApiResponse?.items || [];
          responseData.totalLists = listApiResponse?.total || 0;
          
          // Set general items and total for consistency
          responseData.items = responseData.lists;
          responseData.total = responseData.totalLists;
        }
      } 
      else if (contentType === 'restaurants' || contentType === 'dishes') {
        // Get restaurants or dishes using searchService
        const params = { 
          q: searchQuery, 
          type: contentType, 
          limit, 
          offset, 
          cityId, 
          boroughId, 
          neighborhoodId, 
          hashtags 
        };
        
        logDebug(`[Results] Fetching ${contentType} with params:`, params);
        const searchApiResponse = await searchService.search(params);
        
        // Log the response for debugging
        logDebug(`[Results] Search API response for ${contentType}:`, searchApiResponse);
        
        // Extract data based on content type
        if (searchApiResponse) {
          // Handle different response formats
          if (searchApiResponse.data) {
            // If searchApiResponse has .data property (newer API format)
            responseData = searchApiResponse.data;
          } else {
            // Direct response (older API format)
            responseData = searchApiResponse;
          }
          
          // Make sure the response has the expected structure
          if (contentType === 'restaurants') {
            responseData.items = responseData.restaurants || [];
            responseData.total = responseData.totalRestaurants || 0;
          } else if (contentType === 'dishes') {
            responseData.items = responseData.dishes || [];
            responseData.total = responseData.totalDishes || 0;
          }
        }
      } 
      else {
        logWarn(`[Results] Unsupported contentType: ${contentType}`);
      }
      
      // Ensure the responseData always has items array for consistency
      if (!Array.isArray(responseData.items)) {
        responseData.items = [];
      }
      
      // Ensure the responseData always has a total value
      if (typeof responseData.total !== 'number') {
        responseData.total = 0;
      }
      
      return { 
        data: responseData, 
        currentPage: pageParam 
      };
    } 
    catch (error) {
      logError(`[Results] Error fetching ${contentType} page ${pageParam}:`, error);
      
      // Return a structured error response rather than throwing
      // This lets us display the error state gracefully in the UI
      return {
        data: responseData,
        currentPage: pageParam,
        error: error.message || 'Unknown error'
      };
    }
  }, [contentType, searchQuery, cityId, boroughId, neighborhoodId, hashtags]);

  // Get the queryClient for manual invalidation
  const queryClient = useQueryClient();
  
  // Force refresh on page visibility change to catch up after network issues
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if we've had a recent list operation
        const recentListOp = localStorage.getItem('recent_list_operation');
        if (recentListOp) {
          const timestamp = parseInt(recentListOp, 10);
          const now = Date.now();
          // If operation was within last 60 seconds, force refresh
          if (now - timestamp < 60000) {
            logDebug('[Home/Results] Page became visible after recent list operation, forcing refresh');
            queryClient.invalidateQueries({ queryKey: ['results'], exact: false });
            queryClient.refetchQueries({ queryKey: ['results'], exact: false });
          }
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient]);
  
  // Set up event listeners for list data updates
  useEffect(() => {
    // Only add event listeners when contentType is 'lists'
    if (contentType !== 'lists') return;
    
    const handleListItemAdded = () => {
      logDebug('[Home/Results] List item added event detected, refreshing data');
      queryClient.invalidateQueries({ 
        queryKey: ['results', 'lists'], 
        exact: false 
      });
    };
    
    const handleFollowStateChanged = () => {
      logDebug('[Home/Results] Follow state changed, refreshing lists data');
      queryClient.invalidateQueries({ 
        queryKey: ['results', 'lists'], 
        exact: false 
      });
    };
    
    // Add event listeners
    window.addEventListener('listItemAdded', handleListItemAdded);
    window.addEventListener('followStateChanged', handleFollowStateChanged);
    
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener('listItemAdded', handleListItemAdded);
      window.removeEventListener('followStateChanged', handleFollowStateChanged);
    };
  }, [contentType, queryClient]);

  const {
    data, error, fetchNextPage, hasNextPage, isLoading, isFetching,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['results', contentType, searchQuery, cityId, boroughId, neighborhoodId, JSON.stringify(hashtags)],
    queryFn: fetchFunction,
    getNextPageParam: (lastPage, allPages) => {
      logDebug('[Results getNextPageParam CALLED] LastPage:', lastPage);
      console.log('[Results getNextPageParam] LastPage:', lastPage, 'AllPages:', allPages); // Debug log
      
      // Check if we have a valid lastPage object
      if (!lastPage || !lastPage.data) {
        console.log('[Results getNextPageParam] No valid lastPage or data object');
        return undefined; // No more pages
      }
      
      // Extract the data from the response based on different possible formats
      const pageData = lastPage.data; // This is either {items: [], total: 0} or similar format
      
      // Extract items directly from pageData structure with better null checks
      let items = [];
      if (Array.isArray(pageData.items)) {
        items = pageData.items;
      } else if (Array.isArray(pageData.data)) {
        items = pageData.data;
      } else if (contentType === 'restaurants' && Array.isArray(pageData.restaurants)) {
        items = pageData.restaurants;
      } else if (contentType === 'dishes' && Array.isArray(pageData.dishes)) {
        items = pageData.dishes;
      } else if (contentType === 'lists' && Array.isArray(pageData.lists)) {
        items = pageData.lists;
      } else {
        // If all attempts to find items fail, log the issue but don't throw an error
        console.warn('[Results getNextPageParam] No valid data array found:', pageData);
        return undefined; // No more pages
      }
      
      // Make the total calculation more robust with fallbacks
      const total = pageData.total || 
                   pageData.totalRestaurants || 
                   pageData.totalDishes || 
                   pageData.totalLists || 
                   0;
      
      // Calculate current page and total fetched
      const currentPage = lastPage.currentPage || 1;
      let totalFetched = 0;
      
      // Count total items fetched so far with better error handling
      try {
        for (const page of allPages) {
          if (!page || !page.data) continue;
          const pgData = page.data;
          
          let pgItems = [];
          if (Array.isArray(pgData.items)) {
            pgItems = pgData.items;
          } else if (Array.isArray(pgData.data)) {
            pgItems = pgData.data;
          } else if (contentType === 'restaurants' && Array.isArray(pgData.restaurants)) {
            pgItems = pgData.restaurants;
          } else if (contentType === 'dishes' && Array.isArray(pgData.dishes)) {
            pgItems = pgData.dishes;
          } else if (contentType === 'lists' && Array.isArray(pgData.lists)) {
            pgItems = pgData.lists;
          }
          
          totalFetched += pgItems.length;
        }
      } catch (error) {
        logError('[Results getNextPageParam] Error calculating total fetched items:', error);
        // Continue with what we have
      }
      
      console.log('[Results getNextPageParam] Calc:', { 
        currentPage, 
        totalFetched, 
        total, 
        dataLength: items.length 
      }); // Debug log
      
      // If we have more items to fetch, return the next page
      if (total > totalFetched) {
        const nextPage = currentPage + 1;
        console.log('[Results getNextPageParam] More pages exist, next page:', nextPage); // Debug log
        return nextPage;
      }
      
      console.log('[Results getNextPageParam] No more pages.'); // Debug log
      return undefined; // No more pages
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const items = useMemo(() => {
    logDebug('[Results useMemo] Processing data.pages:', data?.pages);
    console.log('[Results useMemo] Processing data.pages:', data?.pages); // Debug log
    
    if (!data || !data.pages || !Array.isArray(data.pages)) {
      return [];
    }
    
    // Handle the data structure that matches getNextPageParam
    const flattened = data.pages.flatMap(page => {
      if (!page || !page.data) {
        return [];
      }
      
      const pageData = page.data;
      
      // Extract data using consistent extraction logic
      if (contentType === 'restaurants' && Array.isArray(pageData.restaurants)) {
        return pageData.restaurants;
      }
      
      if (contentType === 'dishes' && Array.isArray(pageData.dishes)) {
        return pageData.dishes;
      }
      
      if (contentType === 'lists' && Array.isArray(pageData.lists)) {
        return pageData.lists;
      }
      
      // General fallback logic for any array data
      if (Array.isArray(pageData.items)) {
        return pageData.items;
      }
      
      if (Array.isArray(pageData.data)) {
        return pageData.data;
      }
      
      if (Array.isArray(pageData)) {
        return pageData;
      }
      
      // If we can't extract items, return empty array for this page
      return [];
    });
    
    logDebug(`[Results useMemo] Flattened items count: ${flattened.length}`);
    console.log('[Results useMemo] Flattened items count:', flattened.length); // Debug log
    return flattened;
  }, [data, contentType]);

  const showInitialLoading = isLoading && !items.length;

  logDebug(`[Results Component Render] Items count: ${items.length}, IsLoading: ${isLoading}, IsFetching: ${isFetching}, IsFetchingNext: ${isFetchingNextPage}, HasNextPage: ${hasNextPage}`);
  console.log('[Results Component Render] State:', { itemsCount: items.length, isLoading, isFetching, isFetchingNextPage, hasNextPage }); // Debug log

  useEffect(() => {
    if (contentType === 'lists' && data?.pages) {
      try {
        // Extract all lists from all pages with proper null checking
        const allLists = data.pages.flatMap(page => {
          if (!page || !page.data) return [];
          
          const pageData = page.data;
          if (Array.isArray(pageData.lists)) {
            return pageData.lists;
          } else if (Array.isArray(pageData.items)) {
            return pageData.items;
          } else if (Array.isArray(pageData.data)) {
            return pageData.data;
          }
          return [];
        });
        
        if (allLists.length > 0) {
          logDebug(`[Results] Initializing follow store with ${allLists.length} lists from Home page`);
          initializeFollowedLists(allLists);
        }
      } catch (error) {
        logError('[Results] Error initializing follow store:', error);
      }
    }
  }, [data?.pages, contentType, initializeFollowedLists]);

  if (showInitialLoading) {
    logDebug('[Results Render] Showing initial skeletons.');
    console.log('[Results Render] Showing initial skeletons.'); // Debug log
    const skeletonItems = Array(RESULTS_PER_PAGE).fill(null).map((_, index) => (
      <ItemSkeleton key={`skeleton-${index}`} type={contentType} />
    ));
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {skeletonItems}
      </div>
    );
  }

  if (error) {
    logError('[Results Render] Rendering error message:', error);
    console.error('[Results Render] Error:', error); // Debug log
    return <ErrorMessage message={`Failed to load ${contentType}: ${error.message || 'Unknown error'}`} />;
  }

  if (!isLoading && !isFetching && items.length === 0) {
    logDebug('[Results Render] Rendering "No results found".');
    console.log('[Results Render] No results found.'); // Debug log
    return <p className="text-gray-500 dark:text-gray-400 text-center py-8 col-span-full">No {contentType} found matching your criteria.</p>;
  }

  logDebug(`[Results Render] Rendering InfiniteScroll. Items: ${items.length}, HasNext: ${hasNextPage}, IsFetchingNext: ${isFetchingNextPage}`);
  console.log('[Results Render] Rendering InfiniteScroll:', { itemsCount: items.length, hasNextPage, isFetchingNextPage }); // Debug log
  return (
    <InfiniteScroll
      dataLength={items.length}
      next={fetchNextPage}
      hasMore={hasNextPage ?? false}
      loader={
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 col-span-full pt-4">
          {[...Array(5)].map((_, i) => (<ItemSkeleton key={`loader-skel-${i}`} type={contentType} />))}
        </div>
      }
      endMessage={
        items.length > 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4 col-span-full">You've seen all the results.</p>
        ) : null
      }
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
    >
      {items.map((item) => (
        item && item.id != null ? (
          <CardFactory
            key={`${contentType}-${item.id}`}
            type={contentType}
            data={item}
            onQuickAdd={openQuickAdd}
          />
        ) : null
      ))}
    </InfiniteScroll>
  );
};

export default Results;