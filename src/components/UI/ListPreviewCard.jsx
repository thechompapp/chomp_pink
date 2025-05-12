// src/components/UI/ListPreviewCard.jsx
import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // Added useQueryClient
import { PlusIcon, ChevronDownIcon, ChevronUpIcon as ChevronUpSolidIcon } from '@heroicons/react/24/solid'; // Renamed ChevronUpIcon to avoid conflict
import { Star, Loader2, ChevronUp, ChevronDown, ExternalLink, MessageSquare, Eye } from 'lucide-react'; // Added more icons

import { listService } from '@/services/listService';
import { logDebug, logError } from '@/utils/logger';
import { useQuickAdd } from '@/context/QuickAddContext';
import { useListDetailModal } from '@/hooks/useListDetailModal'; // Corrected hook name
import useAuthStore from '@/stores/useAuthStore';
import useFollowStore from '@/stores/useFollowStore';
import { formatRelativeDate } from '@/utils/formatting';
import { engagementService } from '@/services/engagementService';
import Button from '@/components/UI/Button'; // Assuming custom Button
import ErrorMessage from '@/components/UI/ErrorMessage'; // Assuming custom ErrorMessage
import LoadingSpinner from '@/components/UI/LoadingSpinner'; // Assuming custom LoadingSpinner
import BaseCard from './BaseCard'; // Assuming BaseCard for consistent styling and click handling

// Sub-component for displaying a single item in the preview
const PreviewListItem = ({ item }) => (
  <li className="flex items-center justify-between py-1.5 text-xs text-gray-600 dark:text-gray-300 group">
    <span className="truncate pr-2" title={item.name}>{item.name || `Item`}</span>
    {item.notes && (
      <MessageSquare size={12} className="text-gray-400 dark:text-gray-500 flex-shrink-0" title={`Notes: ${item.notes}`} />
    )}
  </li>
);

PreviewListItem.propTypes = {
  item: PropTypes.shape({
    list_item_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    notes: PropTypes.string,
  }).isRequired,
};


