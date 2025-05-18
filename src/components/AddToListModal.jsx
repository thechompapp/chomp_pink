// src/components/AddToListModal.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusIcon as PlusHeroIcon } from '@heroicons/react/24/outline'; 
import { ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react'; 
import { listService } from '@/services/listService';
import useAuthStore from '@/stores/useAuthStore';
import { logError, logDebug, logInfo } from '@/utils/logger.js';
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import Label from '@/components/UI/Label';

// Constants
const QUERY_KEYS = {
  USER_LISTS: 'userLists',
  LIST_DETAILS: 'listDetails',
  LIST_ITEMS: 'listItems',
  LIST_PREVIEW_ITEMS: 'listPreviewItems',
  SEARCH_RESULTS: 'searchResults',
  HOME_FEED: 'homeFeed',
  RESULTS: 'results'
};

const STEPS = {
  SELECT_LIST: 1,
  CONFIRMATION: 2
};

const LIST_TYPES = {
  RESTAURANTS: 'restaurants',
  DISHES: 'dishes',
  MIXED: 'mixed'
};

const AddToListModal = ({ isOpen, onClose, itemToAdd, onItemAdded }) => {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedListId, setSelectedListId] = useState(null);
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [itemNotes, setItemNotes] = useState('');
  const [step, setStep] = useState(STEPS.SELECT_LIST);
  const [error, setError] = useState(null);

  // Fetch user lists with React Query
  const { 
    data: userListsData, 
    isLoading: isLoadingUserLists,
    isError: isUserListsError,
    error: userListsError 
  } = useQuery({
    queryKey: [QUERY_KEYS.USER_LISTS, user?.id],
    queryFn: () => listService.getUserLists(user?.id), 
    enabled: isAuthenticated && !!user?.id && isOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data?.data || [],
    retry: 2,
    onError: (err) => {
      logError('[AddToListModal] Error fetching user lists:', err);
      setError('Failed to load your lists. Please try again.');
    }
  });

  // Derived state with memoization for performance
  const userLists = useMemo(() => userListsData || [], [userListsData]);

  const filteredLists = useMemo(() => {
    if (!searchTerm) return userLists;
    const searchTermLower = searchTerm.toLowerCase();
    return userLists.filter((list) =>
      list.name.toLowerCase().includes(searchTermLower)
    );
  }, [userLists, searchTerm]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset all state variables to initial values
      setSearchTerm('');
      setSelectedListId(null);
      setShowNewListForm(false);
      setNewListName('');
      setNewListDescription('');
      setItemNotes('');
      setStep(STEPS.SELECT_LIST);
      setError(null);
      logDebug("[AddToListModal] Modal opened and state reset.");
    }
  }, [isOpen]);

  // Create new list mutation
  const createListMutation = useMutation({
    mutationFn: (newListData) => listService.createList(newListData),
    onSuccess: (data) => {
      logInfo('[AddToListModal] New list created successfully');
      
      // Get the new list data from response
      const newList = data?.data;
      if (newList && newList.id) {
        // Update UI state
        setSelectedListId(newList.id);
        setShowNewListForm(false);
        setError(null);
        
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_LISTS, user?.id] });
        
        logDebug(`[AddToListModal] New list "${newList.name}" selected (ID: ${newList.id}).`);
        
        // If there's an item to add, add it to the new list
        if (itemToAdd) {
           handleAddItemToList(newList.id); 
        } else {
            setStep(STEPS.CONFIRMATION); 
        }
      }
    },
    onError: (error) => {
      logError('[AddToListModal] Error creating new list:', error);
      setError(error.response?.data?.message || error.message || 'Failed to create list. Please try again.');
    },
  });

  // Add item to list mutation
  const addItemToListMutation = useMutation({
    mutationFn: ({ listId, itemType, itemId, notes }) => {
      // Validate required data
      if (!itemToAdd) {
        const error = new Error("Item to add is not defined");
        logError("[AddToListModal] addItemToListMutation: itemToAdd is not defined");
        throw error;
      }
      
      if (!listId) {
        const error = new Error("List ID is required");
        logError("[AddToListModal] addItemToListMutation: listId is not defined");
        throw error;
      }
      
      logDebug(`[AddToListModal] Adding item to list. ListID: ${listId}, ItemType: ${itemType}, ItemID: ${itemId}`);
      return listService.addItemToList(listId, itemType, itemId, { notes });
    },
    onSuccess: (data, variables) => {
      logInfo('[AddToListModal] Item added to list successfully');
      
      // Store recent operation timestamp for potential use by other components
      localStorage.setItem('recent_list_operation', Date.now().toString());

      // Clear any previous errors
      setError(null);

      // Batch invalidate related queries for efficiency
      const queriesToInvalidate = [
        [QUERY_KEYS.LIST_DETAILS, variables.listId],
        [QUERY_KEYS.LIST_ITEMS, variables.listId],
        [QUERY_KEYS.LIST_PREVIEW_ITEMS, variables.listId],
        [QUERY_KEYS.USER_LISTS, user?.id],
        [QUERY_KEYS.SEARCH_RESULTS],
        [QUERY_KEYS.HOME_FEED],
        [QUERY_KEYS.RESULTS]
      ];
      
      // Invalidate all relevant queries
      queriesToInvalidate.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey, exact: false });
      });
      
      // Immediately refetch critical queries
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.LIST_DETAILS, variables.listId], exact: true });
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.USER_LISTS, user?.id], exact: true });

      // Dispatch event for other components that might be listening
      window.dispatchEvent(new CustomEvent('listItemAdded', { 
        detail: { listId: variables.listId, itemId: variables.itemId }
      }));
      
      // Move to confirmation step
      setStep(STEPS.CONFIRMATION); 
      
      // Call the callback if provided
      if (onItemAdded) {
        onItemAdded(variables.listId, data?.data?.list_item_id);
      }
    },
    onError: (error) => {
      logError('[AddToListModal] Error adding item to list:', error);
      setError(error.response?.data?.message || error.message || 'Failed to add item to list. Please try again.');
    },
  });

  /**
   * Handle creating a new list
   */
  const handleCreateList = useCallback(() => {
    // Validate list name
    const trimmedName = newListName.trim();
    if (!trimmedName) {
      setError('Please enter a name for your new list.');
      return;
    }
    
    // Determine list type based on item being added
    let listType = LIST_TYPES.MIXED;
    if (itemToAdd) {
      if (itemToAdd.type === 'restaurant') {
        listType = LIST_TYPES.RESTAURANTS;
      } else if (itemToAdd.type === 'dish') {
        listType = LIST_TYPES.DISHES;
      }
    }
    
    logDebug(`[AddToListModal] Attempting to create list: ${trimmedName}`);
    
    // Create the list
    createListMutation.mutate({
      name: trimmedName,
      description: newListDescription.trim(),
      is_public: true, 
      list_type: listType,
    });
  }, [newListName, newListDescription, itemToAdd, createListMutation]);
  
  /**
   * Handle adding an item to a list
   * @param {string|number} listIdToUse - Optional list ID to use instead of selected list
   */
  const handleAddItemToList = useCallback((listIdToUse) => {
    const listId = listIdToUse || selectedListId;
    
    // Validate required data
    if (!listId) {
      setError('Please select a list first.');
      return;
    }
    
    if (!itemToAdd) {
      setError('No item available to add to list.');
      logError("[AddToListModal] handleAddItemToList: itemToAdd missing.");
      return;
    }
    
    // Add the item to the list
    addItemToListMutation.mutate({
      listId,
      itemType: itemToAdd.type,
      itemId: itemToAdd.id,
      notes: itemNotes.trim(),
    });
  }, [selectedListId, itemToAdd, itemNotes, addItemToListMutation]);

  /**
   * Get the data for the currently selected list
   */
  const selectedListData = useMemo(() => {
    if (!selectedListId) return null;
    return userLists.find(list => list.id === selectedListId) || null;
  }, [selectedListId, userLists]);

  // Early return if modal is not open
  if (!isOpen) return null; 

  // Authentication check
  if (!isAuthenticated) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Authentication Required">
        <div className="p-4 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" aria-hidden="true" />
          <p className="text-gray-600 dark:text-gray-300">Please log in to add items to your lists or create new lists.</p>
          <Button onClick={onClose} variant="primary" className="mt-6">
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  // Step 1: List Selection/Creation
  const renderStepOne = useCallback(() => (
    <>
      {/* Error message display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md text-sm">
          <AlertCircle size={16} className="inline-block mr-2" aria-hidden="true" />
          {error}
        </div>
      )}
      
      {/* List search */}
      <div className="mb-4">
        <Label htmlFor="list-search">Search your lists or create new</Label>
        <Input
          id="list-search"
          type="text"
          placeholder="Type to search lists..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
          aria-label="Search your lists"
        />
      </div>

      {/* Loading state */}
      {isLoadingUserLists && (
        <div className="text-sm text-gray-500 py-4 text-center" role="status" aria-live="polite">
          <div className="animate-pulse flex justify-center items-center space-x-2">
            <div className="h-2 w-2 bg-primary-500 rounded-full"></div>
            <div className="h-2 w-2 bg-primary-500 rounded-full"></div>
            <div className="h-2 w-2 bg-primary-500 rounded-full"></div>
          </div>
          <p className="mt-2">Loading your lists...</p>
        </div>
      )}

      {/* Error state */}
      {isUserListsError && (
        <div className="text-sm text-red-500 py-4 text-center">
          <p>Failed to load your lists. Please try again.</p>
          <Button 
            onClick={() => queryClient.refetchQueries([QUERY_KEYS.USER_LISTS, user?.id])} 
            variant="outline" 
            size="sm" 
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* List selection */}
      {!isLoadingUserLists && !showNewListForm && (
        <div 
          className="max-h-60 overflow-y-auto mb-4 border rounded-md shadow-sm" 
          role="listbox"
          aria-label="Your lists"
        >
          {filteredLists.length > 0 ? (
            filteredLists.map((list) => (
              <div
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedListId(list.id)}
                role="option"
                aria-selected={selectedListId === list.id}
                tabIndex={0}
                className={`p-3 cursor-pointer hover:bg-primary-50 dark:hover:bg-gray-700 ${
                  selectedListId === list.id ? 'bg-primary-100 dark:bg-primary-700 border-l-4 border-primary-500 dark:border-primary-400' : 'border-b border-gray-200 dark:border-gray-600'
                } transition-all duration-150`}
              >
                <h4 className="font-medium text-sm text-gray-800 dark:text-gray-100">{list.name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {list.item_count ?? 0} items · {list.is_public ? 'Public' : 'Private'}
                </p>
              </div>
            ))
          ) : (
            <p className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
              {searchTerm ? 'No matching lists found.' : 'No lists found. Try creating one!'}
            </p>
          )}
        </div>
      )}

      {/* Create list button */}
      {!showNewListForm && (
        <Button 
          onClick={() => {
            setShowNewListForm(true);
            setError(null);
          }} 
          variant="outline" 
          className="w-full mb-4"
        >
          <PlusHeroIcon className="h-4 w-4 mr-2" aria-hidden="true" /> Create New List
        </Button>
      )}

      {/* New list form */}
      {showNewListForm && (
        <div className="mb-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-700 shadow">
          <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">Create New List</h3>
          <div className="mb-3">
            <Label htmlFor="new-list-name" className="dark:text-gray-300">List Name<span aria-hidden="true">*</span></Label>
            <Input
              id="new-list-name"
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="e.g., My Favorite Spots"
              className="w-full dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
              required
              aria-required="true"
              maxLength={50}
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="new-list-description" className="dark:text-gray-300">Description (Optional)</Label>
            <Input
              id="new-list-description"
              type="text"
              value={newListDescription}
              onChange={(e) => setNewListDescription(e.target.value)}
              placeholder="A short description of your list"
              className="w-full dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
              maxLength={200}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleCreateList} 
              isLoading={createListMutation.isPending} 
              className="flex-grow" 
              variant="primary"
              disabled={!newListName.trim()}
            >
              Create & Select List
            </Button>
            <Button 
              onClick={() => {
                setShowNewListForm(false);
                setError(null);
              }} 
              variant="ghost" 
              className="flex-shrink-0"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      {/* Item notes and add to list button */}
      {selectedListId && !showNewListForm && itemToAdd && (
        <div className="mt-4 pt-4 border-t dark:border-gray-600">
          <Label htmlFor="item-notes" className="dark:text-gray-300">Notes for {itemToAdd.name} (Optional)</Label>
          <Input
            id="item-notes"
            type="text"
            value={itemNotes}
            onChange={(e) => setItemNotes(e.target.value)}
            placeholder="e.g., Order the spicy ramen!"
            className="w-full mb-3 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
            maxLength={500}
          />
          <Button 
            onClick={() => handleAddItemToList()} 
            isLoading={addItemToListMutation.isPending} 
            className="w-full"
            variant="primary"
            disabled={!selectedListId || addItemToListMutation.isPending}
            aria-label={`Add ${itemToAdd.name} to ${selectedListData?.name}`}
          >
            Add "{itemToAdd.name?.substring(0,20)}{itemToAdd.name?.length > 20 ? '...' : ''}" to "{selectedListData?.name?.substring(0,15)}{selectedListData?.name?.length > 15 ? '...' : ''}"
          </Button>
        </div>
      )}
      
      {/* Selected list confirmation (when no item to add) */}
      {!itemToAdd && selectedListId && !showNewListForm && (
        <div className="text-sm text-green-600 dark:text-green-400 mt-2 p-3 bg-green-50 dark:bg-green-900/30 rounded-md flex items-center" role="status">
          <CheckCircle2 size={16} className="mr-2 flex-shrink-0" aria-hidden="true" />
          List "{selectedListData?.name}" selected.
        </div>
      )}
    </>
  ), [error, searchTerm, isLoadingUserLists, isUserListsError, showNewListForm, filteredLists, 
      selectedListId, newListName, newListDescription, itemToAdd, itemNotes, selectedListData, 
      user, queryClient, createListMutation.isPending, addItemToListMutation.isPending, 
      handleCreateList, handleAddItemToList]);

  // Step 2: Confirmation
  const renderStepTwo = useCallback(() => (
    <div className="text-center py-6">
      <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" aria-hidden="true" />
      <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">Success!</h3>
      
      {itemToAdd && selectedListData && (
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          "{itemToAdd.name}" has been added to your list "{selectedListData.name}".
        </p>
      )}
      
      {!itemToAdd && selectedListData && ( 
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          List "{selectedListData.name}" is ready.
        </p>
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
        <Button 
          onClick={onClose} 
          variant="primary" 
          className="w-full sm:w-auto"
        >
          Done
        </Button>
        
        {selectedListData && (
          <Button 
            onClick={() => {
              logDebug(`[AddToListModal] Viewing list: /lists/${selectedListData.id}`);
              onClose(); 
              // Navigation would happen here, handled by the parent component
            }} 
            variant="outline" 
            className="w-full sm:w-auto"
            aria-label={`View ${selectedListData.name} list`}
          >
            View List <ExternalLink className="h-4 w-4 ml-1.5 opacity-70" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  ), [itemToAdd, selectedListData, onClose]);

  // Determine modal title based on current step and context
  const modalTitle = useMemo(() => {
    if (step === STEPS.SELECT_LIST) {
      if (itemToAdd) {
        const itemName = itemToAdd.name || '';
        return `Add "${itemName.substring(0,30)}${itemName.length > 30 ? '...' : ''}" to a List`;
      }
      return "Select or Create List";
    }
    return "Action Complete";
  }, [step, itemToAdd]);

  // Render the modal with appropriate content based on step
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={modalTitle}
      size={step === STEPS.SELECT_LIST ? "lg" : "md"}
    >
      <div className="p-1 sm:p-2"> 
        {step === STEPS.SELECT_LIST && renderStepOne()}
        {step === STEPS.CONFIRMATION && renderStepTwo()}
      </div>
    </Modal>
  );
};

AddToListModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  itemToAdd: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }),
  onItemAdded: PropTypes.func,
};

export default AddToListModal;
