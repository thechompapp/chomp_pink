// src/components/UI/ListPreviewCard.jsx
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import { Star, Loader2 } from 'lucide-react';

import { listService } from '@/services/listService';
import { logDebug, logError } from '@/utils/logger';
import { useQuickAdd } from '@/context/QuickAddContext';
import { useListDetail } from '@/context/ListDetailContext';
import useAuthStore from '@/stores/useAuthStore';
import useFollowStore from '@/stores/useFollowStore';
import { formatRelativeDate } from '@/utils/formatting';
import { engagementService } from '@/services/engagementService';

function ListPreviewCard({ list }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { openQuickAdd } = useQuickAdd();
  const { user, isAuthenticated } = useAuthStore();
  const { openListDetail } = useListDetail();
  const listId = list.id;
  
  // Use the follow store to manage follow status
  const { 
    isFollowing, 
    toggleFollowStatus, 
    isTogglingFollow: isFollowProcessing 
  } = useFollowStore();
  
  // Check if this list is being followed
  const followStatus = isFollowing(listId);
  const PREVIEW_LIMIT = 3;
  
  // Fallback user ID for mock data when auth is broken
  const mockUserId = 1; // Assuming current user is ID 1
  // Check if the list is owned by current user, with fallback for mock environment
  const isOwnList = user ? (list && user.id === list.user_id) : (list && mockUserId === list.user_id);
  
  // Handle card click to open modal
  const handleCardClick = useCallback((e) => {
    // Prevent default navigation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Log engagement
    engagementService.logEngagement({
      item_id: parseInt(String(listId), 10),
      item_type: 'list',
      engagement_type: 'click',
    });
    
    // Open the modal
    console.log(`[ListPreviewCard] Opening modal for list ${listId}`);
    openListDetail(listId);
  }, [listId, openListDetail]);

  // Handle follow/unfollow toggle
  const handleToggleFollow = async (e) => {
    // Prevent navigation to list detail
    e.preventDefault();
    e.stopPropagation();
    
    // Only block if it's own list or currently processing
    if (isOwnList || isFollowProcessing) return;
    
    // If not authenticated, show alert
    if (!isAuthenticated) {
      alert('Please log in to follow lists');
      return;
    }
    
    console.log(`[ListPreviewCard] Toggling follow for list ${listId}, current status: ${followStatus}`);
    
    try {
      // Use the follow store's toggle function which handles all API interaction
      // This now uses optimistic updates so UI should update immediately
      const result = await toggleFollowStatus(listId);
      
      if (result.success) {
        logDebug(`[ListPreviewCard] Successfully toggled follow status for list ${listId} to: ${result.isFollowing}`);
        
        // Force component re-render
        setIsExpanded(prev => prev);
        
        // Trigger a custom event for any components that need to know about list follow changes
        window.dispatchEvent(new CustomEvent('listFollowChanged', { 
          detail: { listId, following: result.isFollowing } 
        }));
      } else {
        logError(`[ListPreviewCard] Failed to toggle follow status for list ${listId}`, result.error);
      }
    } catch (error) {
      logError(`[ListPreviewCard] Error toggling follow status for list ${listId}:`, error);
    }
  };

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
    <div 
      onClick={handleCardClick}
      className="bg-white border border-black rounded-lg p-4 h-full flex flex-col cursor-pointer relative"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-black truncate mr-2" title={list.name}>
          {list.name}
        </h3>
        {/* Only show follow button for authenticated users and not their own lists */}
        {user && !isOwnList && (
            <button
              onClick={handleToggleFollow}
              className={`text-xs font-medium py-1 px-2 rounded-sm flex items-center ${followStatus
                ? 'bg-black text-white'
                : 'bg-white text-black border border-black'
                }`}
              title={followStatus ? 'Unfollow this list' : 'Follow this list'}
            >
              {isFollowProcessing ? (
                <Loader2 size={12} className="animate-spin mr-1" />
              ) : (
                <Star size={12} className={`mr-1 ${followStatus ? 'fill-white' : ''}`} />
              )}
              {followStatus ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
        <p className="text-xs text-black mb-3">
          {list.item_count ?? 0} items · Updated {formatRelativeDate(list.updated_at)}
          {list.description && <span className="block truncate mt-1" title={list.description}> {list.description} </span>}
        </p>

        <div className="mb-2 min-h-[60px]">
          {content}
        </div>
      </Link>

      <div className="px-4 py-2 flex justify-between items-center">
        {list.item_count > 0 ? (
          <button
            onClick={toggleExpand}
            className="text-sm font-medium flex items-center p-1"
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
          className="p-1 text-black"
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