// src/pages/Lists/ModalListCard.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Star, Loader2 } from 'lucide-react';
import { engagementService } from '@/services/engagementService';
import { listService } from '@/services/listService';
import useAuthStore from '@/stores/useAuthStore';
import useFollowStore from '@/stores/useFollowStore';
import { useListDetail } from '@/context/ListDetailContext';
import Button from '@/components/UI/Button';
import { formatRelativeDate } from '@/utils/formatting';
import { logDebug } from '@/utils/logger';

// Item display component
const ListItemDisplay = ({ item, listType, onQuickAdd }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!item) return null;
  
  // Get appropriate secondary text based on item type
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
      {/* Only show quick add button when authenticated */}
      {isAuthenticated && onQuickAdd && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd(item);
          }}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 text-black hover:bg-gray-200 rounded-full"
          aria-label="Quick add item"
          title="Add to your list"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </li>
  );
};

const ModalListCard = ({ list, onQuickAdd }) => {
  // Local state
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFollowProcessing, setIsFollowProcessing] = useState(false);
  
  // Hook into stores/contexts
  const { user, isAuthenticated } = useAuthStore();
  const { isFollowing, toggleFollowStatus } = useFollowStore();
  const { openListDetail } = useListDetail();
  
  // Get follow status for this list
  const followStatus = isFollowing(list.id);

  // Enhanced check for list ownership that's more robust
  const isOwnList = Boolean(
    user && list && (
      // Check for direct ID match with type conversion
      user.id === list.user_id ||
      Number(user.id) === Number(list.user_id) ||
      // Check for explicit created_by_user flag
      list.created_by_user === true ||
      // Check username match (fallback)
      (user.username && list.creator_handle && 
       user.username.toLowerCase() === list.creator_handle.toLowerCase())
    )
  );

  // When list ID changes, reset expansion state
  useEffect(() => {
    setIsExpanded(false);
  }, [list.id]);
  
  // Calculate if we show follow/unfollow button
  const shouldShowFollowButton = isAuthenticated && !isOwnList;

  // Handle follow/unfollow toggle
  const handleToggleFollow = async (e) => {
    // Prevent card click propagation
    e.preventDefault();
    e.stopPropagation();
    
    // Only block if it's own list or currently processing
    if (isOwnList || isFollowProcessing) return;
    
    // If not authenticated, alert user
    if (!isAuthenticated) {
      alert('Please log in to follow lists');
      return;
    }
    
    console.log(`[ListCard] Toggling follow for list ${list.id}, current status: ${followStatus}`);
    
    try {
      setIsFollowProcessing(true);
      // Use the follow store's toggle function which handles all API interaction
      // Pass the listService.toggleFollowList function to handle the API call
      const result = await toggleFollowStatus(list.id, listService.toggleFollowList);
      
      if (result.success) {
        logDebug(`[ListCard] Successfully toggled follow status for list ${list.id} to: ${result.isFollowing}`);
        
        // Force a re-render by toggling a state variable
        setIsExpanded(prev => prev);
        
        // Trigger a custom event for any components that need to know about list follow changes
        window.dispatchEvent(new CustomEvent('listFollowChanged', { detail: { listId: list.id, following: result.isFollowing } }));
      } else {
        logDebug(`[ListCard] Failed to toggle follow status for list ${list.id}`, result.error);
      }
    } catch (error) {
      console.error(`[ListCard] Error toggling follow status for list ${list.id}:`, error);
    } finally {
      setIsFollowProcessing(false);
    }
  };

  // Memoize query configuration to avoid recreating objects on every render
  const queryConfig = useMemo(() => ({
    queryKey: ['listDetails', list.id],
    queryFn: () => listService.getListDetails(list.id),
    enabled: isExpanded,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    select: (response) => response?.data || { items: [] },
    placeholderData: { items: [] },
    refetchOnWindowFocus: false,
    retry: 1
  }), [list.id, isExpanded]);

  const { data: listDetails, isLoading, error } = useQuery(queryConfig);

  const items = listDetails?.items || [];
  const displayItems = items.slice(0, 5); // Always show only up to 5
  const hasMoreItems = (list.item_count || 0) > 5;

  // Memoize handlers to prevent recreation on each render
  const handleCardClick = useCallback((e) => {
    // Always prevent default navigation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Log the engagement
    engagementService.logEngagement({
      item_id: parseInt(String(list.id), 10),
      item_type: 'list',
      engagement_type: 'click',
    });
    
    // Use the modal context to open the list detail
    console.log(`[ModalListCard] Opening modal for list ${list.id}`);
    openListDetail(list.id);
  }, [list.id, openListDetail]);

  // Optimized toggleExpand with engagement logging for expansion actions
  const toggleExpand = useCallback((e) => {
    e.stopPropagation(); // Prevent card click propagation
    e.preventDefault();
    
    // Log expansion/collapse as an engagement action
    const newExpandedState = !isExpanded;
    engagementService.logEngagement({
      item_id: parseInt(String(list.id), 10),
      item_type: 'list',
      engagement_type: newExpandedState ? 'expand' : 'collapse',
    });
    
    setIsExpanded(newExpandedState);
  }, [isExpanded, list.id]);

  const tags = Array.isArray(list.tags) ? list.tags : [];
  const updatedAt = list.updated_at ? new Date(list.updated_at) : new Date();
  const updatedText = formatRelativeDate(updatedAt) || 'Updated recently';

  // Direct div implementation (no BaseCard) to ensure no navigation occurs
  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-lg border border-black p-4 flex flex-col h-full overflow-hidden relative w-full cursor-pointer"
    >
      {/* QuickAdd button */}
      {onQuickAdd && isAuthenticated && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onQuickAdd({
              id: list.id,
              name: list.name,
              type: 'list',
              description: list.description,
              tags: list.tags || []
            });
          }}
          aria-label="Quick Add"
          title="Add list to favorites"
          className="absolute top-1 right-1 p-1 text-black bg-white rounded-full border border-black z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      )}

      {/* Main Content Area */}
      <div className="flex-grow min-h-0 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-base font-semibold text-black line-clamp-2 flex-shrink-0">
            {list.name}
          </h3>
          {/* Only show follow button for authenticated users and not their own lists */}
          {user && !isOwnList && (
            <button
              onClick={handleToggleFollow}
              className={`ml-2 flex-shrink-0 inline-flex items-center px-2 py-1 text-xs rounded-sm z-10 ${followStatus ? 'bg-black text-white' : 'bg-white text-black border border-black'}`}
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
        <p className="text-xs text-black mb-1 flex-shrink-0">
          {/* Always use actual items array length instead of metadata to ensure accuracy */}
          {displayItems.length || (list.items?.length || (isLoading ? list.item_count : 0))} items
          {process.env.NODE_ENV !== 'production' && list.item_count !== displayItems.length && (
            <span className="text-xs text-red-500 ml-1" title={`DB shows ${list.item_count} items`}>
              (fixing...)
            </span>
          )}
        </p>
        <p className="text-xs text-black mb-2 flex-shrink-0">{updatedText}</p>

        {/* Items List (takes remaining space, scrollable if expanded) - Spotify Playlist Style */}
        <div className={`flex-grow min-h-0 overflow-y-auto no-scrollbar transition-all duration-300 ${isExpanded ? 'max-h-64' : 'max-h-28'}`}>
          {isLoading && isExpanded ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={16} className="animate-spin text-black" />
            </div>
          ) : error && isExpanded ? (
            <p className="text-xs text-red-500 mt-1">Could not load items.</p>
          ) : displayItems.length > 0 ? (
            <ul className="text-xs divide-y divide-gray-100 rounded border border-black p-1 bg-white">
              {displayItems.map((item) => (
                <ListItemDisplay 
                  key={item.list_item_id} 
                  item={item} 
                  listType={list.list_type} 
                  onQuickAdd={onQuickAdd}
                />
              ))}
            </ul>
          ) : (
            !isExpanded && <p className="text-xs text-black italic mt-1">No items preview.</p>
          )}
          {/* Placeholder if expanded but no items */}
          {isExpanded && !isLoading && items.length === 0 && (
            <p className="text-xs text-black italic mt-1">This list is empty.</p>
          )}
        </div>
      </div>

      {/* Footer Area (Tags & Show More) */}
      <div className="mt-2 pt-2 border-t border-gray-100 flex-shrink-0">
        <AnimatePresence>
          {hasMoreItems && (
            <motion.div
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.8 }}
            >
              <Button
                variant="link"
                size="sm"
                onClick={toggleExpand}
                className="!p-0 !h-auto text-xs text-primary hover:underline focus:outline-none focus:ring-0 mb-1.5 transition-colors duration-200"
                aria-expanded={isExpanded}
              >
                {isExpanded ? (
                  <><ChevronUp size={12} className="mr-0.5 transition-transform duration-200" /> Show Less</>
                ) : (
                  <><ChevronDown size={12} className="mr-0.5 transition-transform duration-200" /> Show All ({list.item_count})</>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
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

ListItemDisplay.propTypes = {
  item: PropTypes.object.isRequired,
  listType: PropTypes.string,
  onQuickAdd: PropTypes.func
};

ModalListCard.propTypes = {
  list: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    item_count: PropTypes.number,
    list_type: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    updated_at: PropTypes.string,
  }).isRequired,
  onQuickAdd: PropTypes.func
};

export default React.memo(ModalListCard);
