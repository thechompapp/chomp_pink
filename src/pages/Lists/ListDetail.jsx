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
  const { id: urlListId } = useParams();
  const listId = propListId || urlListId;
  
  // Auth state
  const { user, isAuthenticated  } = useAuth();
  
  // DEBUG: Log all the imports and variables at component load
  console.log(`🚀 [ListDetail] Component initialized with:`, {
    listId,
    propListId,
    urlListId,
    isAuthenticated,
    userId: user?.id,
    listServiceType: typeof listService,
    listServiceKeys: Object.keys(listService || {}),
    getListItemsExists: !!(listService?.getListItems),
    getListItemsType: typeof listService?.getListItems
  });
  
  // Ensure we're using real data
  useEffect(() => {
    // Remove any mock data flags to force DB connection
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
      console.log(`🌐 [ListDetail] Fetching list details for ID: ${listId}`);
      
      // DEBUG: Check authentication state
      console.log(`🔑 [ListDetail] Auth check:`, {
        isAuthenticated,
        hasUser: !!user,
        userId: user?.id,
        userRole: user?.role
      });
      
      const result = await listService.getList(listId);
      console.log(`✅ [ListDetail] List details result:`, result);
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    enabled: !!listId,
    onError: (err) => {
      console.error(`🚨 [ListDetail] List details error:`, err);
      handleApiError(err, "fetch list details");
    },
    onSuccess: (data) => {
      console.log(`✅ [ListDetail] List details success:`, data);
    }
  });

  // DEBUG: Check enabled condition for list items query
  const listItemsEnabled = !!listId;
  console.log(`🔍 [ListDetail] List items query enabled condition:`, {
    listId,
    listIdType: typeof listId,
    listIdTruthy: !!listId,
    enabled: listItemsEnabled
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
      console.log(`🌐 [ListDetail] ===== LIST ITEMS QUERY STARTING =====`);
      console.log(`🌐 [ListDetail] Fetching items for list ID: ${listId}`);
      console.log(`🔍 [ListDetail] listService object:`, listService);
      console.log(`🔍 [ListDetail] getListItems function:`, listService.getListItems);
      
      // Test if function exists
      if (typeof listService.getListItems !== 'function') {
        console.error(`🚨 [ListDetail] getListItems is not a function!`, typeof listService.getListItems);
        throw new Error('getListItems is not a function');
      }
      
      try {
        console.log(`📡 [ListDetail] Calling listService.getListItems(${listId})`);
        const result = await listService.getListItems(listId);
        console.log(`✅ [ListDetail] List items result:`, result);
        console.log(`📝 [ListDetail] Items data:`, result?.data);
        console.log(`📊 [ListDetail] Items count:`, result?.data?.length);
        console.log(`🔍 [ListDetail] Full result structure:`, JSON.stringify(result, null, 2));
        console.log(`🌐 [ListDetail] ===== LIST ITEMS QUERY COMPLETED =====`);
        return result;
      } catch (apiError) {
        console.error(`🚨 [ListDetail] API Error in getListItems:`, apiError);
        console.error(`🚨 [ListDetail] Error details:`, {
          message: apiError.message,
          stack: apiError.stack,
          name: apiError.name
        });
        throw apiError;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      console.log(`🔄 [ListDetail] Query retry attempt ${failureCount}:`, error);
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    enabled: listItemsEnabled, // Use the debug variable
    onError: (err) => {
      console.error(`🚨 [ListDetail] List items error:`, err);
      handleApiError(err, "fetch list items");
    },
    onSuccess: (data) => {
      console.log(`✅ [ListDetail] List items success:`, data);
      console.log(`📝 [ListDetail] Items loaded: ${data?.data?.length || 0}`);
    }
  });

  // DEBUG: Log query states
  console.log(`🔍 [ListDetail] Query states:`, {
    isLoadingList,
    isLoadingItems,
    isListError,
    isItemsError,
    listData: !!listData,
    itemsData: !!itemsData
  });

  // Extract data from queries
  const list = listData?.data || {};
  const rawItems = itemsData?.data || [];
  
  console.log(`🔍 [ListDetail] Final data check:`, {
    listId,
    hasListData: !!listData,
    hasItemsData: !!itemsData,
    listName: list?.name,
    itemsCount: rawItems?.length,
    rawItems
  });
  
  // Apply sorting to items
  const items = useMemo(() => {
    console.log(`🔄 [ListDetail] useMemo items recalculating:`, {
      rawItems,
      rawItemsType: typeof rawItems,
      rawItemsIsArray: Array.isArray(rawItems),
      rawItemsLength: rawItems?.length,
      sortOrder
    });
    
    if (!rawItems || !Array.isArray(rawItems)) {
      console.log(`⚠️ [ListDetail] Items not an array:`, { rawItems, type: typeof rawItems });
      return [];
    }
    
    let sortedItems = [...rawItems];
    console.log(`✅ [ListDetail] Creating sorted items array:`, {
      sortedItemsLength: sortedItems.length,
      sortOrder
    });
    
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
      // Could implement distance sorting with geolocation
      case 'distance':
        logInfo('[ListDetail] Distance sorting requested - would require geolocation');
        return sortedItems;
      default:
        console.log(`🔄 [ListDetail] Returning default sorted items:`, {
          itemsLength: sortedItems.length,
          firstItem: sortedItems[0],
          lastItem: sortedItems[sortedItems.length - 1]
        });
        return sortedItems;
    }
  }, [rawItems, sortOrder]);
  
  console.log(`🎯 [ListDetail] Final items after useMemo:`, {
    itemsLength: items?.length,
    items,
    itemsIsArray: Array.isArray(items)
  });
  
  // Determine loading and error states
  const isLoading = isLoadingList || isLoadingItems;
  const isError = isListError || isItemsError;
  const error = listError || itemsError;
  
  // Determine if user can edit
  const canEdit = isAuthenticated && user && list.user_id === user.id;
  
  // Handle adding item to user's list (QuickAdd)
  const handleQuickAdd = (item) => {
    if (!isAuthenticated) return;
    
    logDebug(`[ListDetail] Quick adding item: ${item?.restaurant_name || item?.dish_name || item?.name}`);
    
    openQuickAdd({
      defaultListId: null, // Don't pre-select any list
      defaultItemData: {
        restaurant_id: item.restaurant_id || (item.item_type === 'restaurant' ? item.item_id : null),
        restaurant_name: item.restaurant_name || (item.item_type === 'restaurant' ? item.name : null),
        dish_id: item.dish_id || (item.item_type === 'dish' ? item.item_id : null),
        dish_name: item.dish_name || (item.item_type === 'dish' ? item.name : null),
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
      refetchItems();
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
    console.log(`🔄 [ListDetail] Rendering loading state:`, { isLoading, isLoadingList, isLoadingItems });
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
    console.log(`🚨 [ListDetail] Rendering error state:`, { isError, isListError, isItemsError, error });
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
              onClick={() => {
                window.location.reload(); // Force reload to retry both queries
              }}
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
  console.log(`✅ [ListDetail] Rendering main content:`, {
    isLoading,
    isError,
    listName: list?.name,
    itemsLength: items?.length,
    hasItems: !!(items && items.length > 0),
    firstItem: items?.[0]
  });
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
                  className={`w-full text-left px-4 py-2 text-sm ${sortOrder === 'distance' ? 'bg-gray-100 dark:bg-gray-700 font-medium' : 'hover:bg-gray-700'}`}
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
        {console.log(`🎬 [ListDetail] About to render items section:`, {
          items,
          itemsLength: items?.length,
          itemsIsArray: Array.isArray(items),
          hasItemsAndLength: !!(items && items.length > 0),
          itemsCondition: items && items.length > 0
        })}
        {items && items.length > 0 ? (
          <>
            {console.log(`🎭 [ListDetail] Rendering ${items.length} items`)}
            <ul className="space-y-2">
              {items.map((item, index) => {
                console.log(`🎬 [ListDetail] Rendering item ${index}:`, item);
                return (
                  <li
                    key={item.list_item_id || item.id || `item-${Date.now()}-${Math.random()}`}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <Link
                        to={item.item_type === 'restaurant' ? `/restaurants/${item.item_id}` : 
                            item.item_type === 'dish' ? `/dishes/${item.item_id}` : 
                            item.restaurant_id ? `/restaurants/${item.restaurant_id}` : 
                            item.dish_id ? `/dishes/${item.dish_id}` : '#'}
                        className="text-base font-medium text-blue-700 hover:underline dark:text-blue-400 truncate block"
                        title={item.name || item.restaurant_name || item.dish_name || 'Unknown Item'}
                      >
                        {item.name || item.restaurant_name || item.dish_name || 'Unknown Item'}
                      </Link>
                      {item.restaurant_address && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.restaurant_address}</p>
                      )}
                      {item.note && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 italic">Note: {item.note}</p>
                      )}
                      {/* Debug info */}
                      <p className="text-xs text-gray-400 mt-1">
                        Type: {item.item_type} | ID: {item.item_id} | List Item ID: {item.list_item_id || item.id}
                      </p>
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
                );
              })}
            </ul>
          </>
        ) : (
          <>
            {console.log(`🎭 [ListDetail] Rendering empty state`)}
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">This list is empty.</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                {canEdit 
                  ? "Add restaurants and dishes to create your collection."
                  : "The owner hasn't added any restaurants or dishes yet."}
              </p>
              {/* Debug info */}
              <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs text-left">
                <p><strong>Debug Info:</strong></p>
                <p>List ID: {listId}</p>
                <p>Items data: {JSON.stringify(rawItems)}</p>
                <p>Items loading: {isLoadingItems.toString()}</p>
                <p>Items error: {isItemsError.toString()}</p>
                <p>List loading: {isLoadingList.toString()}</p>
                <p>List error: {isListError.toString()}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteItem}
        title="Remove Item"
      >
        Are you sure you want to remove "{itemToDelete?.restaurant_name || itemToDelete?.dish_name || itemToDelete?.name || 'this item'}" from your list?
      </ConfirmationDialog>
    </PageContainer>
  );
}

ListDetail.propTypes = {
  listId: PropTypes.string,
  embedded: PropTypes.bool
};

export default ListDetail;
