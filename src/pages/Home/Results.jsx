/* src/pages/Home/Results.jsx */
import React, { useMemo, useCallback, useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import AddIcon from '@mui/icons-material/Add';
import { Link } from 'react-router-dom';
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
        
        logDebug('[Results] Received lists response:', {
          success: response?.success,
          itemsCount: response?.data?.length ?? 0,
          hasPagination: !!response?.pagination,
          message: response?.message
        });
        
        // Normalize the response to ensure consistent structure
        const items = Array.isArray(response.data) ? response.data : [];
        const total = response.pagination?.total ?? items.length;
        
        return {
          success: response.success,
          data: items,
          pagination: response.pagination || {
            page: pageParam,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          },
          hasMore: (pageParam * limit) < total,
          page: pageParam
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
      
      // Normalize search response
      const items = Array.isArray(response?.data?.[contentType]) 
        ? response.data[contentType] 
        : [];
      
      const total = response?.data?.total ?? items.length;
      
      return {
        success: true,
        data: items,
        pagination: {
          page: pageParam,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        hasMore: (pageParam * limit) < total,
        page: pageParam
      };
      
    } catch (error) {
      logError(`[Results] Error in fetchFunction:`, error);
      return {
        success: false,
        data: [],
        pagination: {
          page: pageParam,
          limit: RESULTS_PER_PAGE,
          total: 0,
          totalPages: 0
        },
        message: error.message || 'Failed to fetch data',
        error: true
      };
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

  // Process the data to extract items and pagination info
  const { items, total, error: queryError } = useMemo(() => {
    // If we have an error from the query, return it
    if (error) {
      console.error('[Results] Error fetching data:', error);
      return { 
        items: [], 
        total: 0, 
        error: error.message || 'Failed to load data'
      };
    }
    
    // If no data yet, return empty state
    if (!data || !data.pages || data.pages.length === 0) {
      console.log('[Results] No data or empty pages array');
      return { items: [], total: 0 };
    }
    
    // Log the first page data structure for debugging
    console.log('[Results] First page data:', data.pages[0]);
    
    // Extract all items from all pages
    const allItems = data.pages.flatMap(page => {
      if (!page) return [];
      
      // Log each page structure for debugging
      console.log('[Results] Processing page:', {
        pageData: page,
        hasData: !!page.data,
        dataType: typeof page.data,
        isArray: Array.isArray(page.data)
      });
      
      // Handle different possible response formats
      if (Array.isArray(page.data)) {
        return page.data;
      } else if (page.data && Array.isArray(page.data.data)) {
        return page.data.data;
      } else if (page.data && Array.isArray(page.data.lists)) {
        return page.data.lists;
      } else if (page.data && Array.isArray(page.data.items)) {
        return page.data.items;
      } else if (page.data && typeof page.data === 'object') {
        // If data is a single object, wrap it in an array
        return [page.data];
      }
      
      return [];
    });
    
    console.log(`[Results] Extracted ${allItems.length} items`);
    
    // Get total from the first page if available, or use the count of all items
    const firstPage = data.pages[0];
    const totalItems = firstPage?.pagination?.total || 
                      firstPage?.data?.total || 
                      allItems.length;
    
    // Check for error in response
    const pageError = data.pages.some(page => 
      page && !page.success && page.message
    );
    
    return {
      items: allItems,
      total: totalItems,
      error: pageError ? (firstPage?.message || 'Error loading data') : null
    };
  }, [data, error, contentType]);

  const showInitialLoading = isLoading && !items.length;

  logDebug(`[Results Component Render] Items count: ${items.length}, IsLoading: ${isLoading}, IsFetching: ${isFetching}, IsFetchingNext: ${isFetchingNextPage}, HasNextPage: ${hasNextPage}`);
  console.log('[Results Component Render] State:', { itemsCount: items.length, isLoading, isFetching, isFetchingNextPage, hasNextPage }); // Debug log

  useEffect(() => {
    if (contentType === 'lists' && data?.pages) {
      try {
        // Extract all lists from all pages with proper null checking
        const allLists = data.pages.flatMap(page => {
          if (!page) return [];
          
          // Get lists from the standardized response format
          if (Array.isArray(page.data)) {
            return page.data;
          }
          
          // Fallback to legacy formats if needed
          if (page.data?.data && Array.isArray(page.data.data)) {
            return page.data.data;
          }
          
          return [];
        }).filter(list => list && list.id);
        
        if (allLists.length > 0) {
          logDebug(`[Results] Initializing follow store with ${allLists.length} lists from Home page`);
          initializeFollowedLists(allLists);
        } else {
          logDebug('[Results] No valid lists found for follow store initialization');
        }
      } catch (error) {
        logError('[Results] Error initializing follow store:', error);
      }
    }
  }, [data?.pages, contentType, initializeFollowedLists]);

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-chomp-blue"></div>
        <p className="text-gray-600">Loading lists...</p>
      </div>
    );
  }
  
  // Check for errors from the API response
  const hasError = queryError || (items.length === 0 && !isFetchingNextPage);
  
  if (hasError) {
    return (
      <div className="text-center p-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <ErrorOutlineIcon className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load lists</h3>
        <p className="text-gray-600 mb-4">
          {queryError || 'There was a problem loading the lists. Please try again.'}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-chomp-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshIcon className="-ml-1 mr-2 h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  if (!isLoading && !isFetching && items.length === 0) {
    logDebug('[Results Render] Rendering "No results found".');
    console.log('[Results Render] No results found.'); // Debug log
    return (
      <div className="text-center p-8">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
          <DescriptionOutlinedIcon className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No lists found</h3>
        <p className="text-gray-500 mb-6">
          {searchQuery 
            ? 'No lists match your search criteria.' 
            : 'Get started by creating a new list!'}
        </p>
        {!searchQuery && (
          <Link
            to="/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-chomp-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <AddIcon className="-ml-1 mr-2 h-4 w-4" />
            Create List
          </Link>
        )}
      </div>
    );
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