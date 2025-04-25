/* root/src/hooks/useAdminBulkEditing.js */
import { useState, useCallback } from 'react';

/**
 * Manages state and logic for bulk selection and editing in the Admin Table.
 *
 * @param {Set<number|string>} editingRowIds - The set of IDs currently in inline edit mode.
 * @param {Function} handleSaveEdit - The function to save an individual row.
 * @param {Function} handleStartEdit - Function to put a row into edit mode.
 * @param {Function} handleCancelEdit - Function to cancel editing for a row.
 * @param {Array} currentTableData - The current data displayed in the table.
 */
export const useAdminBulkEditing = (
    editingRowIds,
    handleSaveEdit,
    handleStartEdit,
    handleCancelEdit,
    currentTableData = [] // Add currentTableData as prop
) => {
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [isBulkEditing, setIsBulkEditing] = useState(false);
    const [bulkSaveError, setBulkSaveError] = useState(null);
    const [isSavingAll, setIsSavingAll] = useState(false); // Specific state for bulk save

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
    }, [currentTableData]); // Depend on currentTableData

    // Initiate bulk editing mode for selected rows
    const handleBulkEdit = useCallback(() => {
        // Prevent bulk edit if already editing inline or nothing selected
        if (editingRowIds.size > 0 || selectedRows.size === 0) return;

        // Put all selected rows into edit mode using handleStartEdit
        selectedRows.forEach(rowId => {
            const row = currentTableData.find(r => String(r.id) === String(rowId));
            if (row) {
                handleStartEdit(row); // Call startEdit from the row editing hook
            }
        });
        setIsBulkEditing(true);
        setBulkSaveError(null);
    }, [selectedRows, editingRowIds, currentTableData, handleStartEdit]);

    // Cancel bulk editing mode
    const handleCancelBulkEdit = useCallback(() => {
        // Cancel editing for all rows that were part of the bulk edit
        editingRowIds.forEach(rowId => {
             if (selectedRows.has(rowId)) { // Only cancel those that were part of this bulk op
                 handleCancelEdit(rowId); // Call cancelEdit from row editing hook
             }
        });
        setIsBulkEditing(false);
        setBulkSaveError(null);
        // Optionally clear selection on cancel? Or keep selection? Let's keep it for now.
        // setSelectedRows(new Set());
    }, [editingRowIds, selectedRows, handleCancelEdit]);

    // Save all rows currently in bulk edit mode
    const handleSaveAllEdits = useCallback(async () => {
        if (!isBulkEditing || isSavingAll) return;
        setBulkSaveError(null);
        setIsSavingAll(true);

        const savePromises = [];
        const rowsToSave = Array.from(editingRowIds).filter(id => selectedRows.has(id)); // Only save selected rows in edit mode

        rowsToSave.forEach(rowId => {
            // Need access to editFormData for the row being saved
            // This suggests editFormData should be managed centrally or passed here
            // Assuming for now handleSaveEdit can access the needed data (might require refactoring handleSaveEdit)
            savePromises.push(handleSaveEdit(rowId)); // Call saveEdit from row actions hook
        });

        try {
            const results = await Promise.all(savePromises);
            const failures = results.filter(success => !success).length;

            if (failures > 0) {
                 setBulkSaveError(`${failures} row(s) failed to save. Check individual rows for errors.`);
                 // Don't automatically cancel bulk edit if some rows failed
            } else {
                 // All saves were successful
                 handleCancelBulkEdit(); // Exit bulk edit mode
                 // Data mutation/refetch is handled by individual handleSaveEdit calls via onDataMutated
            }
        } catch (bulkErr) {
            // Catch errors not handled by individual saves (unlikely if they handle errors properly)
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
        isSavingAll, // Expose bulk saving state
        setSelectedRows, // Allow external control if needed
        handleRowSelect,
        handleSelectAll,
        handleBulkEdit,
        handleCancelBulkEdit,
        handleSaveAllEdits,
    };
};/* root/src/hooks/useAdminAddRow.js */
import { useState, useCallback } from 'react';
import { adminService } from '@/services/adminService.js';

// Helper function for safe parsing (could also be moved to a shared util)
const safeParseInt = (value, defaultValue = null) => { /* ... same as above ... */ };
const parseAndValidateZipcodes = (value) => { /* ... same as above ... */ };


/**
 * Manages the state and logic for adding a new row in the Admin Table.
 *
 * @param {string} type - The resource type being added.
 * @param {Array} columns - The column definitions.
 * @param {Function} onDataMutated - Callback to trigger data refetch.
 * @param {Function} setError - Function to set general errors (from parent).
 */
export const useAdminAddRow = (type, columns, onDataMutated, setError) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newRowFormData, setNewRowFormData] = useState({});
    const [isSavingNew, setIsSavingNew] = useState(false);

    // Initialize the form data for a new row
    const initializeNewRowData = useCallback(() => {
        const defaults = {};
        columns.forEach(col => {
            if (col.editable && col.key !== 'actions' && col.key !== 'select') {
                 defaults[col.key] = col.inputType === 'boolean' ? false : ''; // Default boolean to false string
            }
        });
        // Add any other type-specific defaults if needed
        setNewRowFormData(defaults);
    }, [columns]);

    // Start adding a new row
    const handleStartAdd = useCallback(() => {
        // Prevent starting add if already adding or editing other rows? (Decide based on UI flow)
        // if (isAdding || editingRowIds.size > 0) return;
        setError(null); // Clear general errors
        initializeNewRowData(); // Set default form data
        setIsAdding(true);
    }, [isAdding, initializeNewRowData, setError]);

    // Cancel adding a new row
    const handleCancelAdd = useCallback(() => {
        setIsAdding(false);
        setNewRowFormData({});
        setError(null); // Clear general errors
    }, [setError]);

    // Update data for the new row form
    const handleNewRowDataChange = useCallback((changes) => {
         setNewRowFormData(prev => ({ ...prev, ...changes }));
         setError(null); // Clear error on change
    }, [setError]);


    // Save the new row
    const handleSaveNewRow = useCallback(async () => {
      const newRow = newRowFormData;
      if (!newRow || isSavingNew) return;
      setError(null);
      setIsSavingNew(true);
      try {
          const payload = { ...newRow };
          // Convert specific fields before sending
          columns.forEach(col => {
              if (payload[col.key] !== undefined && payload[col.key] !== null) {
                  if ((col.key === 'tags' || col.key === 'zipcode_ranges') && typeof payload[col.key] === 'string') {
                     payload[col.key] = payload[col.key].split(',').map(s => s.trim()).filter(Boolean);
                  } else if (col.inputType === 'boolean') {
                      payload[col.key] = String(payload[col.key]) === 'true'; // Convert 'true'/'false' string to boolean
                  } else if (['city_id', 'neighborhood_id', 'restaurant_id', 'chain_id'].includes(col.key)) {
                       payload[col.key] = safeParseInt(payload[col.key]);
                  } else if (['latitude', 'longitude'].includes(col.key)) {
                       const floatVal = parseFloat(payload[col.key]);
                       payload[col.key] = isNaN(floatVal) ? null : floatVal;
                  }
                  // Remove display names if IDs are primary
                  if (col.key === 'city_id') delete payload.city_name;
                  if (col.key === 'neighborhood_id') delete payload.neighborhood_name;
                  if (col.key === 'restaurant_id') delete payload.restaurant_name;
              } else if (payload[col.key] === null || payload[col.key] === undefined) {
                   // Explicitly delete undefined/null keys unless the API expects nulls
                   // Or ensure payload is clean before sending
                   delete payload[col.key];
              }
          });

          console.log(`[useAdminAddRow SaveNewRow] Sending payload for type ${type}:`, payload);
          const result = await adminService.createResource(type, payload);

          if (result.success) {
              handleCancelAdd();
              onDataMutated?.();
          } else {
              // Set general error using the passed setter
              setError(result.error || `Failed to add new ${type.slice(0, -1)}.`);
          }
      } catch (err) {
          console.error(`[useAdminAddRow SaveNewRow] Error saving new ${type}:`, err);
          setError(err.message || 'Save failed.');
      } finally {
          setIsSavingNew(false);
      }
    }, [newRowFormData, isSavingNew, columns, type, onDataMutated, handleCancelAdd, setError]);


    return {
        isAdding,
        newRowFormData,
        isSavingNew,
        handleStartAdd,
        handleCancelAdd,
        handleNewRowDataChange, // Expose handler for AddRow component
        handleSaveNewRow,
    };
};