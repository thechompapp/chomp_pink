/* OBSOLETE: This component has been replaced by EnhancedListModal
// This file is marked for deletion after testing confirms no regressions
*/

/*
// src/components/FixedListDetailModal.jsx
import React, { useState, useEffect, useMemo, Fragment } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query'; // THIS IMPORT IS CRUCIAL and should be at the top
import { Dialog, Transition } from '@headlessui/react';
// Using XMarkHeroIcon as the specific name from Heroicons if an X is needed from there.
// However, the component currently uses XLucideIcon for the close button.
import { XMarkIcon as XMarkHeroIcon, PencilIcon, TrashIcon, PlusIcon as PlusHeroIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'; 
import { Loader2, AlertCircle, X as XLucideIcon, PlusCircle } from 'lucide-react'; // Added PlusCircle for consistency
import { listService } from '@/services/listService';
import { formatRelativeDate } from '@/utils/formatting';
import { useQuickAdd } from '@/contexts/QuickAddContext'; // Assuming this context provides openQuickAddModal
import { useAuth } from '@/contexts/auth/AuthContext'; // Fixed import
import useFollowStore from '@/stores/useFollowStore';
import Button from '@/components/UI/Button';
import { engagementService } from '@/services/engagementService';
import { logDebug, logError, logInfo } from '@/utils/logger';

export default function FixedListDetailModal({ listId, isOpen, onClose }) {
  const [sortOrder, setSortOrder] = useState('default');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingOperations, setPendingOperations] = useState([]);
  
  const { openQuickAddModal } = useQuickAdd(); 
  const { user, isAuthenticated } = useAuth(); // Migrated from useAuthStore
  
  const { 
    isFollowing, 
    toggleFollowStatus,
    isTogglingFollow // This is an object: { [listId]: boolean }
  } = useFollowStore();
  
  // Get loading state specific to this list's follow action
  const currentListIsFollowProcessing = listId ? (isTogglingFollow[listId] || false) : false;
  const followStatus = listId ? isFollowing(listId) : false;
  
  // Debugging log to trace listId prop
  useEffect(() => {
    if (isOpen) {
      logInfo(`[FixedListDetailModal] Modal is open. Current listId prop: ${listId}`);
    }
  }, [isOpen, listId]);

  // Offline/Online event listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    setIsOffline(!navigator.onLine); // Set initial state
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Effect to reset sort order and log view engagement when modal opens for a new list
  useEffect(() => {
    if (isOpen) {
      setSortOrder('default');
      setSortMenuOpen(false);
      if (listId) {
        engagementService.logEngagement({
          item_id: parseInt(String(listId), 10),
          item_type: 'list',
          engagement_type: 'view_detail',
        }).catch(err => {
          logError('[FixedListDetailModal] Failed to log view_detail engagement', err);
        });
      }
    }
  }, [isOpen, listId]); // Rerun if isOpen or listId changes
  
  // Effect to process pending operations when coming back online
  useEffect(() => {
    if (!isOffline && pendingOperations.length > 0) {
      const processPendingOperations = async () => {
        logInfo('[FixedListDetailModal] Processing pending operations:', pendingOperations);
        const operationsToProcess = [...pendingOperations]; // Copy operations
        setPendingOperations([]); // Clear pending operations immediately
        for (const op of operationsToProcess) {
          try {
            if (op.type === 'follow' && op.listIdToToggle) { 
              await toggleFollowStatus(op.listIdToToggle, listService.toggleFollowList);
            }
            // Add other operation types here if needed
          } catch (err) {
            logError(`[FixedListDetailModal] Failed to process pending operation: ${op.type} for list ${op.listIdToToggle}`, err);
            // Optionally, re-add failed operations to pendingOperations or notify user
          }
        }
      };
      processPendingOperations();
    }
  }, [isOffline, pendingOperations, toggleFollowStatus]);

  // React Query to fetch list details
  const { 
    data, 
    isLoading, 
    error,
    refetch,
    isFetching, // To detect background refetches
  } = useQuery({
    queryKey: ['listDetail', listId], // Query key includes listId, so it refetches when listId changes
    queryFn: async () => {
      if (!listId) { // Guard clause if listId is null/undefined
        logError('[FixedListDetailModal] queryFn called with no listId.');
        // Return null or an empty structure to avoid breaking destructuring later
        // Or throw an error if listId is absolutely required and this state is unexpected
        return Promise.resolve({ list: null, items: [] }); 
      }
      logDebug(`[FixedListDetailModal] Fetching details for list ID: ${listId}`);
      const result = await listService.getListDetails(listId);
      // More robust check for a valid response structure
      if (!result || (typeof result.list === 'undefined' && typeof result.items === 'undefined')) { 
        logError('[FixedListDetailModal] Invalid response format from API', { listId, result });
        throw new Error('Invalid response format from API');
      }
      logDebug(`[FixedListDetailModal] Fetched data for list ${listId}:`, {
        listName: result.list?.name,
        itemCount: result.items?.length || 0
      });
      return result;
    },
    enabled: isOpen && !!listId, // Only fetch if modal is open and listId is present
    staleTime: 1 * 60 * 1000, // Data is considered fresh for 1 minute
    cacheTime: 15 * 60 * 1000, // Cache data for 15 minutes
    refetchOnWindowFocus: true, // Refetch if window regains focus and data is stale
    retry: 2, // Retry failed requests 2 times
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 15000) // Exponential backoff for retries
  });
  
  const isOwner = useMemo(() => {
    if (!data?.list || !user) return false;
    return parseInt(data.list.user_id, 10) === parseInt(user.id, 10);
  }, [data?.list, user]);
  
  // Fallback to empty objects/arrays to prevent errors if data is not yet loaded or list/items are null
  const list = data?.list || {}; 
  const items = data?.items || []; 
  
  const sortedItems = useMemo(() => {
    if (!items.length) return []; // Return empty if no items
    const itemsToSort = [...items]; // Create a new array for sorting
    
    switch (sortOrder) {
      case 'az':
        return itemsToSort.sort((a, b) => 
          (a.name || a.restaurant_name || a.dish_name || '').localeCompare(b.name || b.restaurant_name || b.dish_name || '')
        );
      case 'za':
        return itemsToSort.sort((a, b) => 
          (b.name || b.restaurant_name || b.dish_name || '').localeCompare(a.name || a.restaurant_name || a.dish_name || '')
        );
      default: // 'default' or any other case
        return itemsToSort; // Original order from backend
    }
  }, [items, sortOrder]);
  
  const handleToggleFollow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated || currentListIsFollowProcessing || !listId) {
        if(!isAuthenticated) alert("Please log in to follow lists.");
        return;
    }
    
    logDebug(`[FixedListDetailModal] Attempting to ${followStatus ? 'unfollow' : 'follow'} list ${listId}`);
    engagementService.logEngagement({
      item_id: parseInt(String(listId), 10), item_type: 'list', engagement_type: followStatus ? 'unfollow' : 'follow',
    }).catch(err => logError('[FixedListDetailModal] Failed to log follow/unfollow engagement', err));
      
    if (isOffline) {
      setPendingOperations(prev => [...prev, { type: 'follow', listIdToToggle: listId }]);
      logInfo(`[FixedListDetailModal] Queued ${followStatus ? 'unfollow' : 'follow'} for list ${listId}`);
      // Consider optimistic UI update here if useFollowStore doesn't handle it for offline
    } else {
      try {
        await toggleFollowStatus(listId, listService.toggleFollowList); 
        logInfo(`[FixedListDetailModal] Successfully toggled follow for list ${listId}.`);
        // UI should update based on useFollowStore's optimistic update or cache invalidation
      } catch (err) {
        logError(`[FixedListDetailModal] Error toggling follow for list ${listId}:`, err);
        alert(`Failed to ${followStatus ? 'unfollow' : 'follow'} list. Please try again.`);
      }
    }
  };
  
  const handleQuickAddItem = (itemData) => { 
    if (!isAuthenticated || !itemData) return;
    const itemName = itemData?.restaurant_name || itemData?.dish_name || 'this item';
    logDebug(`[FixedListDetailModal] Quick adding item: ${itemName} from list ${listId}`);
    
    engagementService.logEngagement({
      item_id: parseInt(String(itemData.id || itemData.restaurant_id || itemData.dish_id), 10),
      item_type: itemData.restaurant_id ? 'restaurant' : (itemData.dish_id ? 'dish' : 'item'),
      engagement_type: 'quick_add_from_list_detail_attempt',
      related_item_id: parseInt(String(listId), 10),
      related_item_type: 'list'
    }).catch(err => logError('[FixedListDetailModal] Failed to log quick_add engagement', err));
        
    openQuickAddModal({ 
      itemData: { 
        id: itemData.id || itemData.restaurant_id || itemData.dish_id,
        name: itemName,
        type: itemData.restaurant_id ? 'restaurant' : (itemData.dish_id ? 'dish' : 'item'),
        restaurant_name: itemData.restaurant_name, 
      },
      sourceListId: listId 
    });
  };
  
  const changeSortOrder = (order) => {
    setSortOrder(order);
    setSortMenuOpen(false);
  };

  // More robust loading state check
  const actualIsLoading = isLoading || (isFetching && !data?.list); 
  
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}> {/* Increased z-index */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-2 sm:p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md md:max-w-lg transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 text-left align-middle shadow-2xl transition-all">
                <div className="relative bg-gradient-to-br from-gray-700 via-gray-800 to-black px-5 py-4 text-white">
                  <Dialog.Title as="h3" className="text-lg sm:text-xl font-semibold leading-6 line-clamp-2" title={list.name}>
                    {list.name || (actualIsLoading ? 'Loading...' : 'List Details')}
                  </Dialog.Title>
                  
                  {!actualIsLoading && list.username && (
                    <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm">
                      <p className="text-gray-300">
                        by <span className="font-medium hover:underline cursor-pointer">@{list.username}</span>
                      </p>
                      {list.updated_at && (
                        <p className="text-gray-400">
                          • Updated {formatRelativeDate(list.updated_at)}
                        </p>
                      )}
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-3 top-3 rounded-full p-1.5 text-gray-300 hover:bg-white/20 transition-colors"
                    aria-label="Close dialog"
                  >
                    <XLucideIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
                
                {actualIsLoading && (
                  <div className="flex flex-col items-center justify-center p-10 min-h-[200px]">
                    <Loader2 className="h-10 w-10 animate-spin text-primary-500 dark:text-primary-400" />
                    <p className="mt-4 text-gray-600 dark:text-gray-300">Loading list details...</p>
                  </div>
                )}
                
                {error && !actualIsLoading && (
                  <div className="flex flex-col items-center justify-center p-6 text-center min-h-[200px]">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                    <p className="mt-3 text-lg font-medium text-red-700 dark:text-red-400">
                      Could Not Load List
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {error.message || "There was an issue fetching the details."}
                    </p>
                    <Button 
                      onClick={() => refetch()} 
                      className="mt-6"
                      variant="primary"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
                
                {!actualIsLoading && !error && data && ( 
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    <div className="p-4 sm:p-5"> 
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-grow">
                          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                            {list.description || (list.username ? `A collection by @${list.username}.` : "No description provided.")}
                          </p>
                        </div>
                        
                        <div className="flex space-x-2 flex-shrink-0">
                          {isOwner && (
                            <Button variant="icon" size="sm" title="Edit list (Not implemented)">
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          )}
                          {isAuthenticated && !isOwner && listId && ( 
                            <Button
                              variant={followStatus ? "outline" : "primary"}
                              size="sm"
                              onClick={handleToggleFollow}
                              isLoading={currentListIsFollowProcessing}
                              className="min-w-[80px]" // Ensure button doesn't resize much when loading
                            >
                              {followStatus ? 'Following' : 'Follow'}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">{items.length}</span> {items.length === 1 ? 'item' : 'items'}
                        </div>
                        
                        {items.length > 1 && ( 
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setSortMenuOpen(!sortMenuOpen)}
                              className="flex items-center rounded-md bg-gray-100 dark:bg-gray-700 px-3 py-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
                            >
                              Sort: <span className="font-medium ml-1">{sortOrder === 'az' ? 'A-Z' : sortOrder === 'za' ? 'Z-A' : 'Default'}</span>
                            </button>
                            <Transition
                                as={Fragment}
                                show={sortMenuOpen}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                              <div className="absolute right-0 mt-1 w-40 origin-top-right rounded-md bg-white dark:bg-gray-700 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20"> {/* Increased z-index for sort dropdown */}
                                <div className="py-1">
                                  {['default', 'az', 'za'].map(order => (
                                    <button
                                      key={order}
                                      onClick={() => changeSortOrder(order)}
                                      className={`flex w-full items-center px-4 py-2 text-sm ${sortOrder === order ? 'font-semibold text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-200'} hover:bg-gray-100 dark:hover:bg-gray-600`}
                                    >
                                      {order === 'az' ? <ArrowUpIcon className="mr-2 h-4 w-4 opacity-70" /> : order === 'za' ? <ArrowDownIcon className="mr-2 h-4 w-4 opacity-70" /> : null}
                                      {order === 'az' ? 'Name (A-Z)' : order === 'za' ? 'Name (Z-A)' : 'Default Order'}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </Transition>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="max-h-[calc(100vh-350px)] sm:max-h-[45vh] overflow-y-auto no-scrollbar"> {/* Adjusted max height */}
                      {sortedItems.length === 0 && !actualIsLoading && ( // Only show if not loading
                        <div className="p-8 text-center">
                          <p className="text-gray-500 dark:text-gray-400">This list is currently empty.</p>
                        </div>
                      )}
                      
                      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {sortedItems.map((item) => (
                          <li key={item.id || item.list_item_id || `${item.restaurant_id}-${item.dish_id}`} className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <div className="flex justify-between items-center">
                              <div className="flex-grow min-w-0">
                                <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate" title={item.name || item.restaurant_name || item.dish_name}>
                                  {item.name || item.restaurant_name || item.dish_name}
                                </h4>
                                
                                {item.restaurant_name && item.dish_name && ( 
                                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate" title={item.restaurant_name}>
                                    at {item.restaurant_name}
                                  </p>
                                )}
                                
                                {item.note && (
                                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2">
                                    Note: {item.note}
                                  </p>
                                )}
                              </div>
                              
                              {isAuthenticated && ( 
                                <Button
                                  variant="icon"
                                  size="sm"
                                  onClick={() => handleQuickAddItem(item)}
                                  className="ml-2 flex-shrink-0 text-gray-500 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400 p-1.5 rounded-full" // Made it round
                                  title={`Add ${item.name || item.restaurant_name || item.dish_name} to another list`}
                                >
                                  <PlusHeroIcon className="h-4 w-4 sm:h-5 sm:w-5" /> {/* Using PlusHeroIcon from imports */}
                                </Button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                {isOffline && (
                  <div className="bg-yellow-100 dark:bg-yellow-700/30 border-t border-yellow-300 dark:border-yellow-600 px-4 py-2.5 text-xs sm:text-sm text-yellow-800 dark:text-yellow-200 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    You're currently offline. Some actions may be queued.
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

FixedListDetailModal.propTypes = {
  listId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), 
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};
