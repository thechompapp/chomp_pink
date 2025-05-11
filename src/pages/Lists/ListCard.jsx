/* src/pages/Lists/ListCard.jsx */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Star, Loader2 } from 'lucide-react';
import { useListDetail } from '@/context/ListDetailContext';
import { engagementService } from '@/services/engagementService';
import { listService } from '@/services/listService';
import useAuthStore from '@/stores/useAuthStore';
import useFollowStore from '@/stores/useFollowStore';
import BaseCard from '@/components/UI/BaseCard';
import Button from '@/components/UI/Button';
import { formatRelativeDate } from '@/utils/formatting';
import { logDebug, logError } from '@/utils/logger';

// Separate component for empty/error state
const EmptyListCard = ({ error }) => (
  <BaseCard className="bg-white rounded-lg border border-black p-4 h-full">
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-sm text-gray-500 text-center">
        <p>Unable to display this list.</p>
        {error && process.env.NODE_ENV === 'development' && (
          <p className="text-xs text-red-500 mt-1">
            {error.message || 'Unknown error'}
          </p>
        )}
      </div>
    </div>
  </BaseCard>
);

// Spotify-like list item display within the card
const ListItemDisplay = ({ item, listType, onQuickAdd }) => {
  try {
    // Check if user is authenticated
    const { isAuthenticated } = useAuthStore();
    
    if (!item || item.id == null) return null;
    let linkTo = '#';
    let secondaryText = '';
    if (item.item_type === 'restaurant') {
      linkTo = `/restaurants/${item.id}`;
      secondaryText = item.city || item.neighborhood || '';
    } else if (item.item_type === 'dish') {
      linkTo = `/dishes/${item.id}`;
      secondaryText = item.restaurant_name || '';
    }

    const handleQuickAdd = (e) => {
      if (!e) return;
      e.preventDefault();
      e.stopPropagation();
      if (onQuickAdd) {
        onQuickAdd({
          id: item.id,
          name: item.name,
          type: item.item_type || 'restaurant'
        });
      }
    };

    return (
      <li className="flex items-center justify-between py-1.5 hover:bg-gray-50 rounded px-1 group" title={item.name}>
        <div className="flex-1 min-w-0">
          <span className="text-black hover:underline text-xs font-medium block truncate">
            {item.name}
          </span>
          {secondaryText && <span className="text-black text-xs block truncate opacity-70">{secondaryText}</span>}
        </div>
        {isAuthenticated && onQuickAdd && (
          <button 
            onClick={handleQuickAdd}
            className="text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            title="Add to a list"
          >
            Add
          </button>
        )}
      </li>
    );
  } catch (error) {
    console.error('[ListItemDisplay] Error rendering item:', error);
    return null;
  }
};

// Simple list card that doesn't use any hooks
const SimpleListCard = ({ list, onClick }) => {
  // Safely access list properties with defaults
  const listName = list?.name || 'Unnamed List';
  const itemCount = list?.items?.length || list?.items_count || 0;
  const updatedAt = list?.updated_at ? new Date(list.updated_at) : new Date();
  const updatedText = formatRelativeDate(updatedAt) || 'Updated recently';

  return (
    <BaseCard 
      onClick={onClick}
      className="bg-white rounded-lg border border-black p-4 flex flex-col h-full overflow-hidden relative w-full cursor-pointer"
    >
      <div className="flex-grow min-h-0 overflow-hidden flex flex-col">
        <h3 className="text-base font-semibold text-black line-clamp-2 flex-shrink-0 mb-1">
          {listName}
        </h3>
        <p className="text-xs text-black mb-1 flex-shrink-0">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </p>
        <p className="text-xs text-black mb-2 flex-shrink-0">{updatedText}</p>
        <div className="flex-grow min-h-0 overflow-y-auto no-scrollbar max-h-28">
          <p className="text-xs text-gray-500">Click to view details</p>
        </div>
      </div>
    </BaseCard>
  );
};

