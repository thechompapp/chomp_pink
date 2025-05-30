/* src/hooks/useAdminTableState.js */
/* UPDATED: Optimize performance with additional memoization and cleanup */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminService } from '@/services/adminService.js';
import { useAdminRowEditing } from './useAdminRowEditing.js';
import { useAdminRowActions } from './useAdminRowActions.js';
import { useAdminAddRow } from './useAdminAddRow.js';
import { useAdminBulkEditing } from './useAdminBulkEditing.js';
import useApiErrorHandler from '@/hooks/useApiErrorHandler.js';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/auth/AuthContext'; // Migrated from useAuthStore
import { useAdminStore } from '@/stores/useAdminStore';

export const useAdminTableState = ({
  initialData = [],
  type,
  columns = [],
  cities = [],
  neighborhoods = [],
  onDataMutated,
}) => {
  const { user  } = useAuth();
  const { setAdminData } = useAdminStore();
  const queryClient = useQueryClient();
  const handleApiError = useApiErrorHandler();

  // Debug the input data - only log when data changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[useAdminTableState] Received data for type ${type}:`, {
        dataLength: initialData?.length || 0,
        isArray: Array.isArray(initialData),
        sampleData: Array.isArray(initialData) && initialData.length > 0 
          ? initialData.slice(0, 2)
          : null
      });
    }
  }, [initialData, type]);

  const [currentSort, setCurrentSort] = useState(null);
  
  // Memoize the updated data to prevent unnecessary rerenders
  const updatedData = useMemo(() => initialData, [initialData]);

  // --- Integrate Specialized Hooks ---

  const {
    editingRowIds,
    editFormData,
    setEditFormData,
    handleRowDataChange,
    handleStartEdit: handleStartEditRow,
    handleCancelEdit: handleCancelEditRow,
    setEditingRowIds,
  } = useAdminRowEditing(updatedData, columns, type, cities);

  // Get error handler props from useAdminRowActions
  const {
    actionState,
    confirmDeleteInfo,
    setConfirmDeleteInfo,
    errorMessage: actionError,
    clearError: clearActionError, 
    handleSaveEdit: handleSaveEditRow,
    handleApprove,
    handleReject,
    handleDeleteClick,
    handleDeleteConfirm,
  } = useAdminRowActions(type, onDataMutated, handleCancelEditRow);

  // Get error handler props from useAdminAddRow
  const {
    isAdding,
    newRowFormData,
    isSavingNew,
    errorMessage: addRowError,
    clearError: clearAddRowError,
    handleStartAdd: handleStartAddRow,
    handleCancelAdd: handleCancelAddRow,
    handleNewRowDataChange,
    handleSaveNewRow,
  } = useAdminAddRow(type, columns, onDataMutated);

  // Bulk editing hook
  const {
    selectedRows,
    isBulkEditing,
    bulkSaveError,
    isSavingAll,
    setSelectedRows,
    handleRowSelect,
    handleSelectAll,
    handleBulkEdit,
    handleCancelBulkEdit,
    handleSaveAllEdits,
  } = useAdminBulkEditing(editingRowIds, handleSaveEditRow, handleStartEditRow, handleCancelEditRow, updatedData);

  // List Edit Modal State - memoized to reduce unnecessary state updates
  const [isListEditModalOpen, setIsListEditModalOpen] = useState(false);
  const [listToEditData, setListToEditData] = useState(null);
  const { 
    errorMessage: listEditError, 
    handleError: handleListEditError, 
    clearError: clearListEditError 
  } = useApiErrorHandler();
  const [isSavingList, setIsSavingList] = useState(false);

  // --- Effects ---
  
  // Reset state when data source changes
  useEffect(() => {
    setEditingRowIds(new Set());
    setEditFormData({});
    setSelectedRows(new Set());
    setCurrentSort(null);
  }, [type, setEditingRowIds, setEditFormData, setSelectedRows]);

  // Clear errors separately to avoid conditional hook issues
  useEffect(() => {
    const clearAllErrors = () => {
      clearActionError?.();
      clearAddRowError?.();
      clearListEditError?.();
      setIsListEditModalOpen(false);
      setListToEditData(null);
    };
    
    clearAllErrors();
    
    return clearAllErrors; // Clean up on unmount
  }, [type, clearActionError, clearAddRowError, clearListEditError]);

  // --- Combined Handlers / Logic ---

  // Memoize the sort handler to prevent recreations
  const handleSort = useCallback((resourceType, columnKey, direction) => {
    if (resourceType === type) {
      setCurrentSort({ column: columnKey, direction });
    }
  }, [type]);

  // Memoize the list edit modal handlers
  const handleOpenListEditModal = useCallback((row) => {
    if (type === 'lists') {
      clearListEditError();
      setListToEditData(row);
      setIsListEditModalOpen(true);
    } else {
      clearActionError?.();
      handleStartEditRow(row);
    }
  }, [type, handleStartEditRow, clearListEditError, clearActionError]);

  const handleCloseListEditModal = useCallback(() => {
    setIsListEditModalOpen(false);
    setListToEditData(null);
    clearListEditError();
  }, [clearListEditError]);

  const handleSaveListEdit = useCallback(async (listId, editedListData) => {
    if (isSavingList) return;
    
    clearListEditError();
    setIsSavingList(true);
    
    try {
      const payload = { ...editedListData };
      
      // Format data properly
      if (typeof payload.tags === 'string') {
        payload.tags = payload.tags.split(',').map(s => s.trim()).filter(Boolean);
      }
      
      payload.is_public = String(payload.is_public) === 'true';
      
      await adminService.updateResource('lists', listId, payload);
      handleCloseListEditModal();
      toast.success('List updated successfully');
      
      // Trigger data refetch
      if (typeof onDataMutated === 'function') {
        onDataMutated();
      }
    } catch (err) {
      console.error(`[useAdminTableState SaveListEdit] Error saving list ${listId}:`, err);
      handleListEditError(err, 'Failed to save list.');
      toast.error('Failed to save list');
    } finally {
      setIsSavingList(false);
    }
  }, [isSavingList, handleCloseListEditModal, onDataMutated, handleListEditError, clearListEditError]);

  // Combine relevant errors for UI display - memoized to prevent unnecessary recalculations
  const combinedError = useMemo(() => 
    actionError || addRowError || listEditError || bulkSaveError,
    [actionError, addRowError, listEditError, bulkSaveError]
  );

  // Memoize the error clearing function
  const clearCombinedError = useCallback(() => {
    clearActionError?.();
    clearAddRowError?.();
    clearListEditError?.();
  }, [clearActionError, clearAddRowError, clearListEditError]);

  // Memoize the return value to prevent unnecessary rerenders
  return useMemo(() => ({
    // Data & State
    updatedData,
    currentSort,
    editingRowIds,
    editFormData,
    error: combinedError,
    actionState,
    confirmDeleteInfo,
    isAdding,
    newRowFormData,
    isSavingNew,
    selectedRows,
    isBulkEditing,
    bulkSaveError,
    isSavingAll,
    isListEditModalOpen,
    listToEditData,
    isSavingList,

    // Handlers
    clearError: clearCombinedError,
    handleSort,
    handleRowDataChange,
    handleStartEdit: handleStartEditRow,
    handleOpenListEditModal,
    handleCancelEdit: handleCancelEditRow,
    handleSaveEdit: handleSaveEditRow,
    handleStartAdd: handleStartAddRow,
    handleCancelAdd: handleCancelAddRow,
    handleNewRowDataChange,
    handleSaveNewRow,
    handleDeleteClick,
    handleDeleteConfirm,
    setConfirmDeleteInfo,
    handleApprove,
    handleReject,
    handleRowSelect,
    handleSelectAll,
    handleBulkEdit,
    handleCancelBulkEdit,
    handleSaveAllEdits,
    handleCloseListEditModal,
    handleSaveListEdit,
  }), [
    updatedData,
    currentSort,
    editingRowIds,
    editFormData,
    combinedError,
    actionState,
    confirmDeleteInfo,
    isAdding,
    newRowFormData,
    isSavingNew,
    selectedRows,
    isBulkEditing,
    bulkSaveError,
    isSavingAll,
    isListEditModalOpen,
    listToEditData,
    isSavingList,
    clearCombinedError,
    handleSort,
    handleRowDataChange,
    handleStartEditRow,
    handleOpenListEditModal,
    handleCancelEditRow,
    handleSaveEditRow,
    handleStartAddRow,
    handleCancelAddRow,
    handleNewRowDataChange,
    handleSaveNewRow,
    handleDeleteClick,
    handleDeleteConfirm,
    setConfirmDeleteInfo,
    handleApprove,
    handleReject,
    handleRowSelect,
    handleSelectAll,
    handleBulkEdit,
    handleCancelBulkEdit,
    handleSaveAllEdits,
    handleCloseListEditModal,
    handleSaveListEdit,
  ]);
};