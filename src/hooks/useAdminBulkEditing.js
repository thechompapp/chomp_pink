/* src/hooks/useAdminBulkEditing.js */
import { useState, useCallback } from 'react';

/**
 * Manages state and logic for bulk selection and editing in the Admin Table.
 *
 * @param {Set<number|string>} editingRowIds - The set of IDs currently in inline edit mode.
 * @param {Function} handleSaveEdit - The function to save an individual row.
 * @param {Function} handleStartEdit - Function to put a row into edit mode.
 * @param {Function} handleCancelEdit - Function to cancel editing for a row.
 * @param {Array} currentTableData - The current data displayed in the table.
 * @returns {Object} Bulk editing state and handlers.
 */
export const useAdminBulkEditing = (
  editingRowIds,
  handleSaveEdit,
  handleStartEdit,
  handleCancelEdit,
  currentTableData = []
) => {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [bulkSaveError, setBulkSaveError] = useState(null);
  const [isSavingAll, setIsSavingAll] = useState(false);

  // Toggle selection for a single row
  const handleRowSelect = useCallback((rowId, isSelected) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(rowId);
      } else {
        newSet.delete(rowId);
      }
      return newSet;
    });
  }, []);

  // Toggle selection for all rows currently displayed
  const handleSelectAll = useCallback((isSelectingAll) => {
    if (isSelectingAll) {
      const allIds = new Set(currentTableData.map(row => row.id));
      setSelectedRows(allIds);
    } else {
      setSelectedRows(new Set());
    }
  }, [currentTableData]);

  // Initiate bulk editing mode for selected rows
  const handleBulkEdit = useCallback(() => {
    if (editingRowIds.size > 0 || selectedRows.size === 0) return;
    selectedRows.forEach(rowId => {
      const row = currentTableData.find(r => String(r.id) === String(rowId));
      if (row) {
        handleStartEdit(row);
      }
    });
    setIsBulkEditing(true);
    setBulkSaveError(null);
  }, [selectedRows, editingRowIds, currentTableData, handleStartEdit]);

  // Cancel bulk editing mode
  const handleCancelBulkEdit = useCallback(() => {
    editingRowIds.forEach(rowId => {
      if (selectedRows.has(rowId)) {
        handleCancelEdit(rowId);
      }
    });
    setIsBulkEditing(false);
    setBulkSaveError(null);
  }, [editingRowIds, selectedRows, handleCancelEdit]);

  // Save all rows currently in bulk edit mode
  const handleSaveAllEdits = useCallback(async () => {
    if (!isBulkEditing || isSavingAll) return;
    setBulkSaveError(null);
    setIsSavingAll(true);

    const savePromises = [];
    const rowsToSave = Array.from(editingRowIds).filter(id => selectedRows.has(id));

    rowsToSave.forEach(rowId => {
      savePromises.push(handleSaveEdit(rowId));
    });

    try {
      const results = await Promise.all(savePromises);
      const failures = results.filter(success => !success).length;

      if (failures > 0) {
        setBulkSaveError(`${failures} row(s) failed to save. Check individual rows for errors.`);
      } else {
        handleCancelBulkEdit();
      }
    } catch (bulkErr) {
      console.error("[useAdminBulkEditing SaveAllEdits] Error during bulk save:", bulkErr);
      setBulkSaveError("An unexpected error occurred during bulk save.");
    } finally {
      setIsSavingAll(false);
    }
  }, [isBulkEditing, isSavingAll, editingRowIds, selectedRows, handleSaveEdit, handleCancelBulkEdit]);

  return {
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
  };
};