// src/components/UI/ListPreviewCard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';

import BaseCard from './BaseCard';
import ListDetail from '@/pages/Lists/ListDetail';
import { listService } from '@/services/listService';
import { logDebug, logError } from '@/utils/logger';
import { useQuickAdd } from '@/context/QuickAddContext';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { formatRelativeDate } from '@/utils/formatting';

function ListPreviewCard({ list }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { openQuickAdd } = useQuickAdd();
  const listId = list.id;
  const PREVIEW_LIMIT = 3;

  const {
    data: previewItems = [],
    isLoading: isLoadingPreview,
    error: previewError,
    isError: isPreviewError,
  } = useQuery({
    queryKey: ['listPreviewItems', listId],
    queryFn: () => listService.getListItems(listId, PREVIEW_LIMIT),
    enabled: !!listId && !isExpanded,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    onError: (err) => {
      logError(`[ListPreviewCard] Error fetching items for list ${listId}:`, err);
    },
    onSuccess: (data) => {
      logDebug(`[ListPreviewCard] Fetched ${data?.data?.length || 0} items for list ${listId}`);
    },
    select: (data) => {
      // Handle both legacy and new API response formats
      if (Array.isArray(data)) return data.slice(0, PREVIEW_LIMIT);
      if (data?.data) return data.data.slice(0, PREVIEW_LIMIT) || [];
      return [];
    },
  });

  const toggleExpand = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsExpanded(!isExpanded);
  };

  const handleQuickAddToList = (e) => {
    e.stopPropagation();
    e.preventDefault();
    logDebug(`[ListPreviewCard] Triggering Quick Add for list ID: ${listId}`);
    openQuickAdd({ defaultListId: listId, defaultListName: list.name });
  };

  // Fetch full list details only when expanded
  const {
    data: fullListData,
    isLoading: isLoadingFullList,
    isError: isFullListError,
    error: fullListError
  } = useQuery({
    queryKey: ['listFullDetails', listId],
    queryFn: () => listService.getListDetails(listId),
    enabled: !!listId && isExpanded,
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    onError: (err) => {
      logError(`[ListPreviewCard] Error fetching full list details for ${listId}:`, err);
    }
  });

  let content;
  
  if (isExpanded) {
    if (isLoadingFullList) {
      content = <LoadingSpinner />;
    } else if (isFullListError) {
      content = <ErrorMessage message={`Error loading list: ${fullListError?.message || 'Could not load list details'}`} />;
    } else if (fullListData) {
      // Rather than embedding the ListDetail component which has many dependencies,
      // we'll render a simplified version of the list items
      const listItems = fullListData?.items || [];
      content = (
        <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
          <h4 className="font-medium mb-2">All Items:</h4>
          {listItems.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {listItems.map((item, index) => (
                <li key={item.list_item_id || `item-${index}`} className="flex justify-between items-center">
                  <span>{item.name || `Item ${index + 1}`}</span>
                  {item.notes && <span className="text-xs italic text-gray-500">- {item.notes}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No items in this list.</p>
          )}
        </div>
      );
    }
  } else if (isLoadingPreview) {
    content = <LoadingSpinner size="sm" />;
  } else if (isPreviewError) {
    content = <ErrorMessage message={`Error loading preview: ${previewError?.message || 'Unknown error'}`} />;
  } else if (previewItems.length > 0) {
    content = (
      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
        {previewItems.map((item, index) => (
          <li key={item.list_item_id || `preview-${index}`} className="truncate">
            {item.name || `Item ${index + 1}`}
            {item.notes && <span className="text-xs italic text-gray-500 ml-1"> - {item.notes}</span>}
          </li>
        ))}
      </ul>
    );
  } else {
    content = <p className="text-sm text-gray-500 dark:text-gray-400">This list is empty.</p>;
  }

  const hasMoreItems = list.item_count > PREVIEW_LIMIT;

  return (
    <BaseCard className="relative flex flex-col h-full p-0 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <Link to={`/lists/${listId}`} className="flex-grow p-4 block cursor-pointer">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate mr-2" title={list.name}>
            {list.name}
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {list.item_count ?? 0} items · Updated {formatRelativeDate(list.updated_at)}
          {list.description && <span className="block truncate mt-1" title={list.description}> {list.description} </span>}
        </p>

        <div className="mb-2 min-h-[60px]">
          {content}
        </div>
      </Link>

      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
        {list.item_count > 0 ? (
          <button
            onClick={toggleExpand}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center p-1 -ml-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <>Show Less <ChevronUpIcon className="h-4 w-4 ml-1" /></>
            ) : (
              <>
                Show More {hasMoreItems ? `(${list.item_count - previewItems.length} more)` : ''}
                <ChevronDownIcon className="h-4 w-4 ml-1" />
              </>
            )}
          </button>
        ) : (
          <div aria-hidden="true" className="w-0 h-0"></div>
        )}

        <button
          onClick={handleQuickAddToList}
          className="p-1 rounded-full text-gray-500 hover:text-blue-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-700 transition-colors"
          title={`Quickly add an item to "${list.name}"`}
          aria-label={`Quickly add an item to "${list.name}"`}
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </div>
    </BaseCard>
  );
}

ListPreviewCard.propTypes = {
  list: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    updated_at: PropTypes.string,
    item_count: PropTypes.number,
  }).isRequired,
};

export default ListPreviewCard;