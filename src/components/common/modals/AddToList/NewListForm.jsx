/**
 * New List Form Component
 * 
 * A form for creating a new list when adding items.
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { listService } from '@/services/list';
import { logDebug, logError } from '@/utils/logger';
import Input from '@/components/common/forms/Input';
import Button from '@/components/common/buttons/Button';
import Label from '@/components/common/forms/Label';
import Switch from '@/components/common/forms/Switch';

// Query keys for React Query
const QUERY_KEYS = {
  USER_LISTS: 'userLists'
};

/**
 * New List Form Component
 * @param {Object} props - Component props
 * @param {Function} props.onCancel - Function called when form is cancelled
 * @param {Function} props.onListCreated - Function called when a new list is created
 * @param {string} props.itemType - Type of item being added ('restaurant', 'dish', or 'custom')
 * @returns {React.ReactNode}
 */
const NewListForm = ({
  onCancel,
  onListCreated,
  itemType
}) => {
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [listType, setListType] = useState(() => {
    // Set default list type based on item type
    if (itemType === 'restaurant') return 'restaurants';
    if (itemType === 'dish') return 'dishes';
    return 'mixed';
  });
  
  // Form validation state
  const [nameError, setNameError] = useState('');
  
  // React Query client
  const queryClient = useQueryClient();
  
  // Create list mutation
  const createListMutation = useMutation(
    (newList) => listService.createList(newList),
    {
      onSuccess: (data) => {
        logDebug('[NewListForm] List created successfully:', data);
        
        // Invalidate user lists query to refresh the list
        queryClient.invalidateQueries([QUERY_KEYS.USER_LISTS]);
        
        // Call the onListCreated callback with the new list
        if (data.success && data.data) {
          onListCreated(data.data);
        }
      },
      onError: (error) => {
        logError('[NewListForm] Error creating list:', error);
        setNameError('Failed to create list. Please try again.');
      }
    }
  );
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!name.trim()) {
      setNameError('List name is required');
      return;
    }
    
    // Reset errors
    setNameError('');
    
    // Create new list
    createListMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      isPublic,
      listType
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="list-name" required>List Name</Label>
        <Input
          id="list-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Favorite Restaurants"
          className="w-full"
          error={nameError}
        />
        {nameError && (
          <div className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {nameError}
          </div>
        )}
      </div>
      
      <div>
        <Label htmlFor="list-description">Description (Optional)</Label>
        <Input
          id="list-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A collection of my favorite places to eat"
          className="w-full"
        />
      </div>
      
      <div>
        <Label htmlFor="list-type">List Type</Label>
        <div className="flex space-x-4 mt-1">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="list-type"
              value="restaurants"
              checked={listType === 'restaurants'}
              onChange={() => setListType('restaurants')}
              className="form-radio"
            />
            <span>Restaurants</span>
          </label>
          
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="list-type"
              value="dishes"
              checked={listType === 'dishes'}
              onChange={() => setListType('dishes')}
              className="form-radio"
            />
            <span>Dishes</span>
          </label>
          
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="list-type"
              value="mixed"
              checked={listType === 'mixed'}
              onChange={() => setListType('mixed')}
              className="form-radio"
            />
            <span>Mixed</span>
          </label>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="list-visibility" className="mb-0">Make list public</Label>
        <Switch
          id="list-visibility"
          checked={isPublic}
          onChange={() => setIsPublic(!isPublic)}
        />
      </div>
      
      {/* Status message */}
      {createListMutation.isSuccess && (
        <div className="flex items-center p-3 text-green-700 bg-green-100 rounded-md">
          <CheckCircle2 className="w-5 h-5 mr-2" />
          <span>List created successfully!</span>
        </div>
      )}
      
      {createListMutation.isError && !nameError && (
        <div className="flex items-center p-3 text-red-700 bg-red-100 rounded-md">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Failed to create list. Please try again.</span>
        </div>
      )}
      
      {/* Form buttons */}
      <div className="flex justify-end space-x-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={createListMutation.isLoading}
        >
          Cancel
        </Button>
        
        <Button
          type="submit"
          disabled={createListMutation.isLoading}
          loading={createListMutation.isLoading}
        >
          Create List
        </Button>
      </div>
    </form>
  );
};

NewListForm.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onListCreated: PropTypes.func.isRequired,
  itemType: PropTypes.oneOf(['restaurant', 'dish', 'custom']).isRequired
};

export default NewListForm;
