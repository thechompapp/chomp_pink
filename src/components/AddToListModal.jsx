// src/components/AddToListModal.jsx
import React, { useState, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
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

  // Effect to fetch lists, triggers ONLY on 'isOpen', checks conditions inside.
  useEffect(() => {
    if (isOpen) {
      const currentLoading = useUserListStore.getState().isLoading;
      const currentError = useUserListStore.getState().error;
      const currentLists = useUserListStore.getState().userLists;

      const shouldFetch = !currentLists?.length && !currentLoading && !currentError;

      if (shouldFetch && userId) {
        console.log("[AddToListModal] Conditions met inside effect, fetching lists...");
        fetchUserLists({}, queryClient); // Pass queryClient
      } else {
        console.log(`[AddToListModal] Skipping fetch. ShouldFetch: ${shouldFetch}, UserID: ${userId}`);
      }
    } else {
      setSelectedListId('');
      setLocalError('');
    }
  }, [isOpen, fetchUserLists, userId, queryClient]);

  const addItemMutation = useMutation({
    mutationFn: ({ listId, itemId, itemType }) => listService.addItemToList(listId, { item_id: itemId, item_type: itemType }),
    onSuccess: (data, variables) => {
      console.log('Item added successfully to list:', variables.listId);
      queryClient.invalidateQueries({ queryKey: ['userLists'] });
      queryClient.invalidateQueries({ queryKey: ['listDetails', variables.listId] });
      onClose();
    },
    onError: (error) => {
      handleApiError(error, 'Failed to add item to list');
      setLocalError(error.message || 'Could not add item to the selected list.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');

    if (!item || typeof item.id !== 'number' || !item.type) {
      setLocalError("Invalid item data provided.");
      console.error("Invalid item prop:", item);
      return;
    }

    if (mode === 'select') {
      if (!selectedListId) {
        setLocalError("Please select a list.");
        return;
      }
      addItemMutation.mutate({
        listId: selectedListId,
        itemId: item.id,
        itemType: item.type,
      });
    }
  };

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

        {/* Mutation Error Display (local or mutation error) */}
        {(localError || addItemMutation.isError) && !isMutating && (
          <ErrorMessage
            message={localError || addItemMutation.error?.message || 'An unexpected error occurred.'}
            className="mb-4"
          />
        )}

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