// src/components/UI/ModalListPreviewCard.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Star, Loader2, PlusCircle } from 'lucide-react'; // Added PlusCircle
import { engagementService } from '@/services/engagementService';
import { listService } from '@/services/listService';
import useAuthStore from '@/stores/useAuthStore';
import useFollowStore from '@/stores/useFollowStore';
import { useListDetail } from '@/contexts/ListDetailContext';
import Button from '@/components/UI/Button'; // Assuming this is your custom Button
import { formatRelativeDate } from '@/utils/formatting';
import { logDebug, logError } from '@/utils/logger'; // Added logError

// Item display component
const ListItemDisplay = ({ item, onQuickAddToList }) => { // Renamed onQuickAdd to onQuickAddToList for clarity
  const { isAuthenticated } = useAuthStore();
  
  if (!item) return null;
  
  let secondaryText = '';
  if (item.item_type === 'restaurant') {
    secondaryText = item.city || item.neighborhood || '';
  } else if (item.item_type === 'dish') {
    secondaryText = item.restaurant_name || '';
  }

  return (
    <li className="flex items-center justify-between py-1.5 hover:bg-gray-50 rounded px-1 group" title={item.name}>
      <div className="flex-1 min-w-0">
        <span className="text-black hover:underline text-xs font-medium block truncate">
          {item.name}
        </span>
        {secondaryText && <span className="text-black text-xs block truncate opacity-70">{secondaryText}</span>}
      </div>
      {isAuthenticated && onQuickAddToList && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickAddToList(item); // Use the renamed prop
          }}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 text-primary hover:bg-gray-200 rounded-full"
          aria-label={`Add ${item.name} to your list`}
          title={`Add ${item.name} to your list`}
        >
          <PlusCircle size={14} />
        </button>
      )}
    </li>
  );
};

ListItemDisplay.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string,
    item_type: PropTypes.string,
    city: PropTypes.string,
    neighborhood: PropTypes.string,
    restaurant_name: PropTypes.string,
    list_item_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Added list_item_id
  }).isRequired,
  onQuickAddToList: PropTypes.func, // Renamed prop
};


