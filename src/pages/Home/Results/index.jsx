/**
 * Results Component - Refactored
 * 
 * Main orchestrator for search results display with infinite scrolling.
 * This refactored version improves maintainability by separating concerns.
 */

import React, { useEffect } from 'react';
import { logDebug } from '@/utils/logger.js';
import { useQuickAdd } from '@/contexts/QuickAddContext';
import useFollowStore from '@/stores/useFollowStore';
import AddToListModal from '@/components/AddToListModal';

// Import refactored hooks and components
import useResultsData from './useResultsData';
import useResultsModal from './useResultsModal';
import useResultsEvents from './useResultsEvents';
import ResultsContent from './ResultsContent';
import { ResultsLoading, ResultsError, ResultsEmpty } from './ResultsStates';

/**
 * Results component for displaying search results with infinite scrolling
 */
const Results = ({ cityId, boroughId, neighborhoodId, hashtags, contentType, searchQuery }) => {
  const { openQuickAdd } = useQuickAdd();
  const { initializeFollowedLists } = useFollowStore();

  // Ensure real data mode for lists (debugging specific scenarios)
  useEffect(() => {
    if (contentType === 'lists') {
      localStorage.removeItem('use_mock_data');
      logDebug('[Results] Ensuring real data mode for lists.');
    }
  }, [contentType]);

  // 1. Data fetching with infinite scrolling
  const dataHook = useResultsData({
    cityId,
    boroughId,
    neighborhoodId,
    hashtags,
    contentType,
    searchQuery
  });

  // 2. Modal state management
  const modalHook = useResultsModal();

  // 3. Event handling for query invalidation
  useResultsEvents({
    contentType,
    queryClient: dataHook.queryClient
  });

  // Render logic
  const renderContent = () => {
    // Show error state if we have an API error
    if (dataHook.apiError) {
      return (
        <ResultsError
          apiError={dataHook.apiError}
          infiniteQueryError={dataHook.infiniteQueryError}
          processedPageError={dataHook.processedPageError}
          contentType={contentType}
          refetch={dataHook.refetch}
          setApiError={dataHook.setApiError}
        />
      );
    }
    
    if (dataHook.isLoading) {
      return <ResultsLoading contentType={contentType} />;
    }

    if (dataHook.infiniteQueryError) {
      return (
        <ResultsError
          apiError={dataHook.apiError}
          infiniteQueryError={dataHook.infiniteQueryError}
          processedPageError={dataHook.processedPageError}
          contentType={contentType}
          refetch={dataHook.refetch}
          setApiError={dataHook.setApiError}
        />
      );
    }

    if (!dataHook.data || !dataHook.data.pages || dataHook.data.pages.length === 0) {
      return (
        <ResultsEmpty
          searchQuery={searchQuery}
          cityId={cityId}
          boroughId={boroughId}
          neighborhoodId={neighborhoodId}
          hashtags={hashtags}
          contentType={contentType}
        />
      );
    }

    // Check if the first page indicates offline mode
    if (dataHook.data.pages[0].isOffline) {
      return (
        <ResultsEmpty
          searchQuery={searchQuery}
          cityId={cityId}
          boroughId={boroughId}
          neighborhoodId={neighborhoodId}
          hashtags={hashtags}
          contentType={contentType}
        />
      );
    }

    // Use the correctly processed items from the data hook
    if (dataHook.items.length === 0) {
      return (
        <ResultsEmpty
          searchQuery={searchQuery}
          cityId={cityId}
          boroughId={boroughId}
          neighborhoodId={neighborhoodId}
          hashtags={hashtags}
          contentType={contentType}
        />
      );
    }
    
    return (
      <ResultsContent
        items={dataHook.items}
        contentType={contentType}
        fetchNextPage={dataHook.fetchNextPage}
        hasNextPage={dataHook.hasNextPage}
        isFetchingNextPage={dataHook.isFetchingNextPage}
        processedPageError={dataHook.processedPageError}
        refetch={dataHook.refetch}
        openQuickAdd={openQuickAdd}
        handleAddToList={modalHook.handleAddToList}
        RESULTS_PER_PAGE={dataHook.RESULTS_PER_PAGE}
      />
    );
  };

  logDebug(`[Results] Displaying content for ${contentType}`);
  
  return (
    <div>
      {renderContent()}
      
      {/* AddToList Modal */}
      <AddToListModal
        isOpen={modalHook.isAddToListModalOpen}
        onClose={modalHook.handleCloseModal}
        itemToAdd={modalHook.itemToAdd}
        onItemAdded={modalHook.handleItemAdded}
      />
    </div>
  );
};

export default Results; 