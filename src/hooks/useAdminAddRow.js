/* src/hooks/useAdminAddRow.js */
import { useState, useCallback } from 'react';
import { adminService } from '@/services/adminService.js';

/**
 * Helper function to safely parse integers.
 * @param {string|number} value - Value to parse.
 * @param {number|null} defaultValue - Default value if parsing fails.
 * @returns {number|null} Parsed integer or default value.
 */
const safeParseInt = (value, defaultValue = null) => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Helper function to parse and validate zipcodes.
 * @param {string|Array} value - Zipcode input.
 * @returns {Array} Array of valid zipcodes.
 */
const parseAndValidateZipcodes = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter(z => z && /^\d{5}(-\d{4})?$/.test(z.trim()));
  }
  if (typeof value === 'string') {
    return value.split(',').map(z => z.trim()).filter(z => z && /^\d{5}(-\d{4})?$/.test(z));
  }
  return [];
};

/**
 * Manages the state and logic for adding a new row in the Admin Table.
 *
 * @param {string} type - The resource type being added.
 * @param {Array} columns - The column definitions.
 * @param {Function} onDataMutated - Callback to trigger data refetch.
 * @param {Function} setError - Function to set general errors (from parent).
 * @returns {Object} Add row state and handlers.
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
        defaults[col.key] = col.inputType === 'boolean' ? false : '';
      }
    });
    setNewRowFormData(defaults);
  }, [columns]);

  // Start adding a new row
  const handleStartAdd = useCallback(() => {
    setError(null);
    initializeNewRowData();
    setIsAdding(true);
  }, [initializeNewRowData, setError]);

  // Cancel adding a new row
  const handleCancelAdd = useCallback(() => {
    setIsAdding(false);
    setNewRowFormData({});
    setError(null);
  }, [setError]);

  // Update data for the new row form
  const handleNewRowDataChange = useCallback((changes) => {
    setNewRowFormData(prev => ({ ...prev, ...changes }));
    setError(null);
  }, [setError]);

  // Save the new row
  const handleSaveNewRow = useCallback(async () => {
    const newRow = newRowFormData;
    if (!newRow || isSavingNew) return;
    setError(null);
    setIsSavingNew(true);
    try {
      const payload = { ...newRow };
      columns.forEach(col => {
        if (payload[col.key] !== undefined && payload[col.key] !== null) {
          if ((col.key === 'tags' || col.key === 'zipcode_ranges') && typeof payload[col.key] === 'string') {
            payload[col.key] = payload[col.key].split(',').map(s => s.trim()).filter(Boolean);
          } else if (col.inputType === 'boolean') {
            payload[col.key] = String(payload[col.key]) === 'true';
          } else if (['city_id', 'neighborhood_id', 'restaurant_id', 'chain_id'].includes(col.key)) {
            payload[col.key] = safeParseInt(payload[col.key]);
          } else if (['latitude', 'longitude'].includes(col.key)) {
            const floatVal = parseFloat(payload[col.key]);
            payload[col.key] = isNaN(floatVal) ? null : floatVal;
          }
          if (col.key === 'city_id') delete payload.city_name;
          if (col.key === 'neighborhood_id') delete payload.neighborhood_name;
          if (col.key === 'restaurant_id') delete payload.restaurant_name;
        } else if (payload[col.key] === null || payload[col.key] === undefined) {
          delete payload[col.key];
        }
      });

      console.log(`[useAdminAddRow SaveNewRow] Sending payload for type ${type}:`, payload);
      const result = await adminService.createResource(type, payload);

      if (result.success) {
        handleCancelAdd();
        onDataMutated?.();
      } else {
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
    handleNewRowDataChange,
    handleSaveNewRow,
  };
};