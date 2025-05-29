/* src/pages/Lists/ListCard.jsx */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Star, Loader2, Eye } from 'lucide-react';
import { useListDetail } from '@/contexts/ListDetailContext';
import { engagementService } from '@/services/engagementService';
import { listService } from '@/services/listService';
import useAuthStore from '@/stores/useAuthStore';
import useFollowStore from '@/stores/useFollowStore';
import BaseCard from '@/components/UI/BaseCard';
import Button from '@/components/UI/Button';
import ListDetailModal from '@/components/UI/ListDetailModal';
import { formatRelativeDate } from '@/utils/formatting';
import { logDebug, logError } from '@/utils/logger';

// Maximum items to show in preview mode
const PREVIEW_ITEM_LIMIT = 5;

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
const ListItemDisplay = ({ item, listType, onQuickAdd, showQuickAdd = true }) => {
  try {
    // Check if user is authenticated
    const { isAuthenticated } = useAuthStore();
    
    if (!item || item.id == null) return null;
    let linkTo = '#';
    let secondaryText = '';
    let priceDisplay = '';
    
    if (item.item_type === 'restaurant') {
      linkTo = `/restaurants/${item.id}`;
      secondaryText = item.city || item.neighborhood || '';
      if (item.price_range) {
        priceDisplay = item.price_range;
      }
    } else if (item.item_type === 'dish') {
      linkTo = `/dishes/${item.id}`;
      secondaryText = item.restaurant_name || '';
      if (item.price) {
        priceDisplay = `$${parseFloat(item.price).toFixed(2)}`;
      }
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
          {secondaryText && (
            <span className="text-black text-xs block truncate opacity-70">
              {secondaryText}
            </span>
          )}
        </div>
        {priceDisplay && (
          <span className="text-xs text-gray-600 font-medium mx-2">
            {priceDisplay}
          </span>
        )}
        {isAuthenticated && onQuickAdd && showQuickAdd && (
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
  const [followStatus, setFollowStatus] = useState(Boolean(list.is_following));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, isAuthenticated } = useAuthStore() || {};
  const { isFollowing } = useFollowStore() || {};

  // Load list details to get accurate item count
  const {
    data: listDetailsData,
    isLoading: isLoadingDetails,
    isError: isErrorDetails
  } = useQuery({
    queryKey: ['list-details', safeListId],
    queryFn: async () => {
      return listService.getListDetails(safeListId);
    },
    enabled: Boolean(safeListId),
    staleTime: 60000,
    retry: 1,
    onError: (error) => {
      console.error(`[ListCard] Error fetching list details for ${safeListId}:`, error);
    }
  });

  // Load preview items (first 5) for the card
  const {
    data: itemsData,
    isLoading,
    isError
  } = useQuery({
    queryKey: ['list-items-preview', safeListId],
    queryFn: async () => {
      return listService.getListItems(safeListId, { limit: PREVIEW_ITEM_LIMIT });
    },
    enabled: Boolean(safeListId),
    staleTime: 60000,
    retry: 1,
    onError: (error) => {
      console.error(`[ListCard] Error fetching preview items for list ${safeListId}:`, error);
    }
  });

  const displayItems = useMemo(() => {
    if (isError || !itemsData?.data) {
      return Array.isArray(list.items) ? list.items.slice(0, PREVIEW_ITEM_LIMIT) : [];
    }
    return itemsData.data.slice(0, PREVIEW_ITEM_LIMIT);
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

  const shouldShowFollowButton = isAuthenticated && !isOwnList;

  // Handlers (can use try/catch inside these)
  const handleCardClick = useCallback(() => {
    try {
      setIsModalOpen(true);
    } catch (error) {
      console.error('[ListCard] Error in card click handler:', error);
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleShowMore = useCallback((e) => {
    try {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      setIsModalOpen(true);
      
      // Log engagement
      try {
        engagementService.logEngagement({
          item_id: parseInt(safeListId, 10),
          item_type: 'list',
          engagement_type: 'view_full',
        });
      } catch (error) {
        console.error('[ListCard] Error logging engagement:', error);
      }
    } catch (error) {
      console.error('[ListCard] Error in show more handler:', error);
    }
  }, [safeListId]);

  // Render
  const listName = list.name || 'Unnamed List';
  const updatedAt = list.updated_at ? new Date(list.updated_at) : new Date();
  const updatedText = formatRelativeDate(updatedAt) || 'Updated recently';
  
  // Use accurate item count from listDetailsData if available
  const itemCount = useMemo(() => {
    // If we have details data, use the items array length from there
    if (listDetailsData?.items && Array.isArray(listDetailsData.items)) {
      return listDetailsData.items.length;
    }
    // Fallback to original calculation
    return list.items?.length || list.items_count || 0;
  }, [list.items, list.items_count, listDetailsData?.items]);

  const hasMoreItems = itemCount > PREVIEW_ITEM_LIMIT;

  return (
    <>
      <BaseCard
        onClick={handleCardClick}
        className="bg-white rounded-lg border border-black p-4 flex flex-col h-full overflow-hidden relative w-full cursor-pointer hover:shadow-lg transition-shadow"
      >
        {/* Main Content Area */}
        <div className="flex-grow min-h-0 overflow-hidden flex flex-col">
          <div className="flex justify-between items-start mb-1">
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-black line-clamp-2 flex-shrink-0">
                {listName}
              </h3>
              {list.description && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {list.description}
                </p>
              )}
            </div>
            {/* Only show follow button for authenticated users and not their own lists */}
            {user && !isOwnList && (
              <div className="ml-2 relative z-50 flex-shrink-0">
                <button
                  id={`follow-btn-${safeListId}`}
                  className={`inline-flex items-center px-2 py-1 text-xs rounded-sm relative transition-colors ${
                    followStatus 
                      ? 'bg-black text-white' 
                      : 'bg-white text-black border border-black hover:bg-gray-50'
                  }`}
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
                        logDebug(
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

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <p className="text-xs text-black flex-shrink-0">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </p>
              {list.list_type && (
                <span className="text-xs text-gray-500 capitalize">
                  {list.list_type} list
                </span>
              )}
            </div>
            <p className="text-xs text-black flex-shrink-0">{updatedText}</p>
          </div>

          {/* Items Preview List (takes remaining space) */}
          <div className="flex-grow min-h-0 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-gray-500" size={20} />
              </div>
            ) : (
              <ul className="space-y-1">
                {Array.isArray(displayItems) &&
                  displayItems.map((item, index) =>
                    item && item.id ? (
                      <ListItemDisplay
                        key={`${item.id}-${item.item_type || 'unknown'}`}
                        item={item}
                        listType={list.type}
                        onQuickAdd={onQuickAdd}
                        showQuickAdd={true}
                      />
                    ) : null
                  )}
                {displayItems.length === 0 && (
                  <li className="text-xs text-gray-500 italic py-2">
                    This list is empty
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* Show More Button */}
        {hasMoreItems && (
          <div className="flex justify-center mt-3 pt-2 border-t border-gray-100">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-black/70 hover:text-black p-2 rounded-lg transition-colors flex items-center text-xs font-medium hover:bg-gray-50"
              onClick={handleShowMore}
            >
              <Eye size={14} className="mr-1" />
              Show all {itemCount} items
            </motion.button>
          </div>
        )}
      </BaseCard>

      {/* List Detail Modal */}
      <ListDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        listId={safeListId}
        onQuickAdd={onQuickAdd}
      />
    </>
  );
};

ListCard.propTypes = {
  list: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
    description: PropTypes.string,
    list_type: PropTypes.string,
    items: PropTypes.array,
    items_count: PropTypes.number,
    updated_at: PropTypes.string,
    is_following: PropTypes.bool,
    user_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    created_by_user: PropTypes.bool,
    creator_handle: PropTypes.string,
  }).isRequired,
  onQuickAdd: PropTypes.func,
};

export default ListCard;
