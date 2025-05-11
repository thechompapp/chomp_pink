// src/components/AddToListModal.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PropTypes from 'prop-types';

// Services
import { listService } from '@/services/listService';

// Hooks & Stores
import useAuthStore from '@/stores/useAuthStore';

// UI Components
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import { logError, logInfo, logDebug } from '@/utils/logger.js';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

// Fallback lists in case API fails
const FALLBACK_LISTS = [
  { id: '101', name: 'My Favorite Restaurants', item_count: 3 },
  { id: '102', name: 'Weekend Brunches', item_count: 2 },
  { id: '103', name: 'Special Occasions', item_count: 4 },
  { id: '104', name: 'Quick Lunch Spots', item_count: 1 },
  { id: '105', name: 'Takeout Favorites', item_count: 5 }
];

function AddToListModal({ isOpen, onClose, item }) {
  const [selectedListId, setSelectedListId] = useState('');
  const [localError, setLocalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Get the current user
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const userId = useAuthStore(state => state.user?.id);
  const queryClient = useQueryClient();
  
  // Fetch user lists from the API if authenticated
  const { data: userLists, isLoading, error } = useQuery({
    queryKey: ['userLists'],
    queryFn: () => listService.getUserLists({ createdByUser: true }),
    enabled: isAuthenticated && isOpen,
    select: (data) => {
      // Handle different response formats
      if (Array.isArray(data)) {
        return data;
      } else if (data?.data && Array.isArray(data.data)) {
        return data.data;
      } else if (data?.items && Array.isArray(data.items)) {
        return data.items;
      }
      return [];
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
    onError: (err) => {
      logError('[AddToListModal] Error fetching lists:', err);
    }
  });
  
  // Determine what lists to display - either real user lists or fallbacks
  const listsToDisplay = userLists?.length > 0 ? userLists : FALLBACK_LISTS;
  
  // Log when we have lists
  useEffect(() => {
    if (isOpen) {
      logDebug(`[AddToListModal] Using ${userLists?.length > 0 ? 'real' : 'fallback'} lists. Total: ${listsToDisplay.length}`);
    }
  }, [isOpen, userLists, listsToDisplay.length]);

  // Add item to list mutation
  const addItemMutation = useMutation({
    mutationFn: ({ listId, itemId, itemType }) => {
      logDebug('[AddToListModal] Adding item to list:', { listId, itemId, itemType });
      return listService.addItemToList(listId, { 
        item_id: itemId, 
        item_type: itemType 
      });
    },
    onSuccess: (data, variables) => {
      // Log success details
      logInfo('[AddToListModal] Successfully added item to list:', { 
        listId: variables.listId,
        response: data
      });
      
      // CRITICAL: Mark that we've recently done a list operation to prevent offline mode
      localStorage.setItem('recent_list_operation', Date.now().toString());
      
      // Invalidate ALL relevant queries to ensure counts and items are updated everywhere
      // Important: Use object shape with 'exact: false' to properly invalidate all variants of userLists queries
      queryClient.invalidateQueries({ queryKey: ['userLists'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['listDetails'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['listDetail', variables.listId] });
      queryClient.invalidateQueries({ queryKey: ['trendingListsPage'] });
      
      // Critical: Also invalidate the Home page results queries
      queryClient.invalidateQueries({ queryKey: ['results'], exact: false });
      
      // Force refetch list details and user lists to update immediately
      queryClient.refetchQueries({ queryKey: ['listDetails', variables.listId] });
      queryClient.refetchQueries({ queryKey: ['userLists'], exact: false });
      queryClient.refetchQueries({ queryKey: ['results'], exact: false });
      
      // Dispatch a custom event to notify other components about the list update
      window.dispatchEvent(new CustomEvent('listItemAdded', { 
        detail: { listId: variables.listId }
      }));
      
      // Show success message to user
      setSuccessMessage('Item added to list successfully!');
      
      // Close the modal after a short delay to show the success message
      setTimeout(() => {
        onClose();
      }, 1200);
    },
    onError: (error) => {
      setLocalError(error.message || 'Could not add item to the selected list.');
      logError('[AddToListModal] Error adding item to list:', error);
    },
  });

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedListId('');
      setLocalError('');
      setSuccessMessage('');
    }
  }, [isOpen]);

  // Handle form submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    // Validate item data
    if (!item || (!item.id && item.id !== 0) || !item.type) {
      setLocalError("Invalid item data provided.");
      return;
    }
    
    // Validate list selection
    if (!selectedListId) {
      setLocalError("Please select a list.");
      return;
    }

    // Submit the request
    addItemMutation.mutate({
      listId: selectedListId,
      itemId: item.id,
      itemType: item.type,
    });
  }, [selectedListId, item, addItemMutation]);

  if (!item) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add "${item.name}" to a list`}>
      <form onSubmit={handleSubmit}>
        {/* Debug information */}
        <div className="mb-3 p-2 bg-gray-100 text-xs border-l-2 border-blue-500">
          <div><strong>Lists:</strong> {userLists?.length > 0 ? 'Using your real lists' : 'Using fallback lists'}</div>
          <div>Total lists: {listsToDisplay.length}</div>
          {isAuthenticated ? <div>User ID: {userId} (authenticated)</div> : <div>Not authenticated</div>}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-4">
            <LoadingSpinner size="md" message="Loading your lists..." />
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <ErrorMessage message="Could not load your lists. Using fallback data." />
        )}

        {/* Lists grid */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Select a list:</h3>
          
          <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
            {listsToDisplay.map((list) => (
              <div 
                key={list.id}
                onClick={() => {
                  setSelectedListId(list.id);
                  setLocalError('');
                }}
                className={`
                  p-3 border rounded-lg cursor-pointer transition-all
                  ${selectedListId === list.id 
                    ? 'border-black bg-gray-100' 
                    : 'border-gray-200 hover:border-gray-400'}
                `}
              >
                <div className="font-medium text-black truncate">{list.name}</div>
                <div className="text-xs text-gray-600">{list.item_count || 0} items</div>
              </div>
            ))}
          </div>
          
          {selectedListId && (
            <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded">
              <div className="text-xs text-gray-500">Selected list:</div>
              <div className="font-medium text-black">
                {listsToDisplay.find(l => String(l.id) === String(selectedListId))?.name}
              </div>
            </div>
          )}
        </div>

        {/* Status Messages Area */}
        <div className="mt-4">
          {/* Error message */}
          {localError && (
            <div className="p-2 border border-red-200 rounded bg-red-50 text-red-700 flex items-center">
              <AlertCircle size={14} className="mr-2 flex-shrink-0" />
              <span className="text-sm">{localError}</span>
            </div>
          )}
          
          {/* Success message */}
          {successMessage && (
            <div className="p-2 border border-green-200 rounded bg-green-50 text-green-700 flex items-center">
              <CheckCircle2 size={14} className="mr-2 flex-shrink-0" />
              <span className="text-sm">{successMessage}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-5">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            disabled={addItemMutation.isPending}
            className="border border-black text-black hover:bg-gray-100 transition-colors"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={addItemMutation.isPending || !selectedListId}
            isLoading={addItemMutation.isPending}
            className="bg-black text-white hover:bg-gray-800 transition-colors"
          >
            Add to List
          </Button>
        </div>
      </form>
    </Modal>
  );
}

AddToListModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['restaurant', 'dish']).isRequired,
  }),
};

export default AddToListModal;
