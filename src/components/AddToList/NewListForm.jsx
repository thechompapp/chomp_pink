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
    <div className="mb-6 p-6 border border-gray-200 dark:border-gray-600 rounded-lg bg-blue-50 dark:bg-blue-900/20 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Create New List</h3>
      
      {/* Error message display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-800">
          <div className="flex items-center">
            <AlertCircle size={16} className="mr-2 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      <div className="mb-4">
        <Label htmlFor="new-list-name" className="text-gray-700 dark:text-gray-300 font-medium">List Name<span className="text-red-500 ml-1">*</span></Label>
        <Input
          id="new-list-name"
          type="text"
          value={listName}
          onChange={(e) => setListName(e.target.value)}
          placeholder="e.g., My Favorite Spots"
          className="w-full mt-1 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 border-gray-300 rounded-lg"
          required
          aria-required="true"
          maxLength={50}
        />
      </div>
      <div className="mb-6">
        <Label htmlFor="new-list-description" className="text-gray-700 dark:text-gray-300 font-medium">Description (Optional)</Label>
        <Input
          id="new-list-description"
          type="text"
          value={listDescription}
          onChange={(e) => setListDescription(e.target.value)}
          placeholder="A short description of your list"
          className="w-full mt-1 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600 border-gray-300 rounded-lg"
          maxLength={200}
        />
      </div>
      <div className="flex gap-3">
        <Button 
          onClick={handleCreateList}
          type="submit" 
          disabled={createListMutation.isPending || !listName.trim()}
          className="flex-1 bg-white text-black border border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          variant="primary"
        >
          {createListMutation.isPending ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
              Creating...
            </div>
          ) : (
            'Create & Select List'
          )}
        </Button>
        <Button 
          onClick={onCancel} 
          variant="outline" 
          className="flex-shrink-0 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-6 py-3 rounded-lg transition-colors duration-200"
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
