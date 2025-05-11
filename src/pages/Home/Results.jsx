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
    let responseData = { items: [], total: 0 };
    
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
        
        const listApiResponse = await listService.getUserLists(params);
        responseData = listApiResponse || { items: [], total: 0 };
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
        
        const searchApiResponse = await searchService.search(params);
        
        // Extract the right data based on content type
        const dataKey = contentType;
        const totalKey = `total${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`;
        
        responseData = {
          items: searchApiResponse?.[dataKey] || [],
          total: searchApiResponse?.[totalKey] ?? 0,
        };
      } 
      else {
        logWarn(`[Results] Unsupported contentType: ${contentType}`);
        responseData = { items: [], total: 0 };
      }
      
      return { 
        data: responseData, 
        currentPage: pageParam 
      };
    } 
    catch (error) {
      logError(`[Results] Error fetching ${contentType} page ${pageParam}:`, error);
      throw error;
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
      
      // Handle both response formats: {data: {items: []}} and {data: []}
      const pageData = lastPage?.data;
      const dataArray = Array.isArray(pageData?.data) ? pageData.data : 
                      (Array.isArray(pageData?.items) ? pageData.items : 
                       (Array.isArray(pageData) ? pageData : []));
      
      if (!dataArray || dataArray.length === 0) {
        logWarn('[Results getNextPageParam WARN] No valid data array found in response:', lastPage);
        console.warn('[Results getNextPageParam] No valid data array found:', pageData); // Debug log
        return undefined;
      }
      
      // Calculate pagination based on available data
      let totalFetched = 0;
      for (const page of allPages) {
        const pageDataArray = Array.isArray(page?.data?.data) ? page.data.data : 
                           (Array.isArray(page?.data?.items) ? page.data.items : 
                            (Array.isArray(page?.data) ? page.data : []));
        totalFetched += pageDataArray.length;
      }
      
      // Get total from pagination metadata if available, otherwise use length
      const totalAvailable = pageData?.pagination?.total || pageData?.total || dataArray.length;
      const currentPage = pageData?.pagination?.page || lastPage.currentPage || allPages.length;
      
      logDebug(`[Results getNextPageParam CALC] CurrentPage: ${currentPage}, Total Fetched: ${totalFetched}, Total Available: ${totalAvailable}`);
      console.log('[Results getNextPageParam] Calc:', { currentPage, totalFetched, totalAvailable, dataLength: dataArray.length }); // Debug log
      
      if (totalAvailable > totalFetched) {
        const nextPage = currentPage + 1;
        logDebug(`[Results getNextPageParam RESULT] More pages exist. Returning next page: ${nextPage}`);
        console.log('[Results getNextPageParam] More pages exist, next page:', nextPage); // Debug log
        return nextPage;
      }
      
      logDebug('[Results getNextPageParam RESULT] No more pages.');
      console.log('[Results getNextPageParam] No more pages.'); // Debug log
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const items = useMemo(() => {
    logDebug('[Results useMemo] Processing data.pages:', data?.pages);
    console.log('[Results useMemo] Processing data.pages:', data?.pages); // Debug log
    
    // Handle both response formats: {data: {items: []}} and {data: []}
    const flattened = data?.pages?.flatMap(page => {
      // Try different possible data structures
      if (Array.isArray(page?.data?.data)) {
        return page.data.data;
      } else if (Array.isArray(page?.data?.items)) {
        return page.data.items;
      } else if (Array.isArray(page?.data)) {
        return page.data;
      }
      return [];
    }) ?? [];
    
    logDebug(`[Results useMemo] Flattened items count: ${flattened.length}`);
    console.log('[Results useMemo] Flattened items count:', flattened.length); // Debug log
    return flattened;
  }, [data]);

  const showInitialLoading = isLoading && !items.length;

  logDebug(`[Results Component Render] Items count: ${items.length}, IsLoading: ${isLoading}, IsFetching: ${isFetching}, IsFetchingNext: ${isFetchingNextPage}, HasNextPage: ${hasNextPage}`);
  console.log('[Results Component Render] State:', { itemsCount: items.length, isLoading, isFetching, isFetchingNextPage, hasNextPage }); // Debug log

  useEffect(() => {
    if (contentType === 'lists' && data?.pages) {
      // Extract all lists from all pages
      const allLists = data.pages.flatMap(page => page.items || []);
      if (allLists.length > 0) {
        logDebug(`[Results] Initializing follow store with ${allLists.length} lists from Home page`);
        initializeFollowedLists(allLists);
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