// src/components/AddToList/NewListForm.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { listService } from '@/services/listService';
import { logDebug, logError, logInfo } from '@/utils/logger';
import Input from '@/components/UI/Input';
import Label from '@/components/UI/Label';
import Button from '@/components/UI/Button';

// Constants
const LIST_TYPES = {
  RESTAURANTS: 'restaurants',
  DISHES: 'dishes',
  MIXED: 'mixed'
};

const QUERY_KEYS = {
  USER_LISTS: 'userLists'
};

/**
 * NewListForm Component
 * 
 * Handles creating new lists for the AddToListModal
 */
const NewListForm = ({
  userId,
  onListCreated,
  onCancel,
  itemType = null,
  autoSelectAfterCreate = true
}) => {
  const queryClient = useQueryClient();
  const [listName, setListName] = useState('');
  const [listDescription, setListDescription] = useState('');
  const [error, setError] = useState(null);

  // Create new list mutation
  const createListMutation = useMutation({
    mutationFn: (newListData) => listService.createList(newListData),
    onSuccess: (data) => {
      logInfo('[NewListForm] New list created successfully');
      
      // Get the new list data from response
      const newList = data?.data;
      if (newList && newList.id) {
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_LISTS, userId] });
        
        logDebug(`[NewListForm] New list "${newList.name}" created (ID: ${newList.id}).`);
        
        // Call the callback with the new list
        if (onListCreated) {
          onListCreated(newList, autoSelectAfterCreate);
        }
      }
    },
    onError: (error) => {
      logError('[NewListForm] Error creating new list:', error);
      setError(error.response?.data?.message || error.message || 'Failed to create list. Please try again.');
    },
  });

  /**
   * Handle creating a new list
   */
  const handleCreateList = () => {
    // Validate list name
    const trimmedName = listName.trim();
    if (!trimmedName) {
      setError('Please enter a name for your new list.');
      return;
    }
    
    // Determine list type based on item being added
    let listType = LIST_TYPES.MIXED;
    if (itemType) {
      if (itemType === 'restaurant') {
        listType = LIST_TYPES.RESTAURANTS;
      } else if (itemType === 'dish') {
        listType = LIST_TYPES.DISHES;
      }
    }
    
    logDebug(`[NewListForm] Attempting to create list: ${trimmedName}`);
    
    // Create the list
    createListMutation.mutate({
      name: trimmedName,
      description: listDescription.trim(),
      is_public: true, 
      list_type: listType,
    });
  };

  return (
    <div className="mb-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-700 shadow">
      <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">Create New List</h3>
      
      {/* Error message display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md text-sm">
          <AlertCircle size={16} className="inline-block mr-2" aria-hidden="true" />
          {error}
        </div>
      )}
      
      <div className="mb-3">
        <Label htmlFor="new-list-name" className="dark:text-gray-300">List Name<span aria-hidden="true">*</span></Label>
        <Input
          id="new-list-name"
          type="text"
          value={listName}
          onChange={(e) => setListName(e.target.value)}
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
          value={listDescription}
          onChange={(e) => setListDescription(e.target.value)}
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
          disabled={!listName.trim()}
        >
          Create & Select List
        </Button>
        <Button 
          onClick={onCancel} 
          variant="ghost" 
          className="flex-shrink-0"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

NewListForm.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onListCreated: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  itemType: PropTypes.string,
  autoSelectAfterCreate: PropTypes.bool
};

NewListForm.defaultProps = {
  autoSelectAfterCreate: true
};

export default NewListForm;
