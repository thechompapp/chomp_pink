// src/components/UI/FixedListPreviewCard.jsx
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

function FixedListPreviewCard({ list }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFollowProcessing, setIsFollowProcessing] = useState(false);
  const { openQuickAdd } = useQuickAdd();
  const { user, isAuthenticated } = useAuthStore();
  const { openListDetail } = useListDetail();
  const listId = list?.id;
  
  // Use the follow store to manage follow status
  const { isFollowing, toggleFollowStatus } = useFollowStore();
  
  // Check if this list is being followed
  const followStatus = isFollowing(listId);
  const PREVIEW_LIMIT = 3;
  
  // Check if the list is owned by current user
  const isOwnList = user && list && (
    // Check for direct ID match with type conversion
    user.id === list.user_id ||
    Number(user.id) === Number(list.user_id) ||
    // Check for explicit created_by_user flag
    list.created_by_user === true ||
    // Check username match (fallback)
    (user.username && list.creator_handle && 
     user.username.toLowerCase() === list.creator_handle.toLowerCase())
  );
  
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
    
    setIsFollowProcessing(true);
    
    try {
      const result = await toggleFollowStatus(listId, listService.toggleFollowList);
      logDebug(`[ListPreviewCard] Toggle follow result:`, result);
    } catch (error) {
      logError(`[ListPreviewCard] Error toggling follow status:`, error);
    } finally {
      setIsFollowProcessing(false);
    }
  };
  
  const {
    data: previewItems = [],
    isLoading: isLoadingPreview,
    error: previewError,
  } = useQuery({
    queryKey: ['listPreviewItems', listId],
    queryFn: () => listService.getListItems(listId, PREVIEW_LIMIT),
    enabled: !!listId && !isExpanded,
    staleTime: 5 * 60 * 1000,
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

  const hasMoreItems = (list.item_count || 0) > previewItems.length;
  const updatedAt = list.updated_at ? new Date(list.updated_at) : new Date();
  const updatedText = formatRelativeDate(updatedAt);

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-lg border border-black p-4 flex flex-col h-full relative cursor-pointer"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-black truncate mr-2" title={list.name}>
          {list.name}
        </h3>
        
        {/* Only show follow button for authenticated users and not their own lists */}
        {user && !isOwnList && (
          <button
            onClick={handleToggleFollow}
            className={`text-xs font-medium py-1 px-2 rounded-sm flex items-center ${
              followStatus 
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
      
      <p className="text-xs text-gray-500 mb-3">
        {list.item_count || 0} items • Updated {updatedText}
      </p>
      
      {/* Preview Items */}
      <div className="flex-grow">
        {isLoadingPreview ? (
          <div className="flex justify-center items-center h-16">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        ) : previewItems.length > 0 ? (
          <ul className="space-y-1 mb-2">
            {previewItems.map((item) => (
              <li key={item.id || `item-${Math.random()}`} className="text-sm truncate">
                • {item.restaurant_name || item.dish_name || 'Unknown item'}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 italic">No items in this list yet.</p>
        )}
      </div>
      
      {/* Footer */}
      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
        {list.item_count > previewItems.length ? (
          <button
            onClick={toggleExpand}
            className="text-xs text-black flex items-center"
          >
            {isExpanded ? (
              <>
                Show Less <ChevronUpIcon className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                Show More {hasMoreItems ? `(${list.item_count - previewItems.length} more)` : ''}
                <ChevronDownIcon className="h-4 w-4 ml-1" />
              </>
            )}
          </button>
        ) : (
          <div className="w-0 h-0"></div>
        )}
        
        {isAuthenticated && (
          <button
            onClick={handleQuickAddToList}
            className="p-1 text-black"
            title={`Quickly add an item to "${list.name}"`}
            aria-label={`Quickly add an item to "${list.name}"`}
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

FixedListPreviewCard.propTypes = {
  list: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    updated_at: PropTypes.string,
    item_count: PropTypes.number,
  }).isRequired,
};

export default FixedListPreviewCard;
