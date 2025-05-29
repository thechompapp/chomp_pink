/* src/components/UI/ListDetailModal.jsx */
import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, HeartOff, SortAsc, SortDesc, Star, MapPin, DollarSign, Clock, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listService } from '@/services/listService';
import { engagementService } from '@/services/engagementService';
import useAuthStore from '@/stores/useAuthStore';
import Button from '@/components/UI/Button';
import { formatRelativeDate } from '@/utils/formatting';
import { logDebug, logError } from '@/utils/logger';

// List item display component with quick add button
const ListItemDisplay = ({ item, onQuickAdd, index }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!item || item.id == null) return null;

  const handleQuickAdd = (e) => {
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

  const getItemIcon = () => {
    if (item.item_type === 'restaurant') {
      return <MapPin className="w-4 h-4 text-gray-500" />;
    } else if (item.item_type === 'dish') {
      return <DollarSign className="w-4 h-4 text-gray-500" />;
    }
    return null;
  };

  const getSecondaryText = () => {
    if (item.item_type === 'restaurant') {
      return item.city || item.neighborhood || item.address || '';
    } else if (item.item_type === 'dish') {
      return item.restaurant_name || '';
    }
    return '';
  };

  const getPriceDisplay = () => {
    if (item.item_type === 'dish' && item.price) {
      return `$${parseFloat(item.price).toFixed(2)}`;
    } else if (item.item_type === 'restaurant' && item.price_range) {
      return item.price_range;
    }
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-lg group transition-colors"
    >
      <div className="flex items-start space-x-3 flex-1 min-w-0">
        <div className="flex-shrink-0 mt-0.5">
          {getItemIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {item.name}
          </h4>
          {getSecondaryText() && (
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {getSecondaryText()}
            </p>
          )}
          {item.description && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
        {getPriceDisplay() && (
          <div className="flex-shrink-0 text-right">
            <span className="text-sm font-medium text-gray-900">
              {getPriceDisplay()}
            </span>
          </div>
        )}
      </div>
      {isAuthenticated && onQuickAdd && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleQuickAdd}
          className="ml-3 px-3 py-1.5 text-xs bg-black text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-800"
          title="Add to a list"
        >
          Add
        </motion.button>
      )}
    </motion.div>
  );
};

ListItemDisplay.propTypes = {
  item: PropTypes.object.isRequired,
  onQuickAdd: PropTypes.func,
  index: PropTypes.number.isRequired
};

const ListDetailModal = ({ isOpen, onClose, listId, onQuickAdd }) => {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [sortBy, setSortBy] = useState('added_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isFollowing, setIsFollowing] = useState(false);

  // Fetch list details
  const {
    data: listData,
    isLoading: isLoadingList,
    isError: isErrorList
  } = useQuery({
    queryKey: ['list-details', listId],
    queryFn: () => listService.getListDetails(listId),
    enabled: Boolean(listId && isOpen),
    staleTime: 60000
  });

  // Fetch list items
  const {
    data: itemsData,
    isLoading: isLoadingItems,
    isError: isErrorItems
  } = useQuery({
    queryKey: ['list-items', listId, sortBy, sortOrder],
    queryFn: () => listService.getListItems(listId, { sortBy, sortOrder }),
    enabled: Boolean(listId && isOpen),
    staleTime: 60000
  });

  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: ({ listId, action }) => {
      return action === 'follow' 
        ? engagementService.followList(listId)
        : engagementService.unfollowList(listId);
    },
    onSuccess: (data, variables) => {
      setIsFollowing(variables.action === 'follow');
      queryClient.invalidateQueries(['list-details', listId]);
      logDebug(`Successfully ${variables.action}ed list ${listId}`);
    },
    onError: (error) => {
      logError('Failed to update follow status:', error);
    }
  });

  // Update following status when list data changes
  useEffect(() => {
    if (listData?.data) {
      setIsFollowing(Boolean(listData.data.is_following));
    }
  }, [listData]);

  const list = useMemo(() => listData?.data, [listData]);
  const items = useMemo(() => itemsData?.data || [], [itemsData]);

  const handleFollow = () => {
    if (!isAuthenticated || followMutation.isPending) return;
    
    const action = isFollowing ? 'unfollow' : 'follow';
    followMutation.mutate({ listId, action });
  };

  const handleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />;
  };

  const isOwnList = useMemo(() => {
    if (!user || !list) return false;
    return (
      (list.user_id != null && user.id != null && list.user_id === user.id) ||
      (list.created_by_user === true) ||
      (list.creator_handle != null && user.username != null && list.creator_handle === user.username)
    );
  }, [user, list]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex-1 min-w-0">
              {isLoadingList ? (
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : list ? (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 truncate">
                    {list.name}
                  </h2>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-sm text-gray-500">
                      by {list.creator_handle || 'Unknown'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </span>
                    {list.updated_at && (
                      <span className="text-sm text-gray-500">
                        {formatRelativeDate(new Date(list.updated_at))}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">Failed to load list</div>
              )}
            </div>
            
            {/* Follow button */}
            {isAuthenticated && !isOwnList && list && (
              <div className="flex items-center space-x-3 ml-4">
                <Button
                  onClick={handleFollow}
                  disabled={followMutation.isPending}
                  variant={isFollowing ? 'outline' : 'primary'}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  {isFollowing ? (
                    <>
                      <HeartOff className="w-4 h-4" />
                      <span>Unfollow</span>
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4" />
                      <span>Follow</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            <button
              onClick={onClose}
              className="ml-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Description */}
          {list?.description && (
            <div className="px-6 py-4 border-b border-gray-200">
              <p className="text-sm text-gray-600">{list.description}</p>
            </div>
          )}

          {/* Tags */}
          {list?.tags && list.tags.length > 0 && (
            <div className="px-6 py-3 border-b border-gray-200">
              <div className="flex flex-wrap gap-2">
                {list.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sorting controls */}
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <button
                onClick={() => handleSort('name')}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-sm transition-colors ${
                  sortBy === 'name' ? 'bg-black text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>Name</span>
                {getSortIcon('name')}
              </button>
              <button
                onClick={() => handleSort('added_at')}
                className={`flex items-center space-x-1 px-2 py-1 rounded text-sm transition-colors ${
                  sortBy === 'added_at' ? 'bg-black text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>Date Added</span>
                {getSortIcon('added_at')}
              </button>
              {list?.list_type === 'dish' && (
                <button
                  onClick={() => handleSort('price')}
                  className={`flex items-center space-x-1 px-2 py-1 rounded text-sm transition-colors ${
                    sortBy === 'price' ? 'bg-black text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>Price</span>
                  {getSortIcon('price')}
                </button>
              )}
            </div>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingItems ? (
              <div className="p-6">
                <div className="space-y-4">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="animate-pulse flex items-center space-x-3">
                      <div className="w-4 h-4 bg-gray-200 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : isErrorItems ? (
              <div className="p-6 text-center text-gray-500">
                <p>Failed to load list items</p>
              </div>
            ) : items.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>This list is empty</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {items.map((item, index) => (
                  <ListItemDisplay
                    key={item.id || item.list_item_id || index}
                    item={item}
                    onQuickAdd={onQuickAdd}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                {list?.list_type && (
                  <span className="capitalize">{list.list_type} list</span>
                )}
                {list?.city_name && (
                  <span>{list.city_name}</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {list?.saved_count > 0 && (
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{list.saved_count} followers</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

ListDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  listId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onQuickAdd: PropTypes.func
};

export default ListDetailModal; 