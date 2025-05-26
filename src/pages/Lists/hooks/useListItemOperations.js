/**
 * useListItemOperations Hook
 * 
 * Custom hook for managing list item operations like delete, edit note, etc.
 * Extracted from ListDetail.jsx to improve separation of concerns.
 */
import { useState, useCallback } from 'react';
import { listService } from '@/services/listService.js';
import { logDebug, logError } from '@/utils/logger';
import useApiErrorHandler from '@/hooks/useApiErrorHandler';

/**
 * Custom hook for managing list item operations
 * @param {string} listId - ID of the list
 * @param {Function} refreshData - Function to refresh data after operations
 * @returns {Object} List item operations state and functions
 */
const useListItemOperations = (listId, refreshData) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleApiError = useApiErrorHandler();
  
  // Handle delete confirmation
  const handleDeleteItemClick = useCallback((item) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  }, []);
  
  // Cancel delete operation
  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  }, []);
  
  // Handle actual item deletion
  const handleDeleteItem = useCallback(async () => {
    if (!itemToDelete?.list_item_id) return;
    
    setIsProcessing(true);
    
    try {
      logDebug(`[useListItemOperations] Deleting item ${itemToDelete.list_item_id}`);
      
      const result = await listService.removeItemFromList(
        listId, 
        itemToDelete.list_item_id
      );
      
      if (!result || !result.success) {
        throw new Error(result?.message || 'Failed to delete item');
      }
      
      // Close dialog and refresh data
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      
      // Refresh data if provided
      if (refreshData && typeof refreshData === 'function') {
        refreshData();
      }
    } catch (error) {
      logError('[useListItemOperations] Error deleting item:', error);
      handleApiError(error, 'delete item');
    } finally {
      setIsProcessing(false);
    }
  }, [itemToDelete, listId, refreshData, handleApiError]);
  
  // Handle edit note
  const handleEditItemNote = useCallback((item) => {
    logDebug(`[useListItemOperations] Edit note for item: ${item.list_item_id}`);
    // Edit note implementation would go here
    // This would typically open a modal or form for editing the note
  }, []);
  
  return {
    showDeleteConfirm,
    itemToDelete,
    isProcessing,
    handleDeleteItemClick,
    handleDeleteItem,
    cancelDelete,
    handleEditItemNote
  };
};

export default useListItemOperations;
