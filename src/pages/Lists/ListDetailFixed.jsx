// src/pages/Lists/ListDetailFixed.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PropTypes from 'prop-types';
import { ArrowLeftIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/solid';
import { Loader2, Heart, HeartOff } from 'lucide-react';
import { listService } from '@/services/listService.js';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import Button from '@/components/UI/Button';
import PageContainer from '@/layouts/PageContainer';
import { formatRelativeDate } from '@/utils/formatting';
import { useQuickAdd } from '@/context/QuickAddContext';
import ConfirmationDialog from '@/components/UI/ConfirmationDialog';
import useApiErrorHandler from '@/hooks/useApiErrorHandler';
import useAuthStore from '@/stores/useAuthStore';
import { logDebug, logError, logInfo, logWarn } from '@/utils/logger';

function ListDetailFixed({ listId: propListId, embedded = false }) {
  // Basic state
  const [followStatus, setFollowStatus] = useState(false);
  const [isFollowProcessing, setIsFollowProcessing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Hooks
  const { openQuickAdd } = useQuickAdd();
  const handleApiError = useApiErrorHandler();
  const params = useParams();
  const listId = propListId || params.listId;
  const { user, isAuthenticated } = useAuthStore();
  
  // IMPORTANT: Remove any mock data flags
  useEffect(() => {
    localStorage.removeItem('use_mock_data');
    localStorage.removeItem('list_follow_changes');
    logInfo('[ListDetailFixed] Forcing real data mode');
  }, []);

  // Fetch list data
  const { 
    data: response, 
    isLoading,
    isError, 
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['listDetail', listId],
    queryFn: () => listService.getListDetails(listId),
    staleTime: 0, // Force fresh data
    enabled: !!listId
  });

  // Extract list and items data
  const listData = response?.list || {};
  const items = response?.items || [];
  
  // Update follow status from API response
  useEffect(() => {
    if (listData && 'is_following' in listData) {
      setFollowStatus(!!listData.is_following);
      logInfo(`[ListDetailFixed] Follow status from API: ${!!listData.is_following}`);
    }
  }, [listData]);

  // Handle follow toggle
  const handleToggleFollow = async () => {
    if (!isAuthenticated || isFollowProcessing) return;
    
    try {
      setIsFollowProcessing(true);
      
      // Optimistic update
      setFollowStatus(!followStatus);
      
      const result = await listService.toggleFollowList(listId);
      
      if (result.success) {
        const serverStatus = result.data?.is_following;
        if (typeof serverStatus === 'boolean') {
          setFollowStatus(serverStatus);
          logInfo(`[ListDetailFixed] Follow status updated to: ${serverStatus}`);
        }
        
        // Force refetch to get updated data
        refetch();
      } else {
        // Revert on error
        setFollowStatus(followStatus);
        handleApiError(new Error(result.message || 'Failed to toggle follow status'));
      }
    } catch (error) {
      setFollowStatus(followStatus);
      logError(`[ListDetailFixed] Error toggling follow:`, error);
      handleApiError(error);
    } finally {
      setIsFollowProcessing(false);
    }
  };
  
  // QuickAdd handler
  const handleItemQuickAdd = (e) => {
    e.preventDefault();
    openQuickAdd({
      defaultListId: listId,
      defaultListName: listData?.name
    });
  };
  
  // Delete handler
  const promptDeleteItem = (item) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };
  
  // Confirm delete
  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;
    
    try {
      await listService.removeItemFromList(listId, itemToDelete.list_item_id);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      refetch();
    } catch (err) {
      handleApiError(err);
      setShowDeleteConfirm(false);
    }
  };
  
  // Check if current user can edit this list
  const canEdit = user && listData && (
    user.id === listData.user_id || 
    user.account_type === 'superuser'
  );

  // Loading state
  if (isLoading) {
    return (
      <PageContainer className="py-4">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </PageContainer>
    );
  }

  // Error state
  if (isError || response?.error) {
    return (
      <PageContainer className="py-4">
        <ErrorMessage 
          message={(queryError || response?.error)?.message || 'Failed to load list'}
          action={{
            label: 'Try Again',
            onClick: () => refetch()
          }}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="py-4">
      {/* Header with follow button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <button
            onClick={() => window.history.back()}
            className="p-1 rounded-full hover:bg-gray-200 mr-2"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold">{listData.name}</h1>
        </div>
        
        {/* Always show follow button for logged-in users who don't own the list */}
        {isAuthenticated && listData.user_id !== user?.id && (
          <Button
            onClick={handleToggleFollow}
            variant={followStatus ? 'primary' : 'outline'}
            size="sm"
            disabled={isFollowProcessing}
            className="flex items-center gap-1"
          >
            {isFollowProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : followStatus ? (
              <HeartOff className="h-4 w-4" />
            ) : (
              <Heart className="h-4 w-4" />
            )}
            {followStatus ? 'Unfollow' : 'Follow'}
          </Button>
        )}
      </div>

      {/* List description */}
      {listData.description && (
        <p className="text-gray-600 mb-4">{listData.description}</p>
      )}

      {/* List metadata */}
      <div className="flex flex-wrap gap-2 mb-6">
        {listData.tags && listData.tags.map(tag => (
          <span 
            key={tag}
            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs"
          >
            {tag}
          </span>
        ))}
        {listData.city && (
          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-xs">
            {listData.city}
          </span>
        )}
      </div>

      <div className="text-sm text-gray-500 mb-2">
        <span>{items.length} item{items.length !== 1 ? 's' : ''}</span>
        {listData.creator_handle && (
          <span className="ml-2">by {listData.creator_handle}</span>
        )}
        {listData.updated_at && (
          <span className="ml-2">· Updated {formatRelativeDate(listData.updated_at)}</span>
        )}
      </div>

      {/* Quick add button */}
      <div className="mt-4 mb-6">
        <Button onClick={handleItemQuickAdd} variant="outline" className="flex items-center gap-1">
          <PlusIcon className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Items list */}
      <h2 className="text-xl font-semibold mb-3">Items</h2>
      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.list_item_id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100"
            >
              <div className="flex-1 min-w-0 mr-4">
                <Link
                  to={item.restaurant_id ? `/restaurants/${item.restaurant_id}` : (item.dish_id ? `/dishes/${item.dish_id}` : '#')}
                  className="text-base font-medium text-blue-700 hover:underline truncate block"
                >
                  {item.restaurant_name || item.dish_name || 'Unknown Item'}
                </Link>
                {item.restaurant_address && (
                  <p className="text-xs text-gray-500 truncate">{item.restaurant_address}</p>
                )}
                {item.note && (
                  <p className="text-sm text-gray-600 mt-1 italic">Note: {item.note}</p>
                )}
              </div>

              <div className="flex items-center space-x-1 flex-shrink-0">
                <button
                  onClick={(e) => handleItemQuickAdd(e)}
                  className="p-1 rounded-full text-gray-400 hover:text-blue-600 hover:bg-gray-200"
                  title="Quick Add"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>

                {canEdit && (
                  <>
                    <button
                      className="p-1 rounded-full text-gray-400 hover:text-green-600 hover:bg-gray-200"
                      title="Edit Note"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => promptDeleteItem(item)}
                      className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-gray-200"
                      title="Remove Item"
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
        <p className="text-gray-500">No items have been added to this list yet.</p>
      )}

      {/* Confirmation dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteItem}
        title="Confirm Delete"
        message={`Are you sure you want to remove "${itemToDelete?.restaurant_name || itemToDelete?.dish_name || 'this item'}" from the list?`}
        confirmButtonText="Delete"
        confirmButtonVariant="danger"
      />
    </PageContainer>
  );
}

ListDetailFixed.propTypes = {
  listId: PropTypes.string,
  embedded: PropTypes.bool
};

export default ListDetailFixed;
