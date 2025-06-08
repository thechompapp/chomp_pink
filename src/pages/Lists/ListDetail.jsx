// src/pages/Lists/ListDetail.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PropTypes from 'prop-types';
import { ArrowLeftIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/solid';
import { MapPin, Clock, Calendar, User, Hash, SortAsc, SortDesc, Navigation, Loader2, Heart, ExternalLink } from 'lucide-react';
import { listService } from '@/services/listService.js';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import Button from '@/components/UI/Button';
import { formatRelativeDate } from '@/utils/formatting';
import { useQuickAdd } from '@/contexts/QuickAddContext';
import ConfirmationDialog from '@/components/UI/ConfirmationDialog';
import useApiErrorHandler from '@/hooks/useApiErrorHandler';
import { useAuth } from '@/contexts/auth/AuthContext';
import { logDebug, logError, logInfo, logWarn } from '@/utils/logger';
import FollowButton from '@/components/FollowButton';

// Enhanced SortButton component for one-click sorting
const SortButton = ({ active, onClick, icon: Icon, label, className = "" }) => (
  <Button
    variant={active ? 'primary' : 'outline'}
    size="sm"
    onClick={onClick}
    className={`flex items-center gap-1.5 ${className}`}
    style={active ? {} : { color: '#374151' }}
  >
    <Icon className="h-4 w-4" />
    <span className="hidden sm:inline" style={active ? {} : { color: '#374151' }}>{label}</span>
  </Button>
);

function ListDetail({ listId: propListId, embedded = false }) {
  // State management
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [sortOrder, setSortOrder] = useState('default');
  const { openQuickAdd } = useQuickAdd();
  const handleApiError = useApiErrorHandler();
  const navigate = useNavigate();
  
  // Get list ID from props or URL params
  const { id: urlListId } = useParams();
  const listId = propListId || urlListId;
  
  // Auth state
  const { user, isAuthenticated  } = useAuth();
  
  // Ensure we're using real data
  useEffect(() => {
    localStorage.removeItem('use_mock_data');
    logInfo('[ListDetail] Forcing database data');
  }, []);

  // Fetch list details using React Query
  const { 
    data: listData, 
    isLoading: isLoadingList, 
    isError: isListError,
    error: listError
  } = useQuery({
    queryKey: ['listDetail', listId],
    queryFn: async () => {
      const result = await listService.getList(listId);
      return result;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    enabled: !!listId,
    onError: (err) => {
      handleApiError(err, "fetch list details");
    }
  });

  // Fetch list items using separate React Query
  const { 
    data: itemsData, 
    isLoading: isLoadingItems, 
    isError: isItemsError,
    error: itemsError,
    refetch: refetchItems
  } = useQuery({
    queryKey: ['listItems', listId],
    queryFn: async () => {
      if (typeof listService.getListItems !== 'function') {
        throw new Error('getListItems is not a function');
      }
      
      const result = await listService.getListItems(listId);
      return result;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    enabled: !!listId,
    onError: (err) => {
      handleApiError(err, "fetch list items");
    }
  });

  // Extract data from queries
  const list = listData?.data || {};
  const rawItems = itemsData?.data || [];
  
  // Apply sorting to items
  const items = useMemo(() => {
    if (!Array.isArray(rawItems)) {
      return [];
    }

    const sortedItems = [...rawItems];
    
    switch (sortOrder) {
      case 'az':
        sortedItems.sort((a, b) => {
          const nameA = (a.name || a.restaurant_name || a.dish_name || '').toLowerCase();
          const nameB = (b.name || b.restaurant_name || b.dish_name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        break;
      case 'za':
        sortedItems.sort((a, b) => {
          const nameA = (a.name || a.restaurant_name || a.dish_name || '').toLowerCase();
          const nameB = (b.name || b.restaurant_name || b.dish_name || '').toLowerCase();
          return nameB.localeCompare(nameA);
        });
        break;
      case 'newest':
        sortedItems.sort((a, b) => {
          const dateA = new Date(a.added_at || a.created_at || 0);
          const dateB = new Date(b.added_at || b.created_at || 0);
          return dateB - dateA;
        });
        break;
      case 'distance':
        sortedItems.sort((a, b) => {
          const locationA = (a.restaurant_address || a.address || '').toLowerCase();
          const locationB = (b.restaurant_address || b.address || '').toLowerCase();
          return locationA.localeCompare(locationB);
        });
        break;
      default:
        break;
    }
    
    return sortedItems;
  }, [rawItems, sortOrder]);

  // Permission checking
  const canEdit = isAuthenticated && user && list && list.user_id === user.id;
  const isLoading = isLoadingList || isLoadingItems;
  const isError = isListError || isItemsError;
  const error = listError || itemsError;

  // Event handlers
  const handleQuickAdd = (item) => {
    openQuickAdd({
      restaurantId: item.item_type === 'restaurant' ? item.item_id : item.restaurant_id,
      restaurantName: item.name || item.restaurant_name,
      dishId: item.item_type === 'dish' ? item.item_id : item.dish_id,
      dishName: item.item_type === 'dish' ? item.name : item.dish_name,
      tags: list.tags || [],
      city: list.city,
      note: item.note,
      type: item.item_type || 'restaurant'
    });
  };

  const handleEditItemNote = (item) => {
    // TODO: Implement edit note functionality
  };

  const handleDeleteItemClick = (item) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    
    try {
      await listService.removeItemFromList(listId, itemToDelete.list_item_id || itemToDelete.id);
      refetchItems();
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    } catch (error) {
      handleApiError(error, 'remove item from list');
    }
  };

  // Enhanced sort handlers - one-click sorting
  const handleSort = (newSortOrder) => {
    setSortOrder(prevOrder => prevOrder === newSortOrder ? 'default' : newSortOrder);
  };

  // Loading state with navbar spacing
  if (isLoading) {
    return (
      <div className="page-container">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex flex-col items-center justify-center py-16">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-900 font-medium">Loading list...</p>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced error state
  if (isError) {
    return (
      <div className="page-container">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="py-8 flex flex-col items-center">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-red-600 mb-2">
                Unable to load list
              </h2>
              <p className="text-gray-900 font-medium mb-4">
                {error?.message || 'There was an issue connecting to the server.'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2"
              >
                <Loader2 className="h-4 w-4" />
                Try Again
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render main content with enhanced layout
  return (
    <div className="page-container">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Enhanced List Header */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center min-w-0 flex-1">
              {!embedded && (
                <button
                  onClick={() => navigate('/my-lists')}
                  className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                  aria-label="Back to My Lists"
                >
                  <ArrowLeftIcon className="h-5 w-5 text-gray-700" />
                </button>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 truncate" style={{ color: '#111827' }}>
                  {list.name || 'Untitled List'}
                </h1>
                
                {/* Enhanced metadata row */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700" style={{ color: '#374151' }}>
                  <div className="flex items-center gap-1">
                    <Hash className="h-4 w-4 text-gray-700" style={{ color: '#374151' }} />
                    <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                  </div>
                  
                  {list.creator_handle && (
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4 text-gray-700" style={{ color: '#374151' }} />
                      <span>by @{list.creator_handle}</span>
                    </div>
                  )}
                  
                  {list.created_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-700" style={{ color: '#374151' }} />
                      <span>Created {formatRelativeDate(list.created_at)}</span>
                    </div>
                  )}
                  
                  {list.updated_at && list.updated_at !== list.created_at && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-700" style={{ color: '#374151' }} />
                      <span>Updated {formatRelativeDate(list.updated_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Follow button - show for everyone including owners */}
            {isAuthenticated && list && list.id && user && (
              <div className="ml-4 flex-shrink-0">
                {list.user_id === user.id ? (
                  <div className="flex items-center px-4 py-2 bg-red-500 text-white rounded-md font-medium text-sm">
                    <Heart className="h-4 w-4 mr-2 fill-current" />
                    Following
                  </div>
                ) : (
                  <FollowButton 
                    listId={list.id} 
                    isFollowing={list.is_following} 
                    className="" 
                  />
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {list.description && (
            <p className="text-gray-800 mb-4 text-base leading-relaxed" style={{ color: '#1f2937' }}>
              {list.description}
            </p>
          )}

          {/* Tags and Location */}
          <div className="flex flex-wrap gap-2">
            {list.tags && list.tags.map(tag => (
              <span 
                key={tag} 
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                #{tag}
              </span>
            ))}
            {list.city && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                <MapPin className="h-3 w-3 mr-1" />
                {list.city}
              </span>
            )}
          </div>
        </div>

        {/* Enhanced Sorting Controls */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900" style={{ color: '#111827' }}>
              Collection
            </h2>
            
            {/* One-click sorting buttons */}
            <div className="flex flex-wrap gap-2">
              <SortButton
                active={sortOrder === 'az'}
                onClick={() => handleSort('az')}
                icon={SortAsc}
                label="A-Z"
              />
              
              <SortButton
                active={sortOrder === 'za'}
                onClick={() => handleSort('za')}
                icon={SortDesc}
                label="Z-A"
              />
              
              <SortButton
                active={sortOrder === 'newest'}
                onClick={() => handleSort('newest')}
                icon={Clock}
                label="Newest"
              />
              
              <SortButton
                active={sortOrder === 'distance'}
                onClick={() => handleSort('distance')}
                icon={Navigation}
                label="Distance"
              />
            </div>
          </div>
        </div>
        
        {/* List items */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          {items && items.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {items.map((item, index) => (
                <div
                  key={item.list_item_id || item.id || `item-${Date.now()}-${Math.random()}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <Link
                      to={item.item_type === 'restaurant' ? `/restaurants/${item.item_id}` : 
                          item.item_type === 'dish' ? `/dishes/${item.item_id}` : 
                          item.restaurant_id ? `/restaurants/${item.restaurant_id}` : 
                          item.dish_id ? `/dishes/${item.dish_id}` : '#'}
                      className="block group"
                    >
                      <h3 className="text-base font-medium text-gray-900 group-hover:text-blue-600 truncate" style={{ color: '#111827' }}>
                        {item.name || item.restaurant_name || item.dish_name || 'Unknown Item'}
                      </h3>
                      
                      {item.restaurant_address && (
                        <div className="flex items-center mt-1">
                          <p className="text-sm text-gray-700 truncate" style={{ color: '#374151' }}>
                            <MapPin className="h-3 w-3 inline mr-1 text-gray-700" style={{ color: '#374151' }} />
                            {item.restaurant_address}
                          </p>
                          
                          {/* External Links */}
                          <div className="flex items-center ml-3 space-x-2">
                            {/* Google Maps Link */}
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                `${item.name || item.restaurant_name || ''} ${item.restaurant_address || ''}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="View on Google Maps"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            
                            {/* Yelp Link - placeholder for now, will use database field when available */}
                            {item.yelp_url && (
                              <a
                                href={item.yelp_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="View on Yelp"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {item.note && (
                        <p className="text-sm text-gray-800 mt-1 italic" style={{ color: '#1f2937' }}>
                          "{item.note}"
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-600" style={{ color: '#4b5563' }}>
                        <span className="capitalize">{item.item_type || 'Item'}</span>
                        {item.added_at && (
                          <span>Added {formatRelativeDate(item.added_at)}</span>
                        )}
                      </div>
                    </Link>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {/* Quick Add button - shown to everyone except the owner */}
                    {isAuthenticated && (!canEdit) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAdd(item)}
                        className="flex items-center gap-1"
                      >
                        <PlusIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Add</span>
                      </Button>
                    )}

                    {/* Edit buttons - only shown to owner */}
                    {canEdit && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditItemNote(item)}
                          className="flex items-center gap-1"
                        >
                          <PencilIcon className="h-4 w-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteItemClick(item)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                          <span className="hidden sm:inline">Remove</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2" style={{ color: '#111827' }}>
                No items yet
              </h3>
              <p className="text-gray-700 mb-4" style={{ color: '#374151' }}>
                {canEdit 
                  ? "Start building your collection by adding restaurants and dishes."
                  : "This list doesn't have any items yet."}
              </p>
              {canEdit && (
                <Button variant="primary" className="mt-4">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Items
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteItem}
          title="Remove Item"
          message={`Are you sure you want to remove "${itemToDelete?.name || itemToDelete?.restaurant_name || itemToDelete?.dish_name}" from this list?`}
          confirmText="Remove"
          cancelText="Cancel"
          danger
        />
      </div>
    </div>
  );
}

ListDetail.propTypes = {
  listId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  embedded: PropTypes.bool
};

export default ListDetail;
