// src/pages/Lists/WorkingListDetail.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PropTypes from 'prop-types';
import { ArrowLeftIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/solid';
import { Loader2 } from 'lucide-react';
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

function WorkingListDetail({ listId: propListId, embedded = false }) {
  // Simple state management
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
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
  
  // Ensure we're using real data
  useEffect(() => {
    // Remove any mock data flags to force DB connection
    localStorage.removeItem('use_mock_data');
    logInfo('[ListDetail] Forcing database data');
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
      logDebug(`[ListDetail] Fetching details for list ID: ${listId}`);
      return listService.getListDetails(listId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    onError: (err) => {
      logError(`[ListDetail] Error fetching list details:`, err);
      handleApiError(err, "fetch list details");
    }
  });

  // Destructure list data from query results
  const { list = {}, items = [] } = data || {};
  
  // Determine if user can edit
  const canEdit = isAuthenticated && user && list.user_id === user.id;
  
  // Handle adding item to user's list (QuickAdd)
  const handleQuickAdd = (item) => {
    if (!isAuthenticated) return;
    
    logDebug(`[ListDetail] Quick adding item: ${item?.restaurant_name || item?.dish_name}`);
    
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
    // Logic to edit note would go here
  };
  
  // Handle actual item deletion
  const handleDeleteItem = async () => {
    if (!itemToDelete || !itemToDelete.list_item_id) {
      logWarn('[ListDetail] Cannot delete item without ID');
      return;
    }
    
    try {
      // Call API to delete the item
      logDebug(`[ListDetail] Deleting item ${itemToDelete.list_item_id}`);
      // Implement actual delete API call here
      
      // Close dialog and refresh data
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      refetch();
    } catch (error) {
      logError('[ListDetail] Error deleting item:', error);
      handleApiError(error, 'delete item');
    }
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
      {/* Header section */}
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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{list.name || 'List'}</h1>
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

      {/* Item count and creator info */}
      <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        <span>{items.length} dish{items.length !== 1 ? 'es' : ''}</span>
        {list.creator_handle && (
          <span className="ml-2">by {list.creator_handle}</span>
        )}
        {list.updated_at && (
          <span className="ml-2">· Updated {formatRelativeDate(list.updated_at)}</span>
        )}
      </div>

      {/* List items */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">Restaurant & Dish Collection</h2>
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
      </div>

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

WorkingListDetail.propTypes = {
  listId: PropTypes.string,
  embedded: PropTypes.bool,
};

export default WorkingListDetail;
