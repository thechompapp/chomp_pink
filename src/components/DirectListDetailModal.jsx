// src/components/DirectListDetailModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, ArrowLeftIcon, PencilIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { useQuery } from '@tanstack/react-query';
import { listService } from '@/services/listService';
import { Loader2, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext'; // Migrated from useAuthStore
import FollowButton from '@/components/FollowButton';
import { formatRelativeDate } from '@/utils/formatting';

export default function DirectListDetailModal({ listId, isOpen, onClose }) {
  // Track sort order
  const [sortOrder, setSortOrder] = useState('default');
  const { user, isAuthenticated  } = useAuth();
  
  // Fetch list data
  const { 
    data, 
    isLoading,
    error
  } = useQuery({
    queryKey: ['listDetail', listId],
    queryFn: () => listService.getListDetails(listId),
    enabled: isOpen && !!listId,
    staleTime: 5 * 60 * 1000
  });

  // Extract list and items
  const list = data?.list || {};
  const rawItems = data?.items || [];
  
  // Apply sorting
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
      case 'distance':
        return sortedItems;
      default:
        return sortedItems;
    }
  }, [rawItems, sortOrder]);
  
  // Determine if user can edit
  const canEdit = isAuthenticated && user && list.user_id === user.id;
  
  // Handle sort change
  const changeSortOrder = (order) => {
    setSortOrder(order);
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Close button */}
                <button 
                  onClick={onClose}
                  className="absolute top-2 right-2 p-1 rounded-full bg-gray-100 hover:bg-gray-200"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
                
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <p className="text-red-500">Error loading list details</p>
                    <p className="text-sm text-gray-500 mt-2">{error.message}</p>
                  </div>
                ) : (
                  <>
                    {/* Header with list info */}
                    <div className="mb-4 pb-4 border-b">
                      <div className="flex justify-between items-center mb-2">
                        <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900">
                          {list.name || 'Loading list...'}
                        </Dialog.Title>
                        
                        {/* Follow button */}
                        {isAuthenticated && !canEdit && (
                          <FollowButton listId={parseInt(listId, 10)} />
                        )}
                      </div>
                      
                      {/* List metadata */}
                      <div className="text-sm text-gray-500">
                        <p>Created by {list.creator_handle || 'Unknown'}</p>
                        <p>Updated {formatRelativeDate(new Date(list.updated_at)) || 'recently'}</p>
                      </div>
                    </div>
                    
                    {/* Sorting controls */}
                    <div className="flex justify-between mb-4">
                      <h4 className="text-lg font-medium">Items ({items.length})</h4>
                      
                      <div className="relative">
                        <button 
                          className="flex items-center gap-1 text-sm bg-gray-100 px-3 py-1 rounded-md"
                          onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                        >
                          <span>Sort</span>
                          <span className="text-gray-500">
                            {sortOrder === 'az' ? 'A-Z' : 
                             sortOrder === 'za' ? 'Z-A' : 
                             sortOrder === 'distance' ? 'Distance' : 'Default'}
                          </span>
                        </button>
                        
                        <div className="absolute right-0 mt-1 bg-white shadow-lg rounded-md overflow-hidden z-10 w-48">
                          <button 
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            onClick={() => changeSortOrder('default')}
                          >
                            Default
                          </button>
                          <button 
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            onClick={() => changeSortOrder('az')}
                          >
                            <div className="flex items-center gap-2">
                              <ArrowUpIcon className="h-4 w-4" />
                              <span>A to Z</span>
                            </div>
                          </button>
                          <button 
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            onClick={() => changeSortOrder('za')}
                          >
                            <div className="flex items-center gap-2">
                              <ArrowDownIcon className="h-4 w-4" />
                              <span>Z to A</span>
                            </div>
                          </button>
                          <button 
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            onClick={() => changeSortOrder('distance')}
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>Distance</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* List items */}
                    {items.length > 0 ? (
                      <ul className="space-y-2 max-h-80 overflow-y-auto">
                        {items.map((item) => (
                          <li
                            key={item.list_item_id || `item-${Date.now()}-${Math.random()}`}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex-1 min-w-0 mr-4">
                              <span 
                                className="text-base font-medium text-gray-900 truncate block"
                                title={item.restaurant_name || item.dish_name || 'Unknown Item'}
                              >
                                {item.restaurant_name || item.dish_name || 'Unknown Item'}
                              </span>
                              {item.restaurant_address && (
                                <p className="text-xs text-gray-500 truncate">{item.restaurant_address}</p>
                              )}
                              {item.note && (
                                <p className="text-sm text-gray-600 mt-1 italic">Note: {item.note}</p>
                              )}
                            </div>
                            
                            {/* Action buttons */}
                            {canEdit && (
                              <div className="flex items-center space-x-1 flex-shrink-0">
                                <button
                                  className="p-1 rounded-full text-gray-400 hover:text-yellow-600 hover:bg-gray-200 transition-colors"
                                  title="Edit note"
                                >
                                  <PencilIcon className="h-5 w-5" />
                                </button>
                                <button
                                  className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-gray-200 transition-colors"
                                  title="Remove from list"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">This list is empty.</p>
                        <p className="text-sm text-gray-400 mt-2">
                          {canEdit 
                            ? "Add restaurants and dishes to create your collection."
                            : "The owner hasn't added any restaurants or dishes yet."}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

DirectListDetailModal.propTypes = {
  listId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};
