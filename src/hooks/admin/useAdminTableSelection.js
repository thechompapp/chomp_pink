/**
 * Admin Table Selection Hook
 * 
 * Handles row selection and bulk operations state for admin tables.
 * Extracted from useEnhancedAdminTable for better separation of concerns.
 */

import { useState, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';

/**
 * Hook for managing admin table row selection
 */
export const useAdminTableSelection = ({ paginatedData }) => {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [bulkEditMode, setBulkEditMode] = useState(false);

  // Handle individual row selection
  const handleRowSelect = useCallback((rowId) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  }, []);

  // Handle select all/none toggle
  const handleSelectAll = useCallback((isSelected) => {
    if (isSelected) {
      // Data is already filtered for null items in paginatedData
      setSelectedRows(new Set(paginatedData.map(item => item.id)));
    } else {
      setSelectedRows(new Set());
    }
  }, [paginatedData]);

  // Clear all selections
  const resetSelection = useCallback(() => {
    setSelectedRows(new Set());
  }, []);

  // Handle bulk edit mode
  const handleBulkEdit = useCallback(() => {
    if (selectedRows.size === 0) {
      toast.error('No rows selected for bulk editing');
      return;
    }
    setBulkEditMode(true);
  }, [selectedRows]);

  const handleBulkSave = useCallback((refetch) => {
    setBulkEditMode(false);
    toast.success('Bulk changes saved');
    refetch();
  }, []);

  const handleBulkCancel = useCallback(() => {
    setBulkEditMode(false);
    setSelectedRows(new Set());
  }, []);

  // Computed selection states
  const selectionState = useMemo(() => {
    const hasSelection = selectedRows.size > 0;
    const isAllSelected = hasSelection && selectedRows.size === paginatedData.length;
    
    return {
      hasSelection,
      isAllSelected,
      selectedCount: selectedRows.size,
      totalCount: paginatedData.length
    };
  }, [selectedRows, paginatedData]);

  return {
    // Selection state
    selectedRows,
    setSelectedRows,
    ...selectionState,
    
    // Bulk edit state
    bulkEditMode,
    setBulkEditMode,
    
    // Selection handlers
    handleRowSelect,
    handleSelectAll,
    resetSelection,
    
    // Bulk edit handlers
    handleBulkEdit,
    handleBulkSave,
    handleBulkCancel
  };
};

export default useAdminTableSelection; 