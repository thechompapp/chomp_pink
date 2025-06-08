/**
 * Results Content Component
 * 
 * Handles rendering of results content with infinite scrolling.
 * Extracted from Results.jsx for better separation of concerns.
 */

import React from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import CardFactory from '@/components/UI/CardFactory.jsx';
import { GRID_LAYOUTS } from '@/utils/layoutConstants';
import { logDebug } from '@/utils/logger.js';
import ItemSkeleton from './ItemSkeleton';

/**
 * Component for rendering infinite scroll results content
 */
const ResultsContent = ({
  items,
  contentType,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  processedPageError,
  refetch,
  openQuickAdd,
  handleAddToList,
  RESULTS_PER_PAGE
}) => {
  logDebug(`[ResultsContent] Rendering ${items.length} ${contentType} items`);

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
      {items.filter(item => item && item.id != null).map((item) => {
        return (
          <CardFactory
            key={`${contentType}-${item.id}-${item.name}`}
            type={contentType}
            data={item}
            onQuickAdd={openQuickAdd}
            onAddToList={handleAddToList}
          />
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

export default ResultsContent; 