function ListPreviewCard({ list, className = '' }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { openQuickAddModal } = useQuickAdd(); // Assuming context provides openQuickAddModal
  const { user, isAuthenticated } = useAuthStore();
  const { openListDetailModal } = useListDetailModal(); // Using the hook
  const queryClient = useQueryClient(); // Get query client

  const listId = list?.id; // Handle potentially null list initially
  
  const { 
    isFollowing, 
    toggleFollowStatus, 
    isTogglingFollow 
  } = useFollowStore(state => ({
    isFollowing: state.isFollowing,
    toggleFollowStatus: state.toggleFollowStatus,
    isTogglingFollow: state.isTogglingFollow[listId] || false, // Get specific loading state for this list
  }));
  
  const followStatus = listId ? isFollowing(listId) : false;
  const PREVIEW_LIMIT = 3;
  
  const isOwnList = useMemo(() => 
    user && list && (
      user.id === list.user_id || 
      Number(user.id) === Number(list.user_id) || 
      list.creator_username === user.username
    ), 
  [user, list]);
  
  const handleCardClick = useCallback(() => {
    if (!listId) return;
    engagementService.logEngagement({
      item_id: parseInt(String(listId), 10), item_type: 'list', engagement_type: 'click',
    });
    openListDetailModal(listId);
  }, [listId, openListDetailModal]);

  const handleToggleFollow = async (e) => {
    e.stopPropagation(); // Prevent card click
    if (!listId || isOwnList || isTogglingFollow || !isAuthenticated) {
      if (!isAuthenticated) alert('Please log in to follow lists.');
      return;
    }
    try {
      await toggleFollowStatus(listId);
      // Optimistic update handles UI. Cache invalidation will ensure eventual consistency.
      queryClient.invalidateQueries({ queryKey: ['lists', 'following', user?.id] }); // Invalidate user's followed lists
      queryClient.invalidateQueries({ queryKey: ['listDetails', listId] }); // Invalidate this specific list's details
    } catch (error) {
      logError(`[ListPreviewCard] Error toggling follow for list ${listId}:`, error);
      alert('Failed to update follow status. Please try again.');
    }
  };

  // Query for preview items (not expanded)
  const {
    data: previewItemsData,
    isLoading: isLoadingPreview,
    error: previewError,
  } = useQuery({
    queryKey: ['listPreviewItems', listId],
    queryFn: () => listService.getListItems(listId, { limit: PREVIEW_LIMIT }),
    enabled: !!listId && !isExpanded, // Only fetch if listId exists and not expanded
    staleTime: 5 * 60 * 1000,
    select: (response) => response?.data || [],
    placeholderData: [],
  });
  const previewItems = previewItemsData || [];


  // Query for full list items (when expanded)
  const {
    data: fullListItemsData,
    isLoading: isLoadingFullList,
    error: fullListError,
  } = useQuery({
    queryKey: ['listFullItems', listId, 'expanded'], // More specific key
    queryFn: () => listService.getListItems(listId, { limit: 50 }), // Fetch more when expanded
    enabled: !!listId && isExpanded, // Only fetch if listId exists and expanded
    staleTime: 2 * 60 * 1000,
    select: (response) => response?.data || [],
    placeholderData: [],
  });
  const expandedItems = fullListItemsData || [];

  const toggleExpand = useCallback((e) => {
    e.stopPropagation(); // Prevent card click
    setIsExpanded(prev => !prev);
    engagementService.logEngagement({
      item_id: parseInt(String(listId), 10), item_type: 'list', 
      engagement_type: !isExpanded ? 'expand_preview' : 'collapse_preview',
    });
  }, [listId, isExpanded]);

  const handleQuickAddToListClick = useCallback((e) => {
    e.stopPropagation(); // Prevent card click
    if (!listId) return;
    openQuickAddModal({ defaultListId: listId, defaultListName: list.name });
  }, [listId, list?.name, openQuickAddModal]);

  // This is the CRITICAL part for display consistency:
  // Always use list.item_count from the prop for the main display.
  // The backend and cache invalidation are responsible for this prop being up-to-date.
  const displayedItemCount = list?.item_count ?? 0;
  const itemsToShowInPreview = isExpanded ? expandedItems : previewItems;
  const canShowMore = !isExpanded && displayedItemCount > PREVIEW_LIMIT;
  
  if (!list) {
    // Optional: Render a skeleton or a placeholder if list is null
    return <div className={`p-4 border rounded-lg shadow-sm animate-pulse bg-gray-200 ${className}`}>Loading list...</div>;
  }

  return (
    <BaseCard
      onClick={handleCardClick}
      className={`flex flex-col bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow duration-200 rounded-xl overflow-hidden ${className}`}
      aria-label={`View details for list: ${list.name}`}
    >
      {/* Header Section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white line-clamp-2 flex-grow" title={list.name}>
            {list.name}
          </h3>
          {isAuthenticated && !isOwnList && (
            <Button
              variant="icon"
              size="sm"
              onClick={handleToggleFollow}
              className={`flex-shrink-0 rounded-full p-1.5 ${followStatus ? 'bg-primary-500 text-white hover:bg-primary-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              title={followStatus ? 'Unfollow list' : 'Follow list'}
              isLoading={isTogglingFollow}
              aria-pressed={followStatus}
            >
              <Star size={14} className={followStatus ? 'fill-current' : ''} />
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {displayedItemCount} {displayedItemCount === 1 ? 'item' : 'items'} 
          {list.updated_at && ` · Updated ${formatRelativeDate(list.updated_at)}`}
        </p>
        {list.description && (
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2" title={list.description}>
            {list.description}
          </p>
        )}
      </div>

      {/* Items Preview/Expanded Section */}
      <div className="px-4 py-3 flex-grow min-h-[80px]"> {/* Ensure minimum height */}
        {isExpanded && isLoadingFullList && <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>}
        {isExpanded && !isLoadingFullList && fullListError && <ErrorMessage message="Could not load items." />}
        {!isExpanded && isLoadingPreview && <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>}
        {!isExpanded && !isLoadingPreview && previewError && <ErrorMessage message="Could not load preview." />}
        
        {(itemsToShowInPreview.length > 0) ? (
          <ul className="space-y-1">
            {itemsToShowInPreview.map((item) => (
              <PreviewListItem key={item.list_item_id || item.id || `item-${Math.random()}`} item={item} />
            ))}
          </ul>
        ) : (
          !isLoadingPreview && !isLoadingFullList && <p className="text-xs text-gray-400 dark:text-gray-500 italic text-center py-2">This list is currently empty.</p>
        )}
      </div>

      {/* Footer Section */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="xs"
            onClick={toggleExpand}
            className="text-primary dark:text-primary-400 hover:underline"
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <><ChevronUp size={14} className="mr-1" />Show Less</>
            ) : (
              <>
                {canShowMore ? `Show All (${displayedItemCount})` : (itemsToShowInPreview.length > 0 ? 'View Items' : 'View List')}
                <ChevronDown size={14} className="ml-1" />
              </>
            )}
          </Button>
          {isAuthenticated && (
            <Button
              variant="icon"
              size="sm"
              onClick={handleQuickAddToListClick}
              className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-400 rounded-full p-1.5"
              title="Quickly add an item to this list"
            >
              <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
        </div>
      </div>
    </BaseCard>
  );
}

ListPreviewCard.propTypes = {
  list: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    updated_at: PropTypes.string,
    item_count: PropTypes.number, // This is the key prop for item count consistency
    user_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    creator_username: PropTypes.string, // Assuming this might be available
    is_public: PropTypes.bool,
  }).isRequired,
  className: PropTypes.string,
};

export default React.memo(ListPreviewCard);
