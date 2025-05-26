// src/components/AddToList/ItemDetailsForm.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { listService } from '@/services/listService';
import { logDebug, logError, logInfo } from '@/utils/logger';
import Input from '@/components/UI/Input';
import Label from '@/components/UI/Label';
import Button from '@/components/UI/Button';

// Query key constants
const QUERY_KEYS = {
  LIST_DETAILS: 'listDetails',
  LIST_ITEMS: 'listItems',
  LIST_PREVIEW_ITEMS: 'listPreviewItems',
  USER_LISTS: 'userLists',
  SEARCH_RESULTS: 'searchResults',
  HOME_FEED: 'homeFeed',
  RESULTS: 'results'
};

/**
 * ItemDetailsForm Component
 * 
 * Handles item-specific details and adding items to lists
 */
const ItemDetailsForm = ({
  listId,
  listName,
  item,
  notes,
  onNotesChange,
  onItemAdded,
  userId,
  error,
  setError
}) => {
  const queryClient = useQueryClient();

  // Add item to list mutation
  const addItemToListMutation = useMutation({
    mutationFn: ({ listId, itemType, itemId, notes }) => {
      // Validate required data
      if (!item) {
        const error = new Error("Item to add is not defined");
        logError("[ItemDetailsForm] addItemToListMutation: item is not defined");
        throw error;
      }
      
      if (!listId) {
        const error = new Error("List ID is required");
        logError("[ItemDetailsForm] addItemToListMutation: listId is not defined");
        throw error;
      }
      
      logDebug(`[ItemDetailsForm] Adding item to list. ListID: ${listId}, ItemType: ${itemType}, ItemID: ${itemId}`);
      return listService.addItemToList(listId, {
        [itemType === 'dish' ? 'dish_id' : itemType === 'restaurant' ? 'restaurant_id' : 'custom_item_name']: itemId,
        notes: notes,
        type: itemType
      });
    },
    onSuccess: (data, variables) => {
      logInfo('[ItemDetailsForm] Item added to list successfully');
      
      // Store recent operation timestamp for potential use by other components
      localStorage.setItem('recent_list_operation', Date.now().toString());

      // Clear any previous errors
      if (setError) setError(null);

      // Batch invalidate related queries for efficiency
      const queriesToInvalidate = [
        [QUERY_KEYS.LIST_DETAILS, variables.listId],
        [QUERY_KEYS.LIST_ITEMS, variables.listId],
        [QUERY_KEYS.LIST_PREVIEW_ITEMS, variables.listId],
        [QUERY_KEYS.USER_LISTS, userId],
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
      queryClient.refetchQueries({ queryKey: [QUERY_KEYS.USER_LISTS, userId], exact: true });

      // Dispatch event for other components that might be listening
      window.dispatchEvent(new CustomEvent('listItemAdded', { 
        detail: { listId: variables.listId, itemId: variables.itemId }
      }));
      
      // Call the callback if provided
      if (onItemAdded) {
        onItemAdded(variables.listId, data?.data?.list_item_id);
      }
    },
    onError: (error) => {
      logError('[ItemDetailsForm] Error adding item to list:', error);
      if (setError) {
        setError(error.response?.data?.message || error.message || 'Failed to add item to list. Please try again.');
      }
    },
  });

  /**
   * Handle adding an item to a list
   */
  const handleAddItemToList = () => {
    // Validate required data
    if (!listId) {
      if (setError) setError('Please select a list first.');
      return;
    }
    
    if (!item) {
      if (setError) setError('No item available to add to list.');
      logError("[ItemDetailsForm] handleAddItemToList: item missing.");
      return;
    }
    
    // Add the item to the list
    addItemToListMutation.mutate({
      listId,
      itemType: item.type,
      itemId: item.id,
      notes: notes.trim(),
    });
  };

  // Check if item is already in the list
  const isItemInList = false; // This would be determined by the parent component

  return (
    <div className="mt-4 pt-4 border-t dark:border-gray-600">
      {/* Error message display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md text-sm">
          <AlertCircle size={16} className="inline-block mr-2" aria-hidden="true" />
          {error}
        </div>
      )}
      
      <Label htmlFor="item-notes" className="dark:text-gray-300">Notes for {item.name} (Optional)</Label>
      <Input
        id="item-notes"
        type="text"
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="e.g., Order the spicy ramen!"
        className="w-full mb-3 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
        maxLength={500}
      />
      <Button 
        onClick={handleAddItemToList} 
        isLoading={addItemToListMutation.isPending} 
        className="w-full"
        variant="primary"
        disabled={!listId || addItemToListMutation.isPending || isItemInList}
        aria-label={`Add ${item.name} to ${listName}`}
      >
        Add "{item.name?.substring(0,20)}{item.name?.length > 20 ? '...' : ''}" to "{listName?.substring(0,15)}{listName?.length > 15 ? '...' : ''}"
      </Button>
    </div>
  );
};

ItemDetailsForm.propTypes = {
  listId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  listName: PropTypes.string,
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }).isRequired,
  notes: PropTypes.string.isRequired,
  onNotesChange: PropTypes.func.isRequired,
  onItemAdded: PropTypes.func.isRequired,
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  error: PropTypes.string,
  setError: PropTypes.func
};

export default ItemDetailsForm;
