/* src/pages/Home/Results.jsx */
import React, { useMemo, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import InfiniteScroll from 'react-infinite-scroll-component';
import ErrorMessage from '@/components/UI/ErrorMessage.jsx';
import { listService } from '@/services/listService.js';
import { searchService } from '@/services/searchService.js';
import { logDebug, logError, logWarn } from '@/utils/logger.js';
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

  const fetchFunction = useCallback(async ({ pageParam = 1 }) => {
    logDebug(`[Results fetchFunction START] Fetching page ${pageParam} for type: ${contentType}`);
    console.log('[Results fetchFunction] Entering with params:', { pageParam, contentType, cityId, boroughId, neighborhoodId, hashtags, searchQuery }); // Debug log
    const limit = RESULTS_PER_PAGE;
    const offset = (pageParam - 1) * limit;
    let responseData = { items: [], total: 0 };
    try {
      if (contentType === 'lists') {
        console.log('[Results fetchFunction] Calling listService.getUserLists with params:', { view: 'all', page: pageParam, limit, cityId, boroughId, neighborhoodId, hashtags, query: searchQuery }); // Debug log
        const listApiResponse = await listService.getUserLists({
          view: 'all', page: pageParam, limit: limit, cityId, boroughId, neighborhoodId, hashtags, query: searchQuery,
        });
        responseData = listApiResponse || { items: [], total: 0 };
        logDebug('[Results fetchFunction] Mapped list API response:', responseData);
        console.log('[Results fetchFunction] List API response received:', responseData); // Debug log
      } else if (contentType === 'restaurants' || contentType === 'dishes') {
        const searchApiResponse = await searchService.search({ q: searchQuery, type: contentType, limit: limit, offset: offset, cityId, boroughId, neighborhoodId, hashtags });
        const dataKey = contentType;
        const totalKey = `total${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`;
        responseData = {
          items: searchApiResponse?.[dataKey] || [],
          total: searchApiResponse?.[totalKey] ?? 0,
        };
        logDebug('[Results fetchFunction] Mapped search API response:', responseData);
        console.log('[Results fetchFunction] Search API response received:', responseData); // Debug log
      } else {
        logWarn(`[Results fetchFunction] Unsupported contentType: ${contentType}`);
        console.warn('[Results fetchFunction] Unsupported contentType:', contentType); // Debug log
      }
      const finalReturn = { data: responseData, currentPage: pageParam };
      logDebug(`[Results fetchFunction END] Returning for page ${pageParam}:`, finalReturn);
      console.log('[Results fetchFunction] Returning:', finalReturn); // Debug log
      return finalReturn;
    } catch (error) {
      logError(`[Results fetchFunction ERROR] Fetching ${contentType} page ${pageParam}:`, error);
      console.error('[Results fetchFunction] Error fetching:', error); // Debug log
      throw error;
    }
  }, [contentType, searchQuery, cityId, boroughId, neighborhoodId, hashtags]);

  const {
    data, error, fetchNextPage, hasNextPage, isLoading, isFetching,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['results', contentType, searchQuery, cityId, boroughId, neighborhoodId, JSON.stringify(hashtags)],
    queryFn: fetchFunction,
    getNextPageParam: (lastPage, allPages) => {
      logDebug('[Results getNextPageParam CALLED] LastPage:', lastPage);
      console.log('[Results getNextPageParam] LastPage:', lastPage, 'AllPages:', allPages); // Debug log
      const pageData = lastPage?.data;
      if (!pageData || !Array.isArray(pageData.items)) {
        logWarn('[Results getNextPageParam WARN] Invalid pageData or items array in lastPage:', lastPage);
        console.warn('[Results getNextPageParam] Invalid pageData or items:', pageData); // Debug log
        return undefined;
      }
      const totalFetched = allPages.reduce((acc, page) => acc + (Array.isArray(page?.data?.items) ? page.data.items.length : 0), 0);
      const totalAvailable = pageData.total ?? 0;
      const currentPage = lastPage.currentPage ?? allPages.length;
      logDebug(`[Results getNextPageParam CALC] CurrentPage: ${currentPage}, Total Fetched: ${totalFetched}, Total Available: ${totalAvailable}`);
      console.log('[Results getNextPageParam] Calc:', { currentPage, totalFetched, totalAvailable }); // Debug log
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
    const flattened = data?.pages?.flatMap(page => page?.data?.items ?? []) ?? [];
    logDebug(`[Results useMemo] Flattened items count: ${flattened.length}`);
    console.log('[Results useMemo] Flattened items count:', flattened.length); // Debug log
    return flattened;
  }, [data]);

  const showInitialLoading = isLoading && !items.length;

  logDebug(`[Results Component Render] Items count: ${items.length}, IsLoading: ${isLoading}, IsFetching: ${isFetching}, IsFetchingNext: ${isFetchingNextPage}, HasNextPage: ${hasNextPage}`);
  console.log('[Results Component Render] State:', { itemsCount: items.length, isLoading, isFetching, isFetchingNextPage, hasNextPage }); // Debug log

  if (showInitialLoading) {
    logDebug('[Results Render] Showing initial skeletons.');
    console.log('[Results Render] Showing initial skeletons.'); // Debug log
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(RESULTS_PER_PAGE)].map((_, i) => (<ItemSkeleton key={`skeleton-${i}`} type={contentType} />))}
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
          />
        ) : null
      ))}
    </InfiniteScroll>
  );
};

export default Results;