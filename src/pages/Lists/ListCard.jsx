/* src/pages/Lists/ListCard.jsx */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronUp, 
  Star, 
  Loader2, 
  Eye, 
  Clock, 
  Users, 
  Hash,
  TrendingUp,
  MessageSquare,
  Share2,
  BookOpen,
  Heart
} from 'lucide-react';
import { engagementService } from '@/services/engagementService';
import { listService } from '@/services/listService';
import { useAuth } from '@/contexts/auth/AuthContext';
import useFollowStore from '@/stores/useFollowStore';
import BaseCard from '@/components/UI/BaseCard';
import Button from '@/components/UI/Button';
import EnhancedListModal from '@/components/modals/EnhancedListModal';
import { formatRelativeDate } from '@/utils/formatting';
import { logDebug, logError } from '@/utils/logger';

// Maximum items to show in preview mode
const PREVIEW_ITEM_LIMIT = 5;

// Animation variants for better UX
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: { y: -2, boxShadow: "0 8px 25px rgba(0,0,0,0.15)" }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
};

// Enhanced badge component for list metadata
const ListBadge = ({ icon: Icon, text, color = "gray" }) => {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    purple: "bg-purple-100 text-purple-700",
    red: "bg-red-100 text-red-700"
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}>
      <Icon size={10} className="mr-1" />
      {text}
    </span>
  );
};

// Separate component for empty/error state
const EmptyListCard = ({ error }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={cardVariants}
    className="bg-white rounded-lg border border-black p-4 h-full"
  >
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
  </motion.div>
);

