/* root/src/hooks/useAdminAddRow.js */
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