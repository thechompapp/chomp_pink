/* src/hooks/useAdminTableState.js */
/* UPDATED: Integrate errorMessage and clearError from sub-hooks */
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
import { useAuthStore } from '@/stores/useAuthStore';
import { useAdminStore } from '@/stores/useAdminStore';

export const useAdminTableState = ({
  initialData = [],
  type,
  columns = [],
  cities = [],
  neighborhoods = [],
  onDataMutated,
}) => {
  const { user } = useAuthStore();
  const { setAdminData } = useAdminStore();
  const queryClient = useQueryClient();
  const handleApiError = useApiErrorHandler();

  // Debug the input data
  useEffect(() => {
    console.log(`[useAdminTableState] Received data for type ${type}:`, {
      dataLength: initialData?.length || 0,
      isArray: Array.isArray(initialData),
      sampleData: Array.isArray(initialData) && initialData.length > 0 
        ? initialData.slice(0, 2)
        : null
    });
  }, [initialData, type]);

  const [currentSort, setCurrentSort] = useState(null);
  const [updatedData, setUpdatedData] = useState(initialData);
  // Removed main error state, rely on sub-hooks' error states

  // --- Integrate Specialized Hooks ---

  const {
    editingRowIds,
    editFormData,
    // Removed editError state - now handled by useAdminRowActions
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
    errorMessage: actionError, // Get error message from row actions
    clearError: clearActionError, // Get clear function from row actions
    handleSaveEdit: handleSaveEditRow,
    handleApprove,
    handleReject,
    handleDeleteClick,
    handleDeleteConfirm,
  } = useAdminRowActions(type, onDataMutated, handleCancelEditRow); // Removed setEditError dependency

  // Get error handler props from useAdminAddRow
  const {
    isAdding,
    newRowFormData,
    isSavingNew,
    errorMessage: addRowError, // Get error message from add row
    clearError: clearAddRowError, // Get clear function from add row
    handleStartAdd: handleStartAddRow,
    handleCancelAdd: handleCancelAddRow,
    handleNewRowDataChange,
    handleSaveNewRow,
  } = useAdminAddRow(type, columns, onDataMutated); // Removed setError dependency

  // Bulk editing hook doesn't directly handle API errors in this setup
  const {
    selectedRows,
    isBulkEditing,
    bulkSaveError, // Keep this separate for now, as it aggregates errors from multiple saves
    isSavingAll,
    setSelectedRows,
    handleRowSelect,
    handleSelectAll,
    handleBulkEdit,
    handleCancelBulkEdit,
    handleSaveAllEdits,
  } = useAdminBulkEditing(editingRowIds, handleSaveEditRow, handleStartEditRow, handleCancelEditRow, updatedData);

  // List Edit Modal State (Keep here for now)
  const [isListEditModalOpen, setIsListEditModalOpen] = useState(false);
  const [listToEditData, setListToEditData] = useState(null);
  // Use a dedicated error handler for the list modal actions
  const { errorMessage: listEditError, handleError: handleListEditError, clearError: clearListEditError } = useApiErrorHandler();
  const [isSavingList, setIsSavingList] = useState(false);

  // --- Effects ---
  useEffect(() => {
    console.log(`[useAdminTableState useEffect] Resetting state for type: ${type}.`);
    setUpdatedData(initialData);
    setEditingRowIds(new Set());
    setEditFormData({});
    // Removed direct state setters for sub-hook managed states
    // setIsAdding(false);
    // setIsBulkEditing(false);
    setSelectedRows(new Set());
    clearActionError?.(); // Clear errors from sub-hooks
    clearAddRowError?.();
    clearListEditError?.();
    setIsListEditModalOpen(false);
    setListToEditData(null);
    // Reset actionState if not handled internally by useAdminRowActions
    // setActionState({ deletingId: null, approvingId: null, rejectingId: null });
    setCurrentSort(null);
    // Removed direct state setter for bulkSaveError as it's managed by useAdminBulkEditing
    // setBulkSaveError(null);
  }, [initialData, type, clearActionError, clearAddRowError, clearListEditError]); // Add clear functions to deps

  // --- Combined Handlers / Logic ---

  const handleSort = useCallback((resourceType, columnKey, direction) => {
      // (Implementation remains the same)
      if (resourceType === type) { setCurrentSort({ column: columnKey, direction }); } else { console.warn(`[useAdminTableState] Sort ignored: type mismatch (${resourceType} vs ${type})`); }
  }, [type]);

  const handleOpenListEditModal = useCallback((row) => {
    if (type === 'lists') {
        clearListEditError(); // Clear previous list edit errors
        setListToEditData(row);
        setIsListEditModalOpen(true);
    } else {
        clearActionError?.(); // Clear action errors before starting row edit
        handleStartEditRow(row); // Delegate to row editing hook
    }
  }, [type, handleStartEditRow, clearListEditError, clearActionError]);

  const handleCloseListEditModal = useCallback(() => {
    setIsListEditModalOpen(false);
    setListToEditData(null);
    clearListEditError(); // Clear error on close
  }, [clearListEditError]);

  const handleSaveListEdit = useCallback(async (listId, editedListData) => {
    if (isSavingList) return;
    clearListEditError(); // Clear previous error
    setIsSavingList(true);
    try {
      const payload = { ...editedListData };
       if (typeof payload.tags === 'string') payload.tags = payload.tags.split(',').map(s => s.trim()).filter(Boolean);
       payload.is_public = String(payload.is_public) === 'true';
      // adminService.updateResource propagates errors
      await adminService.updateResource('lists', listId, payload);
      handleCloseListEditModal();
      toast.success('List updated successfully');
      onDataMutated?.();
    } catch (err) {
      console.error(`[useAdminTableState SaveListEdit] Error saving list ${listId}:`, err);
      handleListEditError(err, 'Failed to save list.'); // Use the list modal's error handler
      toast.error('Failed to save list');
    } finally {
      setIsSavingList(false);
    }
  }, [isSavingList, handleCloseListEditModal, onDataMutated, handleListEditError, clearListEditError]);


  // Combine relevant errors for UI display
  // Prioritize action/add errors, then list edit errors, then bulk save errors
  const combinedError = actionError || addRowError || listEditError || bulkSaveError;

  // Expose a single clearError function for the parent component to use
  const clearCombinedError = useCallback(() => {
      clearActionError?.();
      clearAddRowError?.();
      clearListEditError?.();
      // Clear bulkSaveError separately if needed
      // setBulkSaveError(null);
  }, [clearActionError, clearAddRowError, clearListEditError]);

  // --- Return hook state and handlers ---
  return {
    // Data & State
    updatedData,
    currentSort,
    editingRowIds,
    editFormData,
    error: combinedError, // Use the combined error message
    actionState, // From useAdminRowActions
    confirmDeleteInfo, // From useAdminRowActions
    isAdding, // From useAdminAddRow
    newRowFormData, // From useAdminAddRow
    isSavingNew, // From useAdminAddRow
    selectedRows, // From useAdminBulkEditing
    isBulkEditing, // From useAdminBulkEditing
    bulkSaveError, // Keep separate for specific UI feedback? Or combine above?
    isSavingAll, // From useAdminBulkEditing
    isListEditModalOpen, // Specific to list modal
    listToEditData, // Specific to list modal
    isSavingList, // Specific to list modal

    // Handlers
    clearError: clearCombinedError, // Provide a single clear function
    handleSort,
    handleRowDataChange, // From useAdminRowEditing
    handleStartEdit: handleStartEditRow, // Use direct row editing function for normal tables
    handleOpenListEditModal, // Keep the list modal logic available separately
    handleCancelEdit: handleCancelEditRow, // From useAdminRowEditing
    handleSaveEdit: handleSaveEditRow, // From useAdminRowActions
    handleStartAdd: handleStartAddRow, // From useAdminAddRow
    handleCancelAdd: handleCancelAddRow, // From useAdminAddRow
    handleNewRowDataChange, // From useAdminAddRow
    handleSaveNewRow, // From useAdminAddRow
    handleDeleteClick, // From useAdminRowActions
    handleDeleteConfirm, // From useAdminRowActions
    setConfirmDeleteInfo, // From useAdminRowActions
    handleApprove, // From useAdminRowActions
    handleReject, // From useAdminRowActions
    handleRowSelect, // From useAdminBulkEditing
    handleSelectAll, // From useAdminBulkEditing
    handleBulkEdit, // From useAdminBulkEditing
    handleCancelBulkEdit, // From useAdminBulkEditing
    handleSaveAllEdits, // From useAdminBulkEditing
    handleCloseListEditModal, // Specific to list modal
    handleSaveListEdit, // Specific to list modal
    // Removed setError, setEditError as they are handled internally now
  };
};