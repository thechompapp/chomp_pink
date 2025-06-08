// src/pages/Lists/CompleteListDetail.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PropTypes from 'prop-types';
import { ArrowLeftIcon, PencilIcon, TrashIcon, PlusIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { Loader2, ChevronDown, MapPin } from 'lucide-react';
import { listService } from '@/services/listService.js';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import Button from '@/components/UI/Button';
import PageContainer from '@/layouts/PageContainer';
import { formatRelativeDate } from '@/utils/formatting';
import { useQuickAdd } from '@/contexts/QuickAddContext';
import ConfirmationDialog from '@/components/UI/ConfirmationDialog';
import useApiErrorHandler from '@/hooks/useApiErrorHandler';
import { useAuth } from '@/contexts/auth/AuthContext'; // Migrated from useAuthStore
import { logDebug, logError, logInfo, logWarn } from '@/utils/logger';
import FollowButton from '@/components/FollowButton';

function CompleteListDetail({ listId: propListId, embedded = false }) {
  // State management
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [sortOrder, setSortOrder] = useState('default');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const { openQuickAdd } = useQuickAdd();
  const handleApiError = useApiErrorHandler();

  // Get URL parameters and authentication state
  const params = useParams();
  const listId = propListId || params.listId;
  const { user, isAuthenticated  } = useAuth();
  
  // Early return if no listId is provided
  if (!listId) {
    return (
      <div className={embedded ? 'p-2' : 'container mx-auto p-4'}>
        <ErrorMessage message="No list ID provided" />
      </div>
    );
  }
  
  // Force database usage by removing mock data flags
  useEffect(() => {
    localStorage.removeItem('use_mock_data');
    logInfo('[ListDetail] Forcing DB data, ensuring mock data is disabled');
  }, []);

  // Fetch list data using React Query
  const { 
    data, 
    isLoading, 
    isError,
    refetch 
  } = useQuery({
    queryKey: ['listDetail', listId],
    queryFn: async () => {
      logDebug(`[ListDetail] Fetching details for list ID: ${listId} directly from database`);
      return listService.getListDetails(listId);
    },
    refetchOnWindowFocus: true,
    onError: (err) => {
      logError(`[ListDetail] Error fetching list details:`, err);
      handleApiError(err, "fetch list details");
    }
  });

  // Extract list data from query results
  const listDetails = data?.data || {};
  const list = listDetails.list || listDetails || {};
  const rawItems = listDetails.items || data?.items || [];
  
  console.log(`🔍 [CompleteListDetail] Data extraction debug:`, {
    hasData: !!data,
    dataKeys: data ? Object.keys(data) : 'no data',
    hasListDetails: !!listDetails,
    listDetailsKeys: listDetails ? Object.keys(listDetails) : 'no listDetails',
    listName: list?.name,
    rawItemsType: typeof rawItems,
    rawItemsIsArray: Array.isArray(rawItems),
    rawItemsLength: Array.isArray(rawItems) ? rawItems.length : 'not array'
  });
  
  // Apply sorting to items
  const items = useMemo(() => {
    if (!rawItems || !Array.isArray(rawItems)) {
      console.log(`⚠️ [CompleteListDetail] Items not an array:`, { rawItems, type: typeof rawItems });
      return [];
    }
    
    let sortedItems = [...rawItems];
    
    switch (sortOrder) {
      case 'az':
        return sortedItems.sort((a, b) => {
          const nameA = (a.restaurant_name || a.dish_name || a.name || '').toLowerCase();
          const nameB = (b.restaurant_name || b.dish_name || b.name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      case 'za':
        return sortedItems.sort((a, b) => {
          const nameA = (a.restaurant_name || a.dish_name || a.name || '').toLowerCase();
          const nameB = (b.restaurant_name || b.dish_name || b.name || '').toLowerCase();
          return nameB.localeCompare(nameA);
        });
      // Could implement distance sorting with geolocation API
      case 'distance':
        // For now, just return the default order when distance is selected
        // This would require user location and geocoding API to implement fully
        logWarn('[CompleteListDetail] Distance sorting requested but not fully implemented');
        return sortedItems;
      default:
        return sortedItems;
    }
  }, [rawItems, sortOrder]);

  // Determine if user can edit
  const canEdit = isAuthenticated && user && list.user_id === user.id;
  
  // Handle adding item to user's list (QuickAdd)
  const handleQuickAdd = (item) => {
    if (!isAuthenticated) return;
    
    logDebug(`[ListDetail] Quick adding ${item?.restaurant_name || item?.dish_name} to user's lists`);
    
    openQuickAdd({
      defaultListId: null, // Don't pre-select any list
      defaultItemData: {
        restaurant_id: item.restaurant_id,
        restaurant_name: item.restaurant_name,
        dish_id: item.dish_id,
        dish_name: item.dish_name,
        note: item.note,
      }
    });
  };
  
  // Handle item delete confirmation dialog
  const handleOpenDeleteConfirm = (item) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };
  
  // Handle edit note for an item
  const handleEditItemNote = (item) => {
    logDebug(`[ListDetail] Edit note for item: ${item?.list_item_id}`);
    // Implementation would go here
  };
  
  // Handle actual item deletion
  const handleDeleteItem = async () => {
    if (!itemToDelete?.list_item_id) return;
    
    try {
      logDebug(`[ListDetail] Deleting item ${itemToDelete.list_item_id}`);
      // API call implementation would go here
      
      // Close dialog and refresh data
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      refetch();
    } catch (error) {
      logError('[ListDetail] Error deleting item:', error);
      handleApiError(error, 'delete item');
    }
  };

  // Toggle sort menu
  const toggleSortMenu = () => {
    setSortMenuOpen(!sortMenuOpen);
  };

  // Set sort order
  const changeSortOrder = (order) => {
    setSortOrder(order);
    setSortMenuOpen(false);
  };

  // Render loading state
  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center py-16">
          <LoadingSpinner />
        </div>
      </PageContainer>
    );
  }

  // Render error state
  if (isError) {
    return (
      <PageContainer>
        <ErrorMessage message="Failed to load list details" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header with title and follow button */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center">
          {!embedded && (
            <button
              onClick={() => window.history.back()}
              className="mr-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{list.name || 'Food Collection'}</h1>
        </div>

        {/* Follow button - only show for non-owners */}
        {isAuthenticated && list && list.id && user && list.user_id !== user.id && (
          <FollowButton 
            listId={list.id} 
            isFollowing={list.is_following} 
            className="ml-2" 
          />
        )}
      </div>

      {/* Description */}
      {list.description && (
        <p className="mb-4 text-gray-600 dark:text-gray-300">{list.description}</p>
      )}

      {/* Tags */}
      <div className="mb-6 flex flex-wrap gap-2">
        {list.tags && list.tags.map(tag => (
          <span 
            key={tag} 
            className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 px-2 py-1 rounded-md text-xs"
          >
            {tag}
          </span>
        ))}
        {list.city && (
          <span className="bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100 px-2 py-1 rounded-md text-xs">
            {list.city}
          </span>
        )}
      </div>

      {/* Item count, creator info, and updated time */}
      <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        <span>{items.length} dish{items.length !== 1 ? 'es' : ''}</span>
        {list.creator_handle && (
          <span className="ml-2">by {list.creator_handle}</span>
        )}
        {list.updated_at && (
          <span className="ml-2">· Updated {formatRelativeDate(list.updated_at)}</span>
        )}
      </div>

      {/* Sorting controls */}
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Restaurants & Dishes</h2>
        
        <div className="relative">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleSortMenu}
            className="flex items-center gap-1.5"
          >
            <span>Sort</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
          
          {sortMenuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
              <div className="py-1">
                <button 
                  className={`w-full text-left px-4 py-2 text-sm ${sortOrder === 'default' ? 'bg-gray-100 dark:bg-gray-700 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  onClick={() => changeSortOrder('default')}
                >
                  Default
                </button>
                <button 
                  className={`w-full text-left px-4 py-2 text-sm ${sortOrder === 'az' ? 'bg-gray-100 dark:bg-gray-700 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  onClick={() => changeSortOrder('az')}
                >
                  <div className="flex items-center gap-2">
                    <ArrowUpIcon className="h-4 w-4" />
                    <span>A to Z</span>
                  </div>
                </button>
                <button 
                  className={`w-full text-left px-4 py-2 text-sm ${sortOrder === 'za' ? 'bg-gray-100 dark:bg-gray-700 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  onClick={() => changeSortOrder('za')}
                >
                  <div className="flex items-center gap-2">
                    <ArrowDownIcon className="h-4 w-4" />
                    <span>Z to A</span>
                  </div>
                </button>
                <button 
                  className={`w-full text-left px-4 py-2 text-sm ${sortOrder === 'distance' ? 'bg-gray-100 dark:bg-gray-700 font-medium' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  onClick={() => changeSortOrder('distance')}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Distance</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* List items */}
      {items && items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.list_item_id || `item-${Date.now()}-${Math.random()}`}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex-1 min-w-0 mr-4">
                <Link
                  to={item.restaurant_id ? `/restaurants/${item.restaurant_id}` : (item.dish_id ? `/dishes/${item.dish_id}` : '#')}
                  className="text-base font-medium text-blue-700 hover:underline dark:text-blue-400 truncate block"
                  title={item.restaurant_name || item.dish_name || 'Unknown Item'}
                >
                  {item.restaurant_name || item.dish_name || 'Unknown Item'}
                </Link>
                {item.restaurant_address && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.restaurant_address}</p>
                )}
                {item.note && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 italic">Note: {item.note}</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-1 flex-shrink-0">
                {/* Quick Add button - shown to everyone except the owner */}
                {isAuthenticated && (!canEdit) && (
                  <button
                    onClick={() => handleQuickAdd(item)}
                    className="p-1 rounded-full text-gray-400 hover:text-blue-600 hover:bg-gray-200 dark:hover:text-blue-400 dark:hover:bg-gray-600 transition-colors"
                    title="Add to your list"
                    aria-label="Add to your list"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                )}

                {/* Edit buttons - only shown to owner */}
                {canEdit && (
                  <>
                    <button
                      onClick={() => handleEditItemNote(item)}
                      className="p-1 rounded-full text-gray-400 hover:text-green-600 hover:bg-gray-200 dark:hover:text-green-400 dark:hover:bg-gray-600 transition-colors"
                      title="Edit Note"
                      aria-label="Edit Note"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleOpenDeleteConfirm(item)}
                      className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-gray-200 dark:hover:text-red-400 dark:hover:bg-gray-600 transition-colors"
                      title="Remove Item"
                      aria-label="Remove Item"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No restaurants or dishes have been added to this list yet.</p>
      )}

      {/* Confirmation dialog for deleting items */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Remove Item"
        message={`Are you sure you want to remove "${itemToDelete?.restaurant_name || itemToDelete?.dish_name || 'this item'}" from your list?`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onConfirm={handleDeleteItem}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setItemToDelete(null);
        }}
      />
    </PageContainer>
  );
}

CompleteListDetail.propTypes = {
  listId: PropTypes.string,
  embedded: PropTypes.bool,
};

export default CompleteListDetail;
