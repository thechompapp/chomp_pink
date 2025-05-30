// src/pages/Lists/ListDetail.jsx
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

function ListDetail({ listId: propListId, embedded = false }) {
  // State management
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [sortOrder, setSortOrder] = useState('default');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const { openQuickAdd } = useQuickAdd();
  const handleApiError = useApiErrorHandler();
  
  // Get list ID from props or URL params
  const { listId: urlListId } = useParams();
  const listId = propListId || urlListId;
  
  // Auth state
  const { user, isAuthenticated  } = useAuth();
  
  // Ensure we're using real data
  useEffect(() => {
    // Remove any mock data flags to force DB connection
    localStorage.removeItem('use_mock_data');
    logInfo('[ListDetail] Forcing database data');
  }, []);

  // Fetch list data using React Query with enhanced error handling
  const { 
    data, 
    isLoading, 
    isError,
    error,
    refetch 
  } = useQuery({
    queryKey: ['listDetail', listId],
    queryFn: async () => {
      logDebug(`[ListDetail] Fetching details for list ID: ${listId}`);
      try {
        // First get the list details
        const listResult = await listService.getList(listId);
        if (!listResult || !listResult.data) {
          throw new Error('Invalid or empty list data received');
        }
        
        // Then get the list items
        const itemsResult = await listService.getListItems(listId);
        
        // Combine the results into the expected format
        return {
          list: listResult.data,
          items: itemsResult?.data || []
        };
      } catch (err) {
        logError(`[ListDetail] Error in query function:`, err);
        // Rethrow to let React Query handle it
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: attempt => Math.min(attempt > 1 ? 2000 : 1000, 30 * 1000),
    onError: (err) => {
      logError(`[ListDetail] Error fetching list details:`, err);
      handleApiError(err, "fetch list details");
    }
  });

  // Destructure list data from query results
  const { list = {}, items: rawItems = [] } = data || {};
  
  // Apply sorting to items
  const items = useMemo(() => {
    if (!rawItems || !Array.isArray(rawItems)) return [];
    
    let sortedItems = [...rawItems];
    
    switch (sortOrder) {
      case 'az':
        return sortedItems.sort((a, b) => {
          const nameA = (a.restaurant_name || a.dish_name || '').toLowerCase();
          const nameB = (b.restaurant_name || b.dish_name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      case 'za':
        return sortedItems.sort((a, b) => {
          const nameA = (a.restaurant_name || a.dish_name || '').toLowerCase();
          const nameB = (b.restaurant_name || b.dish_name || '').toLowerCase();
          return nameB.localeCompare(nameA);
        });
      // Could implement distance sorting with geolocation
      case 'distance':
        logInfo('[ListDetail] Distance sorting requested - would require geolocation');
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
  
  // Handle edit note button click
  const handleEditItemNote = (item) => {
    logDebug(`[ListDetail] Edit note for item: ${item.list_item_id}`);
    // Edit note implementation would go here
  };
  
  // Handle delete confirmation
  const handleDeleteItemClick = (item) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
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
        <div className="py-8 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading list...</p>
        </div>
      </PageContainer>
    );
  }

  // Enhanced error state with retry button and offline recovery
  if (isError) {
    return (
      <PageContainer>
        <div className="py-8 flex flex-col items-center">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
              Unable to load list
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {error?.message || 'There was an issue connecting to the server.'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This could be due to network connectivity issues or the server may be temporarily unavailable.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => refetch()}
              className="flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
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
      </PageContainer>
    );
  }

  // Render main content
  return (
    <PageContainer>
      {/* List header */}
      <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
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
      </div>

      {/* Sorting controls */}
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Restaurant & Dish Collection</h2>
        
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
      <div className="mt-6">
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
                        className="p-1 rounded-full text-gray-400 hover:text-yellow-600 hover:bg-gray-200 dark:hover:text-yellow-400 dark:hover:bg-gray-600 transition-colors"
                        title="Edit note"
                        aria-label="Edit note"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItemClick(item)}
                        className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-gray-200 dark:hover:text-red-400 dark:hover:bg-gray-600 transition-colors"
                        title="Remove from list"
                        aria-label="Remove from list"
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
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">This list is empty.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              {canEdit 
                ? "Add restaurants and dishes to create your collection."
                : "The owner hasn't added any restaurants or dishes yet."}
            </p>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteItem}
        title="Remove Item"
        message={`Are you sure you want to remove "${itemToDelete?.restaurant_name || itemToDelete?.dish_name || 'this item'}" from your list?`}
        confirmText="Remove"
        cancelText="Cancel"
        isDanger
      />
    </PageContainer>
  );
}

ListDetail.propTypes = {
  listId: PropTypes.string,
  embedded: PropTypes.bool
};

export default ListDetail;