// Enhanced list item display with better styling and metadata
const ListItemDisplay = ({ item, listType, onQuickAdd, showQuickAdd = true, index }) => {
  try {
    // Check if user is authenticated
    const { isAuthenticated } = useAuth();
    
    if (!item || item.id == null) return null;
    let linkTo = '#';
    let secondaryText = '';
    let priceDisplay = '';
    let itemIcon = null;
    
    if (item.item_type === 'restaurant') {
      linkTo = `/restaurants/${item.id}`;
      secondaryText = item.city || item.neighborhood || '';
      if (item.price_range) {
        priceDisplay = item.price_range;
      }
      itemIcon = <Hash size={10} className="text-orange-500" />;
    } else if (item.item_type === 'dish') {
      linkTo = `/dishes/${item.id}`;
      secondaryText = item.restaurant_name || '';
      if (item.price) {
        priceDisplay = `$${parseFloat(item.price).toFixed(2)}`;
      }
      itemIcon = <BookOpen size={10} className="text-green-500" />;
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
      <motion.li
        initial="hidden"
        animate="visible"
        variants={itemVariants}
        transition={{ delay: index * 0.05 }}
        className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-2 group transition-all duration-200" 
        title={item.name}
      >
        <div className="flex items-center flex-1 min-w-0 space-x-2">
          {itemIcon}
          <div className="flex-1 min-w-0">
            <span className="text-black hover:underline text-sm font-medium block truncate">
              {item.name}
            </span>
            {secondaryText && (
              <span className="text-gray-500 text-xs block truncate">
                {secondaryText}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {priceDisplay && (
            <span className="text-xs text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded">
              {priceDisplay}
            </span>
          )}
          {isAuthenticated && onQuickAdd && showQuickAdd && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleQuickAdd}
              className="text-xs bg-black text-white px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-800"
              title="Add to a list"
            >
              Add
            </motion.button>
          )}
        </div>
      </motion.li>
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
  const itemCount = list?.item_count || list?.items?.length || 0;
  const updatedAt = list?.updated_at ? new Date(list.updated_at) : new Date();
  const updatedText = formatRelativeDate(updatedAt) || 'Updated recently';

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      whileHover="hover"
      variants={cardVariants}
      transition={{ duration: 0.2 }}
    >
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
    </motion.div>
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
  const [isHovered, setIsHovered] = useState(false);
  const { user, isAuthenticated } = useAuth() || {};
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
    
    // itemsData.data should be an array of items from the API
    if (Array.isArray(itemsData.data)) {
      return itemsData.data.slice(0, PREVIEW_ITEM_LIMIT);
    }
    
    // Fallback to list.items if available
    return Array.isArray(list.items) ? list.items.slice(0, PREVIEW_ITEM_LIMIT) : [];
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

  // Enhanced share functionality
  const handleShare = useCallback(async (e) => {
    try {
      e.stopPropagation();
      e.preventDefault();
      
      if (navigator.share) {
        await navigator.share({
          title: list.name,
          text: list.description || `Check out this list: ${list.name}`,
          url: `${window.location.origin}/lists/${safeListId}`
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(`${window.location.origin}/lists/${safeListId}`);
        // Could add a toast notification here
      }
    } catch (error) {
      console.error('[ListCard] Error sharing list:', error);
    }
  }, [list.name, list.description, safeListId]);

  // Enhanced follow handler with better UX
  const handleToggleFollow = useCallback((e) => {
    try {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      setFollowStatus((prev) => !prev);
      
      // Optimistic update with better state management
      const newFollowStatus = !followStatus;
      
      try {
        const key = `follow_state_${safeListId}`;
        localStorage.setItem(
          key,
          JSON.stringify({
            isFollowing: newFollowStatus,
            updatedAt: new Date().toISOString(),
          })
        );
        
        // Log engagement
        engagementService.logEngagement({
          item_id: parseInt(safeListId, 10),
          item_type: 'list',
          engagement_type: newFollowStatus ? 'follow' : 'unfollow',
        });
        
        logDebug(
          `[ListCard] List ${safeListId} ${newFollowStatus ? 'followed' : 'unfollowed'}`
        );
      } catch (err) {
        console.error('[ListCard] Error updating follow state:', err);
        // Revert optimistic update on error
        setFollowStatus(followStatus);
      }
    } catch (clickError) {
      console.error('[ListCard] Error in follow button click handler:', clickError);
    }
  }, [followStatus, safeListId]);

  // Render
  const listName = list.name || 'Unnamed List';
  const updatedAt = list.updated_at ? new Date(list.updated_at) : new Date();
  const updatedText = formatRelativeDate(updatedAt) || 'Updated recently';
  
  // Use accurate item count from listDetailsData if available, prioritizing actual item_count over preview arrays
  const itemCount = useMemo(() => {
    // First priority: item_count from fetched list details (most accurate)
    if (listDetailsData?.data?.item_count !== undefined) {
      return listDetailsData.data.item_count;
    }
    
    // Second priority: item_count from original list props (from main API response)
    if (list.item_count !== undefined) {
      return list.item_count;
    }
    
    // Third priority: items array length from fetched list details (only if no item_count available)
    if (listDetailsData?.data?.items && Array.isArray(listDetailsData.data.items)) {
      return listDetailsData.data.items.length;
    }
    
    // Fourth priority: items array length from original list props
    if (list.items && Array.isArray(list.items)) {
      return list.items.length;
    }
    
    // Last resort: preview items array length (will be limited to PREVIEW_ITEM_LIMIT)
    if (itemsData?.data && Array.isArray(itemsData.data)) {
      return itemsData.data.length;
    }
    
    // Fallback: 0
    return 0;
  }, [listDetailsData?.data, list.item_count, list.items, itemsData?.data]);

  const hasMoreItems = itemCount > PREVIEW_ITEM_LIMIT;

  // Enhanced metadata display
  const getListTypeColor = (type) => {
    const typeColors = {
      'restaurant': 'blue',
      'dish': 'green',
      'recipe': 'purple',
      'mixed': 'gray'
    };
    return typeColors[type] || 'gray';
  };

  const formatItemData = (item) => {
    // Format common fields
    const formattedItem = {
      id: item.id,
      name: item.name || 'Unnamed Item',
      description: item.description || '',
      item_type: item.item_type || 'unknown',
      location: '',
      labels: []
    };

    // Add type-specific formatting
    if (item.item_type === 'restaurant') {
      formattedItem.location = [
        item.address,
        item.neighborhood,
        item.city
      ].filter(Boolean).join(', ');
      
      if (item.cuisine) {
        formattedItem.labels.push({ 
          text: item.cuisine, 
          type: 'cuisine',
          color: 'bg-blue-100 text-blue-800'
        });
      }
    } else if (item.item_type === 'dish') {
      if (item.restaurant_name) {
        formattedItem.location = `at ${item.restaurant_name}`;
      }
      
      if (item.category) {
        formattedItem.labels.push({ 
          text: item.category, 
          type: 'category',
          color: 'bg-green-100 text-green-800'
        });
      }
    }

    return formattedItem;
  };

  const formattedItem = formatItemData(list);

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        whileHover="hover"
        variants={cardVariants}
        transition={{ duration: 0.2 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <BaseCard
          onClick={handleCardClick}
          className="bg-white rounded-lg border border-black p-4 flex flex-col h-full overflow-hidden relative w-full cursor-pointer hover:shadow-lg transition-all duration-200"
        >
          {/* Enhanced Header with Better Visual Hierarchy */}
          <div className="flex-grow min-h-0 overflow-hidden flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-black line-clamp-2 flex-shrink-0 mb-1">
                  {listName}
                </h3>
                {list.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                    {list.description}
                  </p>
                )}
              </div>
              
              {/* Enhanced Action Buttons */}
              <div className="ml-3 flex items-center space-x-2 flex-shrink-0">
                {/* Share Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleShare}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
                  title="Share this list"
                >
                  <Share2 size={14} />
                </motion.button>
                
                {/* Enhanced Follow Button */}
                {shouldShowFollowButton && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleToggleFollow}
                    className={`inline-flex items-center px-3 py-1.5 text-xs rounded-full font-medium transition-all duration-200 ${
                      followStatus 
                        ? 'bg-black text-white shadow-md' 
                        : 'bg-white text-black border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                    }`}
                    title={followStatus ? 'Unfollow this list' : 'Follow this list'}
                  >
                    <Star className={`mr-1.5 ${followStatus ? 'fill-white' : ''}`} size={12} />
                    <span>{followStatus ? 'Following' : 'Follow'}</span>
                  </motion.button>
                )}
              </div>
            </div>

            {/* Enhanced Metadata Section */}
            <div className="flex items-center flex-wrap gap-2 mb-3">
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <Users size={12} />
                <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
              </div>
              
              <div className="flex items-center space-x-1 text-xs text-gray-600">
                <Clock size={12} />
                <span>{updatedText}</span>
              </div>
              
              {/* User Handle Display */}
              {(list.creator_handle || list.creator_username) && (
                <div className="flex items-center space-x-1 text-xs text-gray-600">
                  <span>created by</span>
                  <span className="font-medium text-gray-800">
                    @{list.creator_handle || list.creator_username}
                  </span>
                </div>
              )}
              
              {list.list_type && (
                <ListBadge 
                  icon={Hash} 
                  text={`${list.list_type} list`} 
                  color={getListTypeColor(list.list_type)} 
                />
              )}
              
              {list.is_trending && (
                <ListBadge 
                  icon={TrendingUp} 
                  text="Trending" 
                  color="red" 
                />
              )}
              
              {list.comment_count > 0 && (
                <ListBadge 
                  icon={MessageSquare} 
                  text={`${list.comment_count} comments`} 
                  color="blue" 
                />
              )}
            </div>

            {/* Enhanced Items Preview List */}
            <div className="flex-grow min-h-0 overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center h-24">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="text-gray-400" size={20} />
                  </motion.div>
                </div>
              ) : (
                <AnimatePresence>
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
                            index={index}
                          />
                        ) : null
                      )}
                    {displayItems.length === 0 && (
                      <motion.li
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-gray-400 italic py-4 text-center border border-dashed border-gray-200 rounded-lg"
                      >
                        This list is empty
                      </motion.li>
                    )}
                  </ul>
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Enhanced Show More Button */}
          <AnimatePresence>
            {hasMoreItems && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex justify-center mt-4 pt-3 border-t border-gray-100"
              >
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-black/70 hover:text-black px-4 py-2 rounded-lg transition-all duration-200 flex items-center text-sm font-medium hover:bg-gray-50 border border-transparent hover:border-gray-200"
                  onClick={handleShowMore}
                >
                  <Eye size={16} className="mr-2" />
                  <span>Show all {itemCount} items</span>
                  <ChevronDown size={16} className="ml-2" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </BaseCard>
      </motion.div>

      {/* List Detail Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <EnhancedListModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            list={list}
            onShare={(listData) => {
              // Handle sharing functionality
              handleShare({ stopPropagation: () => {}, preventDefault: () => {} });
            }}
          />
        )}
      </AnimatePresence>
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
    item_count: PropTypes.number,
    updated_at: PropTypes.string,
    is_following: PropTypes.bool,
    is_trending: PropTypes.bool,
    comment_count: PropTypes.number,
    user_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    created_by_user: PropTypes.bool,
    creator_handle: PropTypes.string,
  }).isRequired,
  onQuickAdd: PropTypes.func,
};

export default ListCard;
