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
  const queryClient = useQueryClient();
  
  // Clear mock data flag when showing lists to ensure we don't get stuck in offline mode
  useEffect(() => {
    if (contentType === 'lists') {
      localStorage.removeItem('use_mock_data');
      logDebug('[Results] Forcing real data mode for lists');
    }
  }, [contentType]);
  
  const { openQuickAdd } = useQuickAdd();
  const { initializeFollowedLists } = useFollowStore();

  const fetchFunction = useCallback(async ({ pageParam = 1 }) => {
    logDebug(`[Results] Fetching page ${pageParam} for type: ${contentType}`);
    
    const limit = RESULTS_PER_PAGE;
    const offset = (pageParam - 1) * limit;
    
    try {
      if (contentType === 'lists') {
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
        const response = await listService.getUserLists(params);
        
        console.log('[Results] Raw API response:', JSON.stringify(response, null, 2));
        
        // Handle response format
        let items = [];
        let total = 0;
        
        console.log('[Results] Processing API response:', {
          hasSuccess: response?.success,
          hasData: !!response?.data,
          hasDataData: !!response?.data?.data,
          dataType: response?.data ? typeof response.data : 'undefined',
          dataKeys: response?.data ? Object.keys(response.data) : 'no data'
        });
        
        // Handle the actual API response format
        if (response?.success && response?.data?.data) {
          items = Array.isArray(response.data.data) ? response.data.data : [];
          total = response.data.total || items.length;
          console.log(`[Results] Extracted ${items.length} items from response.data.data`);
        } 
        // Fallback to other possible response formats
        else if (response?.data?.data) {
          items = Array.isArray(response.data.data) ? response.data.data : [];
          total = response.data.total || 0;
          console.log(`[Results] Extracted ${items.length} items from response.data.data (fallback)`);
        } else if (Array.isArray(response?.data)) {
          items = response.data;
          total = response.pagination?.total || items.length;
          console.log(`[Results] Extracted ${items.length} items from response.data array`);
        } else if (response?.data?.lists) {
          items = Array.isArray(response.data.lists) ? response.data.lists : [];
          total = response.data.total || items.length;
          console.log(`[Results] Extracted ${items.length} items from response.data.lists`);
        } else {
          console.warn('[Results] Could not extract items from response:', response);
        }
        
        return {
          items,
          total,
          page: pageParam,
          hasMore: (pageParam * limit) < total
        };
      } 
      
      // Handle restaurants and dishes
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
      const response = await searchService.search(params);
      
      let items = [];
      let total = 0;
      
      if (response?.data) {
        items = response.data[contentType] || [];
        total = response.data.total || items.length;
      } else if (response?.[contentType]) {
        items = response[contentType];
        total = response.total || items.length;
      }
      
      return {
        items,
        total,
        page: pageParam,
        hasMore: (pageParam * limit) < total
      };
      
    } catch (error) {
      logError(`[Results] Error in fetchFunction:`, error);
      throw error;
    }
  }, [contentType, searchQuery, cityId, boroughId, neighborhoodId, hashtags]);

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
      console.log('[getNextPageParam] Last page data:', lastPage);
      
      // If no data in the last page, no more pages
      if (!lastPage || !lastPage.data) {
        console.log('[getNextPageParam] No more pages - no data in last page');
        return undefined;
      }
      
      // Get pagination info from the last page
      const currentPage = lastPage.page || 1;
      const itemsPerPage = lastPage.items?.length || 0;
      const totalItems = lastPage.total || 0;
      const totalFetched = currentPage * itemsPerPage;
      
      console.log('[getNextPageParam] Pagination info:', {
        currentPage,
        totalItems,
        itemsPerPage,
        totalFetched,
        hasMore: totalItems > totalFetched
      });
      
      // If we've fetched all items, don't fetch more
      if (totalItems <= totalFetched) {
        console.log('[getNextPageParam] No more pages - all items fetched');
        return undefined;
      }
      
      // Return the next page number
      const nextPage = currentPage + 1;
      console.log('[getNextPageParam] Fetching next page:', nextPage);
      return nextPage;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Process the data from the API
  const { items, total } = useMemo(() => {
    if (!data || !data.pages || data.pages.length === 0) {
      return { items: [], total: 0 };
    }
    
    // Helper function to extract items from different response formats
    const extractItems = (page) => {
      if (!page) return { items: [], total: 0 };
      
      try {
        // Log page structure for debugging
        logDebug('[Results] Page structure:', {
          keys: Object.keys(page),
          hasData: !!page.data,
          dataType: page.data ? typeof page.data : 'undefined',
          dataKeys: page.data ? Object.keys(page.data) : 'no data'
        });
        
        // Handle different response formats
        if (contentType === 'lists') {
          // Format 1: { success: true, data: { data: [...], total: X } }
          if (page.success && page.data?.data && Array.isArray(page.data.data)) {
            return { items: page.data.data, total: page.data.total };
          }
          // Format 2: { data: [...] }
          if (page.data && Array.isArray(page.data)) {
            return { items: page.data, total: page.data.length };
          }
          // Format 3: Direct array
          if (Array.isArray(page)) {
            return { items: page, total: page.length };
          }
        } 
        // Handle other content types
        else if (page[contentType] && Array.isArray(page[contentType])) {
          return { items: page[contentType], total: page.total || page[contentType].length };
        }
        
        // Fallback to common structures
        if (page.items && Array.isArray(page.items)) {
          return { items: page.items, total: page.total || page.items.length };
        }
        if (page.data && Array.isArray(page.data)) {
          return { items: page.data, total: page.total || page.data.length };
        }
      } catch (error) {
        logError('[Results] Error in extractItems:', error);
      }
      
      return { items: [], total: 0 };
    };
    
    // Process all pages and combine results
    let allItems = [];
    let totalItems = 0;
    
    data.pages.forEach((page) => {
      try {
        const { items: pageItems, total: pageTotal } = extractItems(page);
        if (pageItems && pageItems.length > 0) {
          allItems = [...allItems, ...pageItems];
          // Use the largest total we find (in case of pagination)
          if (pageTotal > totalItems) {
            totalItems = pageTotal;
          }
        }
      } catch (error) {
        logError('[Results] Error processing page:', error);
      }
    });
    
    // If we didn't get a total from any page, use the count of items
    if (totalItems === 0) {
      totalItems = allItems.length;
    }
    
    logDebug(`[Results] Processed ${allItems.length} items with total ${totalItems}`);
    
    return {
      items: allItems.filter(item => item && item.id !== undefined),
      total: totalItems
    };
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