const ListCard = (props) => {
  // Early return for invalid props before any hooks
  if (!props || !props.list || !props.list.id) {
    console.error('[ListCard] Invalid props or missing list ID:', props);
    return <EmptyListCard error={new Error('Missing or invalid list data')} />;
  }

  // Destructure with defaults
  const { list, onQuickAdd } = props;
  // Safe list ID is crucial
  const safeListId = String(list.id);

  // All hooks must always be called unconditionally, at the top level
  const [isExpanded, setIsExpanded] = useState(false);
  const [followStatus, setFollowStatus] = useState(Boolean(list.is_following));
  const { openListDetail } = useListDetail() || {};
  const { user, isAuthenticated } = useAuthStore() || {};
  const { isFollowing } = useFollowStore() || {};

  // React Query v5 syntax
  const {
    data: itemsData,
    isLoading,
    isError
  } = useQuery({
    queryKey: ['list-items', safeListId, isExpanded],
    queryFn: async () => {
      return listService.getListItems(safeListId);
    },
    enabled: isExpanded && Boolean(safeListId),
    staleTime: 60000,
    retry: 1,
    onError: (error) => {
      console.error(`[ListCard] Error fetching items for list ${safeListId}:`, error);
    }
  });

  const displayItems = useMemo(() => {
    if (isError || !itemsData?.data) {
      return Array.isArray(list.items) ? list.items : [];
    }
    return itemsData.data;
  }, [itemsData, isError, list.items]);

  const isOwnList = useMemo(() => {
    if (!user) return false;
    return (
      (list.user_id != null && user.id != null && list.user_id === user.id) ||
      (list.created_by_user === true) ||
      (list.creator_handle != null && user.username != null && list.creator_handle === user.username)
    );
  }, [user, list]);

  useEffect(() => {
    try {
      if (list.is_following !== undefined) {
        setFollowStatus(Boolean(list.is_following));
      } else {
        try {
          const key = `follow_state_${safeListId}`;
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            setFollowStatus(Boolean(parsed.isFollowing));
          } else if (isFollowing && typeof isFollowing === 'function') {
            setFollowStatus(isFollowing(safeListId));
          }
        } catch (storageError) {
          console.error('[ListCard] Error checking localStorage follow state:', storageError);
        }
      }
    } catch (error) {
      console.error('[ListCard] Error initializing follow status:', error);
    }
  }, [list.is_following, safeListId, isFollowing]);

  useEffect(() => {
    setIsExpanded(false);
  }, [safeListId]);

  const shouldShowFollowButton = isAuthenticated && !isOwnList;

  // Handlers (can use try/catch inside these)
  const handleCardClick = useCallback(() => {
    try {
      if (openListDetail) {
        openListDetail(safeListId);
      }
    } catch (error) {
      console.error('[ListCard] Error in card click handler:', error);
    }
  }, [safeListId, openListDetail]);

  const handleToggleExpand = useCallback((e) => {
    try {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      const newExpandedState = !isExpanded;
      try {
        engagementService.logEngagement({
          item_id: parseInt(safeListId, 10),
          item_type: 'list',
          engagement_type: newExpandedState ? 'expand' : 'collapse',
        });
      } catch (error) {
        console.error('[ListCard] Error logging engagement:', error);
      }
      setIsExpanded(newExpandedState);
    } catch (error) {
      console.error('[ListCard] Error in toggle expand handler:', error);
    }
  }, [isExpanded, safeListId]);

  // Render
  const listName = list.name || 'Unnamed List';
  const updatedAt = list.updated_at ? new Date(list.updated_at) : new Date();
  const updatedText = formatRelativeDate(updatedAt) || 'Updated recently';
  const itemCount = list.items?.length || list.items_count || 0;

  return (
    <BaseCard
      onClick={handleCardClick}
      className="bg-white rounded-lg border border-black p-4 flex flex-col h-full overflow-hidden relative w-full cursor-pointer"
    >
      {/* Main Content Area */}
      <div className="flex-grow min-h-0 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-base font-semibold text-black line-clamp-2 flex-shrink-0">
            {listName}
          </h3>
          {/* Only show follow button for authenticated users and not their own lists */}
          {user && !isOwnList && (
            <div className="ml-2 relative z-50">
              {/* Plain HTML button for maximum reliability */}
              <button
                id={`follow-btn-${safeListId}`}
                className={`inline-flex items-center px-2 py-1 text-xs rounded-sm relative ${followStatus ? 'bg-black text-white' : 'bg-white text-black border border-black'}`}
                style={{
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  position: 'relative',
                  zIndex: 9999,
                }}
                onClick={function (e) {
                  try {
                    if (e) {
                      e.stopPropagation();
                      e.preventDefault();
                    }
                    setFollowStatus((prev) => !prev);
                    try {
                      const btn = document.getElementById(`follow-btn-${safeListId}`);
                      if (!btn) {
                        console.warn(`[ListCard] Button element for list ${safeListId} not found in DOM`);
                        return;
                      }
                      const isCurrentlyFollowing = btn.classList.contains('bg-black');
                      const textLabel = btn.querySelector('.text-label');
                      if (isCurrentlyFollowing) {
                        btn.classList.remove('bg-black', 'text-white');
                        btn.classList.add('bg-white', 'text-black', 'border', 'border-black');
                        if (textLabel) textLabel.textContent = 'Follow';
                      } else {
                        btn.classList.remove('bg-white', 'text-black', 'border', 'border-black');
                        btn.classList.add('bg-black', 'text-white');
                        if (textLabel) textLabel.textContent = 'Following';
                      }
                      try {
                        const key = `follow_state_${safeListId}`;
                        localStorage.setItem(
                          key,
                          JSON.stringify({
                            isFollowing: !isCurrentlyFollowing,
                            updatedAt: new Date().toISOString(),
                          })
                        );
                      } catch (storageErr) {
                        console.warn('[ListCard] Error updating localStorage:', storageErr);
                      }
                      console.debug(
                        `[ListCard] Button for list ${safeListId} clicked and toggled to: ${!isCurrentlyFollowing}`
                      );
                    } catch (err) {
                      console.error('[ListCard] Follow button DOM manipulation error:', err);
                    }
                  } catch (clickError) {
                    console.error('[ListCard] Error in follow button click handler:', clickError);
                  }
                }}
              >
                <Star className={`mr-1 ${followStatus ? 'fill-white' : ''}`} size={12} />
                <span className="text-label">{followStatus ? 'Following' : 'Follow'}</span>
              </button>
            </div>
          )}
        </div>
        {/* Fixed: Make item count consistent with the modal */}
        <p className="text-xs text-black mb-1 flex-shrink-0">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </p>
        <p className="text-xs text-black mb-2 flex-shrink-0">{updatedText}</p>
        {/* Items List (takes remaining space, scrollable if expanded) - Spotify Playlist Style */}
        <div
          className={`flex-grow min-h-0 overflow-y-auto no-scrollbar transition-all duration-300 ${isExpanded ? 'max-h-64' : 'max-h-28'}`}
        >
          {isLoading && isExpanded ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin text-gray-500" size={24} />
            </div>
          ) : (
            <ul className="space-y-1">
              {Array.isArray(displayItems) &&
                displayItems.map((item) =>
                  item && item.id ? (
                    <ListItemDisplay
                      key={`${item.id}-${item.item_type || 'unknown'}`}
                      item={item}
                      listType={list.type}
                      onQuickAdd={onQuickAdd}
                    />
                  ) : null
                )}
            </ul>
          )}
        </div>
      </div>
      {/* Expand/Collapse Button */}
      <div className="flex justify-center mt-2">
        <button
          className="text-black/70 hover:text-black p-1 rounded-full transition-colors flex items-center text-xs font-medium"
          onClick={handleToggleExpand}
        >
          {isExpanded ? (
            <>
              <ChevronUp size={16} className="mr-1" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown size={16} className="mr-1" />
              Show more
            </>
          )}
        </button>
      </div>
    </BaseCard>
  );
};

ListCard.propTypes = {
  list: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string,
    user_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    created_by_user: PropTypes.bool,
    creator_handle: PropTypes.string,
    is_following: PropTypes.bool,
    items_count: PropTypes.number,
    items: PropTypes.array,
    updated_at: PropTypes.string,
    tags: PropTypes.array
  }),
  onQuickAdd: PropTypes.func
};

export default ListCard;
