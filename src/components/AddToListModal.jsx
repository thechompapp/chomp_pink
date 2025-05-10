// src/components/AddToListModal.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import PropTypes from 'prop-types';

// Hooks & Stores
import useUserListStore from '@/stores/useUserListStore';
import useApiErrorHandler from '@/hooks/useApiErrorHandler';
import useAuthStore from '@/stores/useAuthStore';

// Services
import { listService } from '@/services/listService';

// UI Components
import Modal from '@/components/UI/Modal';
import Button from '@/components/UI/Button';
import Select from '@/components/UI/Select';
import Input from '@/components/UI/Input';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorMessage from '@/components/UI/ErrorMessage';
import { logError, logInfo, logDebug } from '@/utils/logger.js';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

function AddToListModal({ isOpen, onClose, item }) {
  const queryClient = useQueryClient();
  const { handleApiError } = useApiErrorHandler();

  // Select state slices individually to ensure stable references for useSyncExternalStore
  const userLists = useUserListStore(state => state.userLists);
  const fetchUserLists = useUserListStore(state => state.fetchUserLists);
  const isLoadingLists = useUserListStore(state => state.isLoading);
  const listsError = useUserListStore(state => state.error);
  const userId = useAuthStore((state) => state.user?.id);

  const [selectedListId, setSelectedListId] = useState('');
  const mode = 'select';
  const [localError, setLocalError] = useState('');

  // Memoized fetch condition to prevent unnecessary recalculations
  const shouldFetchLists = useMemo(() => {
    const currentLists = userLists || [];
    return isOpen && userId && (!currentLists.length || currentLists.length === 0);
  }, [isOpen, userId, userLists]);
  
  // Effect to fetch lists when needed
  useEffect(() => {
    if (shouldFetchLists && !isLoadingLists) {
      logDebug('[AddToListModal] Fetching user lists');
      fetchUserLists({}, queryClient);
    }
  }, [shouldFetchLists, fetchUserLists, queryClient, isLoadingLists]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedListId('');
      setLocalError('');
    }
  }, [isOpen]);

  // Check if item is already in the selected list
  const { data: listDetails, isLoading: isCheckingList } = useQuery({
    queryKey: ['listDetails', selectedListId],
    queryFn: () => listService.getListDetails(selectedListId),
    enabled: !!selectedListId && isOpen, // Only run when we have a selectedListId and modal is open
    staleTime: 30 * 1000, // 30 seconds
    select: (response) => response?.data || { items: [] },
  });

  // Derived state to check for duplicates
  const isDuplicate = useMemo(() => {
    if (!listDetails?.items || !item) return false;
    return listDetails.items.some(listItem => 
      listItem.id === item.id && listItem.item_type === item.type
    );
  }, [listDetails, item]);

  // Mutation for adding item to list with improved feedback
  const addItemMutation = useMutation({
    mutationFn: ({ listId, itemId, itemType }) => 
      listService.addItemToList(listId, { item_id: itemId, item_type: itemType }),
    onSuccess: (data, variables) => {
      logInfo('Item added successfully to list:', variables.listId);
      
      // Invalidate queries related to the updated list
      queryClient.invalidateQueries({ queryKey: ['userLists'] });
      queryClient.invalidateQueries({ queryKey: ['listDetails', variables.listId] });
      
      // Show success message briefly before closing
      setSuccessMessage('Item added to list successfully!');
      setTimeout(() => {
        onClose();
      }, 1200);
    },
    onError: (error) => {
      handleApiError(error, 'Failed to add item to list');
      setLocalError(error.message || 'Could not add item to the selected list.');
      logError('[AddToListModal] Error adding item to list:', error);
    },
  });

  // Add state for success message
  const [successMessage, setSuccessMessage] = useState('');

  // Optimized submit handler with duplicate checking
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMessage('');

    // Validate item data
    if (!item || typeof item.id !== 'number' || !item.type) {
      setLocalError("Invalid item data provided.");
      logError("[AddToListModal] Invalid item prop:", item);
      return;
    }

    // Validate list selection
    if (!selectedListId) {
      setLocalError("Please select a list.");
      return;
    }
    
    // Check for duplicate items
    if (isDuplicate) {
      setLocalError("This item is already in the selected list.");
      return;
    }

    // All validations passed, proceed with adding item to list
    addItemMutation.mutate({
      listId: selectedListId,
      itemId: item.id,
      itemType: item.type,
    });
  }, [selectedListId, item, isDuplicate, addItemMutation]);

  const availableLists = userLists?.filter(list => list.list_type === 'custom' || list.owner_id === userId) || [];
  const isMutating = addItemMutation.isPending;

  if (!item) {
    console.warn("[AddToListModal] Rendered without a valid 'item' prop.");
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add "${item.name}" to a list`}>
      <form onSubmit={handleSubmit}>
        {/* Loading State */}
        {isLoadingLists && <LoadingSpinner message="Loading your lists..." />}

        {/* Error State from store */}
        {listsError && !isLoadingLists && (
          <ErrorMessage message={`Error loading lists: ${listsError}`} />
        )}

        {/* Content when lists are loaded (and no store error) */}
        {!isLoadingLists && !listsError && (
          <>
            {mode === 'select' && (
              <div className="mb-4">
                <label htmlFor="listSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select List
                </label>
                {availableLists.length > 0 ? (
                  <Select
                    id="listSelect"
                    value={selectedListId}
                    onChange={(e) => {
                      setSelectedListId(e.target.value);
                      setLocalError('');
                    }}
                    disabled={isMutating}
                    className="w-full"
                    required
                  >
                    <option value="" disabled>-- Select a list --</option>
                    {availableLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name} ({list.item_count || 0} items)
                      </option>
                    ))}
                  </Select>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You haven't created any lists yet.
                  </p>
                )}
              </div>
            )}
          </>
        )}

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
          
          {/* Duplicate warning */}
          {isDuplicate && !localError && (
            <div className="p-2 border border-amber-200 rounded bg-amber-50 text-amber-700 flex items-center">
              <AlertCircle size={14} className="mr-2 flex-shrink-0" />
              <span className="text-sm">This item is already in the selected list.</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-5">
          <Button type="button" variant="outline" onClick={onClose} disabled={isMutating}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isMutating || isLoadingLists || !!listsError || (mode === 'select' && !selectedListId && availableLists.length > 0)}
            isLoading={isMutating}
          >
            Add Item to List
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
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['restaurant', 'dish']).isRequired,
  }),
};

export default AddToListModal;