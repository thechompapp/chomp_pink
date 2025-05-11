// src/components/FixedListDetailModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { XMarkIcon, PencilIcon, TrashIcon, PlusIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { Loader2, AlertCircle } from 'lucide-react';
import { listService } from '@/services/listService';
import { formatRelativeDate } from '@/utils/formatting';
import { useQuickAdd } from '@/context/QuickAddContext';
import useAuthStore from '@/stores/useAuthStore';
import useFollowStore from '@/stores/useFollowStore';
import Button from '@/components/UI/Button';
import { engagementService } from '@/services/engagementService';
import { logDebug, logError, logInfo } from '@/utils/logger';

export default function FixedListDetailModal({ listId, isOpen, onClose }) {
  // State management
  const [sortOrder, setSortOrder] = useState('default');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isFollowProcessing, setIsFollowProcessing] = useState(false);
  const [pendingOperations, setPendingOperations] = useState([]);
  
  // Hooks
  const { openQuickAdd } = useQuickAdd();
  const { user, isAuthenticated } = useAuthStore();
  const { isFollowing, toggleFollowStatus } = useFollowStore();
  
  // Get follow status for this list
  const followStatus = isFollowing(listId);
  
  // Check for offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    // Set initial state
    setIsOffline(!navigator.onLine);
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Reset sort order when modal opens with a new list
  useEffect(() => {
    if (isOpen) {
      setSortOrder('default');
      setSortMenuOpen(false);
      
      // Log engagement when opening detail view
      if (listId) {
        engagementService.logEngagement({
          item_id: parseInt(String(listId), 10),
          item_type: 'list',
          engagement_type: 'view_detail',
        }).catch(err => {
          logError('[FixedListDetailModal] Failed to log engagement', err);
        });
      }
    }
  }, [isOpen, listId]);
  
  // Process any pending operations when coming back online
  useEffect(() => {
    if (!isOffline && pendingOperations.length > 0) {
      const processPendingOperations = async () => {
        logInfo('[FixedListDetailModal] Processing pending operations');
        const operations = [...pendingOperations];
        setPendingOperations([]);
        
        for (const op of operations) {
          try {
            if (op.type === 'follow') {
              await toggleFollowStatus(op.listId);
            }
            // Add other operation types as needed
          } catch (err) {
            logError(`[FixedListDetailModal] Failed to process operation: ${op.type}`, err);
          }
        }
      };
      
      processPendingOperations();
    }
  }, [isOffline, pendingOperations, toggleFollowStatus]);

  // Fetch list data using React Query with enhanced error handling and retry logic
  const { 
    data, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['listDetail', listId],
    queryFn: async () => {
      logDebug(`[FixedListDetailModal] Fetching details for list ID: ${listId}`);
      try {
        // Force using the database connection, not mock data
        localStorage.removeItem('use_mock_data');
        
        const result = await listService.getListDetails(listId);
        if (!result || (!result.list && !result.items)) {
          throw new Error('Invalid response format from API');
        }
        
        logDebug(`[FixedListDetailModal] Fetched data for list ${listId}:`, {
          listName: result.list?.name,
          itemCount: result.items?.length || 0
        });
        
        return result;
      } catch (err) {
        logError(`[FixedListDetailModal] Error in query function:`, err);
        
        // If we're offline, try to get data from cache
        if (!navigator.onLine) {
          logInfo('[FixedListDetailModal] Offline mode - attempting to use cached data');
        }
        
        // Log error directly
        logError(`[FixedListDetailModal] Failed to fetch list details: ${err.message || 'Unknown error'}`);
        
        // Rethrow to let React Query handle it
        throw err;
      }
    },
    enabled: isOpen && !!listId, // Only fetch when modal is open
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes cache for offline access
    refetchOnWindowFocus: false,
    retry: 3, // Retry failed requests 3 times
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000) // Exponential backoff
  });
  
  // Check if current user is the owner of this list
  const isOwner = useMemo(() => {
    if (!data?.list || !user) return false;
    return parseInt(data.list.user_id, 10) === parseInt(user.id, 10);
  }, [data?.list, user]);
  
  // Get list data
  const list = data?.list || {};
  const items = data?.items || [];
  
  // Apply sorting to list items
  const sortedItems = useMemo(() => {
    if (!items) return [];
    
    // Ensure items is treated as an array, even if there are only 1-2 items
    const itemsToSort = Array.isArray(items) ? [...items] : (items.id ? [items] : []);
    
    // Log the items to help with debugging
    logDebug(`[FixedListDetailModal] Sorting ${itemsToSort.length} items. Raw items:`, items);
    
    switch (sortOrder) {
      case 'az':
        return itemsToSort.sort((a, b) => {
          const nameA = (a.restaurant_name || a.dish_name || '').toLowerCase();
          const nameB = (b.restaurant_name || b.dish_name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
      case 'za':
        return itemsToSort.sort((a, b) => {
          const nameA = (a.restaurant_name || a.dish_name || '').toLowerCase();
          const nameB = (b.restaurant_name || b.dish_name || '').toLowerCase();
          return nameB.localeCompare(nameA);
        });
      case 'distance':
        return itemsToSort;
      default:
        return itemsToSort;
    }
  }, [items, sortOrder]);
  
  // Handle follow/unfollow toggle with offline resilience
  const handleToggleFollow = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!isAuthenticated || isFollowProcessing) return;
    
    try {
      setIsFollowProcessing(true);
      
      // Track engagement
      engagementService.logEngagement({
        item_id: parseInt(String(listId), 10),
        item_type: 'list',
        engagement_type: followStatus ? 'unfollow' : 'follow',
      }).catch(err => {
        logError('[FixedListDetailModal] Failed to log engagement', err);
      });
      
      if (isOffline) {
        // Store the operation to be processed when back online
        setPendingOperations(prev => [...prev, { type: 'follow', listId }]);
        logInfo(`[FixedListDetailModal] Queued ${followStatus ? 'unfollow' : 'follow'} operation for list ${listId}`);
      } else {
        // Perform the operation immediately
        await toggleFollowStatus(listId);
        logInfo(`[FixedListDetailModal] ${followStatus ? 'Unfollowed' : 'Followed'} list ${listId}`);
      }
    } catch (err) {
      logError(`[FixedListDetailModal] Error toggling follow:`, err);
      // Log the error directly
      console.error(`Failed to toggle follow status: ${err.message || 'Unknown error'}`);
    } finally {
      setIsFollowProcessing(false);
    }
  };
  
  // Handle adding item to user's list (QuickAdd) with offline resilience
  const handleQuickAdd = (item) => {
    if (!isAuthenticated || !item) return;
    
    const itemName = item?.restaurant_name || item?.dish_name;
    logDebug(`[FixedListDetailModal] Quick adding item: ${itemName}`);
    
    // Track engagement for quick add attempt
    engagementService.logEngagement({
      item_id: parseInt(String(item.id || item.restaurant_id || item.dish_id), 10),
      item_type: item.restaurant_id ? 'restaurant' : (item.dish_id ? 'dish' : 'item'),
      engagement_type: 'quick_add_attempt',
      related_item_id: parseInt(String(listId), 10),
      related_item_type: 'list'
    }).catch(err => {
      logError('[FixedListDetailModal] Failed to log engagement', err);
    });
    
    // If offline, provide feedback but still allow the operation
    if (isOffline) {
      logInfo(`[FixedListDetailModal] Quick adding item in offline mode: ${itemName}`);
    }
    
    // Open the quick add dialog with the selected item's data
    openQuickAdd({
      defaultListId: null, // Don't pre-select any list
      defaultItemData: {
        restaurant_id: item.restaurant_id,
        restaurant_name: item.restaurant_name,
        dish_id: item.dish_id,
        dish_name: item.dish_name,
        note: item.note,
      },
      offlineMode: isOffline
    });
  };
  
  // Change sort order
  const changeSortOrder = (order) => {
    setSortOrder(order);
    setSortMenuOpen(false);
  };
  
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Background overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-80"
          leave="ease-in duration-150"
          leaveFrom="opacity-80"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        </Transition.Child>

        {/* Modal panel */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-2 sm:p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md md:max-w-lg transform overflow-hidden rounded-xl bg-white text-left align-middle shadow-2xl transition-all">
                {/* Modal header */}
                <div className="relative bg-gradient-to-r from-gray-800 to-black px-6 py-4 text-white">
                  <Dialog.Title as="h3" className="text-xl font-semibold leading-6">
                    {list.name || 'List Details'}
                  </Dialog.Title>
                  
                  <div className="flex items-center gap-1 mt-1">
                    {list.username && (
                      <p className="text-sm text-gray-200">
                        by <span className="font-medium">@{list.username}</span>
                      </p>
                    )}
                    
                    {list.updated_at && (
                      <p className="text-sm text-gray-300 mt-1">
                        • Updated {formatRelativeDate(list.updated_at)}
                      </p>
                    )}
                  </div>
                  
                  {/* Close button */}
                  <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full p-1 hover:bg-gray-700/50 transition-colors"
                    aria-label="Close dialog"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                {/* Loading state */}
                {isLoading && (
                  <div className="flex flex-col items-center justify-center p-10">
                    <Loader2 className="h-10 w-10 animate-spin text-gray-700" />
                    <p className="mt-4 text-gray-600">Loading list details...</p>
                  </div>
                )}
                
                {/* Error state */}
                {error && !isLoading && (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <AlertCircle className="h-10 w-10 text-red-500" />
                    <p className="mt-2 text-lg font-medium text-red-800">
                      Something went wrong
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      We couldn't load this list. Please try again.
                    </p>
                    <Button 
                      onClick={() => refetch()} 
                      className="mt-4 bg-black hover:bg-gray-800 text-white"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
                
                {/* Content area */}
                {!isLoading && !error && (
                  <div className="divide-y divide-gray-200">
                    {/* List info and actions */}
                    <div className="p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600">
                            {list.description || `A collection of favorite places and dishes`}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Created by {list.username || 'Unknown user'}
                          </p>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex space-x-2">
                          {/* Edit list - only for owner */}
                          {isOwner && (
                            <button
                              className="rounded-full p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                              aria-label="Edit list"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          )}
                          
                          {/* Follow/unfollow button - only for non-owners */}
                          {isAuthenticated && !isOwner && (
                            <button
                              disabled={isFollowProcessing}
                              onClick={handleToggleFollow}
                              className={`flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${followStatus ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}
                            >
                              {isFollowProcessing ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : null}
                              {followStatus ? 'Following' : 'Follow'}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Items count and sort options */}
                      <div className="flex justify-between items-center mt-6">
                        <div className="text-sm text-gray-600">
                          {sortedItems.length} {sortedItems.length === 1 ? 'item' : 'items'}
                        </div>
                        
                        {/* Sort dropdown */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setSortMenuOpen(!sortMenuOpen)}
                            className="flex items-center rounded-md bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 border border-gray-200"
                          >
                            <span>Sort</span>
                            {sortOrder !== 'default' && (
                              <span className="ml-1 text-xs text-gray-600 font-medium">
                                ({sortOrder === 'az' ? 'A-Z' : sortOrder === 'za' ? 'Z-A' : 'Distance'})
                              </span>
                            )}
                          </button>
                          
                          {sortMenuOpen && (
                            <div className="absolute right-0 mt-1 w-36 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                              <div className="py-1" role="menu" aria-orientation="vertical">
                                <button
                                  onClick={() => changeSortOrder('az')}
                                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <ArrowUpIcon className="mr-2 h-4 w-4" />
                                  A-Z
                                </button>
                                <button
                                  onClick={() => changeSortOrder('za')}
                                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <ArrowDownIcon className="mr-2 h-4 w-4" />
                                  Z-A
                                </button>
                                <button
                                  onClick={() => changeSortOrder('default')}
                                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  Default
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* List items */}
                    <div className="max-h-[60vh] overflow-y-auto">
                      {sortedItems.length === 0 && (
                        <div className="p-8 text-center">
                          <p className="text-gray-500">This list is empty</p>
                        </div>
                      )}
                      
                      <ul className="divide-y divide-gray-100">
                        {sortedItems.map((item) => (
                          <li key={item.id || `${item.restaurant_id}-${item.dish_id}`} className="p-4 hover:bg-gray-50">
                            <div className="flex justify-between items-center">
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {item.restaurant_name || item.dish_name}
                                </h4>
                                
                                {item.restaurant_name && item.dish_name && (
                                  <p className="text-sm text-gray-600">
                                    {item.dish_name}
                                  </p>
                                )}
                                
                                {item.note && (
                                  <p className="mt-1 text-xs text-gray-500 italic">
                                    {item.note}
                                  </p>
                                )}
                              </div>
                              
                              {/* Quick add button - only for authenticated users who don't own the list */}
                              {isAuthenticated && !isOwner && (
                                <button
                                  onClick={() => handleQuickAdd(item)}
                                  className="flex items-center rounded-full p-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                                  aria-label="Quick add"
                                >
                                  <PlusIcon className="h-5 w-5" />
                                </button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                
                {/* Offline indicator */}
                {isOffline && (
                  <div className="bg-yellow-50 px-4 py-2 text-sm text-yellow-800 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    You're offline. Some features may be limited.
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
