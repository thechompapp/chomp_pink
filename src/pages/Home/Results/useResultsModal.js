/**
 * Results Modal Hook
 * 
 * Handles modal state management for AddToList functionality.
 * Extracted from Results.jsx for better separation of concerns.
 */

import { useState, useCallback } from 'react';

/**
 * Hook for managing modal state in results
 */
export const useResultsModal = () => {
  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
  const [itemToAdd, setItemToAdd] = useState(null);

  // AddToList handlers
  const handleAddToList = useCallback((item) => {
    console.log('[useResultsModal] Opening AddToList modal for:', item);
    setItemToAdd({
      id: item.id,
      name: item.name,
      type: item.type
    });
    setIsAddToListModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsAddToListModalOpen(false);
    setItemToAdd(null);
  }, []);

  const handleItemAdded = useCallback((listId, listItemId) => {
    console.log(`[useResultsModal] Item added to list ${listId} with ID ${listItemId}`);
    setIsAddToListModalOpen(false);
    setItemToAdd(null);
    // Optional: Show success notification
  }, []);

  return {
    // State
    isAddToListModalOpen,
    itemToAdd,
    
    // Actions
    handleAddToList,
    handleCloseModal,
    handleItemAdded
  };
};

export default useResultsModal; 