const ModalListPreviewCard = ({ list, onAddToList, // Renamed onQuickAdd to onAddToList (for adding the *list* itself)
                                  onAddItemFromPreview, // New prop for adding an *item* from the preview
                               }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFollowProcessing, setIsFollowProcessing] = useState(false);
  
  const { user, isAuthenticated } = useAuthStore();
  const { isFollowing, toggleFollowStatus } = useFollowStore();
  const { openListDetail } = useListDetail();
  
  const followStatus = list ? isFollowing(list.id) : false;

  const isOwnList = useMemo(() => Boolean(
    user && list && (
      user.id === list.user_id ||
      Number(user.id) === Number(list.user_id) ||
      list.created_by_user === true ||
      (user.username && list.creator_handle && 
       user.username.toLowerCase() === list.creator_handle.toLowerCase())
    )
  ), [user, list]);

  useEffect(() => {
    setIsExpanded(false);
  }, [list?.id]);
  
  const shouldShowFollowButton = isAuthenticated && !isOwnList && list;

  const handleToggleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!list || isOwnList || isFollowProcessing || !isAuthenticated) {
      if(!isAuthenticated) alert('Please log in to follow lists');
      return;
    }
    
    logDebug(`[ModalListPreviewCard] Toggling follow for list ${list.id}, current status: ${followStatus}`);
    setIsFollowProcessing(true);
    try {
      const result = await toggleFollowStatus(list.id, listService.toggleFollowList);
      if (result.success) {
        logDebug(`[ModalListPreviewCard] Successfully toggled follow status for list ${list.id} to: ${result.isFollowing}`);
        window.dispatchEvent(new CustomEvent('listFollowChanged', { detail: { listId: list.id, following: result.isFollowing } }));
      } else {
        logError(`[ModalListPreviewCard] Failed to toggle follow status for list ${list.id}`, result.error);
      }
    } catch (error) {
      logError(`[ModalListPreviewCard] Error toggling follow status for list ${list.id}:`, error);
    } finally {
      setIsFollowProcessing(false);
    }
  };

  const queryConfig = useMemo(() => ({
    queryKey: ['listDetailsPreview', list?.id], // Use list?.id to handle potential null list
    queryFn: () => listService.getListDetails(list.id),
    enabled: !!(isExpanded && list?.id), // Ensure list and list.id exist
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    select: (response) => response?.data || { items: [] },
    placeholderData: { items: [] }, // Provide placeholder to avoid issues with undefined data
    refetchOnWindowFocus: false,
    retry: 1
  }), [list?.id, isExpanded]);

  const { data: listDetails, isLoading: isListDetailsLoading, error: listDetailsError } = useQuery(queryConfig);

  // Use listDetails from query if expanded, otherwise use list.items if available (e.g. from initial prop)
  const currentItems = useMemo(() => {
    if (isExpanded && listDetails?.items) return listDetails.items;
    if (list?.items) return list.items; // Fallback to items passed in the list prop if not expanded
    return [];
  }, [isExpanded, listDetails, list?.items]);

  const displayItemsPreview = useMemo(() => currentItems.slice(0, 5), [currentItems]);
  
  // Prioritize list.item_count if available and a number, otherwise fallback to currentItems.length
  const currentItemCount = useMemo(() => {
    if (list && typeof list.item_count === 'number') {
      return list.item_count;
    }
    return currentItems.length; // Fallback to actual items length if item_count is not reliable
  }, [list, currentItems]);

  const hasMoreItemsThanPreview = currentItemCount > 5;


  const handleCardClick = useCallback((e) => {
    if (!list) return;
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    engagementService.logEngagement({
      item_id: parseInt(String(list.id), 10),
      item_type: 'list',
      engagement_type: 'click',
    });
    logDebug(`[ModalListPreviewCard] Opening modal for list ${list.id}`);
    openListDetail(list.id);
  }, [list?.id, openListDetail]);

  const toggleExpand = useCallback((e) => {
    if (!list) return;
    e.stopPropagation();
    e.preventDefault();
    const newExpandedState = !isExpanded;
    engagementService.logEngagement({
      item_id: parseInt(String(list.id), 10),
      item_type: 'list',
      engagement_type: newExpandedState ? 'expand' : 'collapse',
    });
    setIsExpanded(newExpandedState);
  }, [isExpanded, list?.id]);

  if (!list) { // Handle case where list prop might be null or undefined
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col h-full overflow-hidden relative w-full items-center justify-center">
            <p className="text-xs text-gray-500">List data not available.</p>
        </div>
    );
  }

  const tags = Array.isArray(list.tags) ? list.tags : [];
  const updatedAt = list.updated_at ? new Date(list.updated_at) : new Date();
  const updatedText = formatRelativeDate(updatedAt) || 'Updated recently';

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-lg border border-gray-300 hover:border-gray-400 transition-colors duration-150 p-3 sm:p-4 flex flex-col h-full overflow-hidden relative w-full cursor-pointer shadow-sm hover:shadow-md"
    >
      {onAddToList && isAuthenticated && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddToList(list); // Pass the whole list object
          }}
          aria-label={`Add ${list.name} to your selection`}
          title={`Add ${list.name} to your selection`}
          className="absolute top-2 right-2 p-1.5 text-gray-500 hover:text-primary bg-white hover:bg-gray-100 rounded-full border border-gray-300 z-10 transition-colors"
        >
          <PlusCircle size={18} />
        </button>
      )}

      <div className="flex-grow min-h-0 overflow-hidden flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 line-clamp-2 flex-grow pr-2">
            {list.name}
          </h3>
          {shouldShowFollowButton && (
            <button
              onClick={handleToggleFollow}
              className={`ml-2 flex-shrink-0 inline-flex items-center px-2 py-1 text-xs rounded-full z-10 transition-colors ${followStatus ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'}`}
              title={followStatus ? 'Unfollow this list' : 'Follow this list'}
            >
              {isFollowProcessing ? (
                <Loader2 size={12} className="animate-spin mr-1" />
              ) : (
                <Star size={12} className={`mr-1 ${followStatus ? 'fill-current' : 'fill-none stroke-current'}`} />
              )}
              {followStatus ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-1 flex-shrink-0">
          {currentItemCount} {currentItemCount === 1 ? 'item' : 'items'}
        </p>
        <p className="text-xs text-gray-400 mb-2 flex-shrink-0">{updatedText}</p>

        <div className={`flex-grow min-h-0 overflow-y-auto no-scrollbar transition-all duration-300 ${isExpanded ? 'max-h-48 sm:max-h-64' : 'max-h-24 sm:max-h-28'}`}>
          {isExpanded && isListDetailsLoading ? (
            <div className="flex items-center justify-center h-full py-4">
              <Loader2 size={16} className="animate-spin text-gray-500" />
            </div>
          ) : isExpanded && listDetailsError ? (
            <p className="text-xs text-red-500 mt-1 px-1">Could not load items.</p>
          ) : displayItemsPreview.length > 0 ? (
            <ul className="text-xs divide-y divide-gray-200 rounded border border-gray-200 p-1 bg-gray-50">
              {displayItemsPreview.map((item) => (
                <ListItemDisplay 
                  key={item.list_item_id || item.id} // Use list_item_id or fallback to item.id
                  item={item} 
                  onQuickAddToList={onAddItemFromPreview} // Pass the new prop here
                />
              ))}
            </ul>
          ) : (
            !isExpanded && <p className="text-xs text-gray-400 italic mt-1 px-1">No items preview.</p>
          )}
          {isExpanded && !isListDetailsLoading && currentItems.length === 0 && (
            <p className="text-xs text-gray-400 italic mt-1 px-1">This list is empty.</p>
          )}
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-200 flex-shrink-0">
        <AnimatePresence>
          {hasMoreItemsThanPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button
                variant="link"
                size="sm"
                onClick={toggleExpand}
                className="!p-0 !h-auto text-xs text-primary hover:underline focus:outline-none focus:ring-0 mb-1.5 transition-colors duration-200"
                aria-expanded={isExpanded}
              >
                {isExpanded ? (
                  <><ChevronUp size={14} className="mr-0.5" /> Show Less</>
                ) : (
                  <><ChevronDown size={14} className="mr-0.5" /> Show All ({currentItemCount})</>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600 whitespace-nowrap">
                #{tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px] text-gray-600">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

ModalListPreviewCard.propTypes = {
  list: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    item_count: PropTypes.number, // This should be the source of truth from the backend
    items: PropTypes.array, // Optional: items might be pre-loaded
    user_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    created_by_user: PropTypes.bool,
    creator_handle: PropTypes.string,
    list_type: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    updated_at: PropTypes.string,
  }), // List can be null initially
  onAddToList: PropTypes.func, // For adding the list itself (e.g. to a user's collection of lists)
  onAddItemFromPreview: PropTypes.func, // For adding an item *from* this list's preview to another list
};

export default React.memo(ModalListPreviewCard);