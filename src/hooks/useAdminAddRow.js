/* src/hooks/useAdminAddRow.js */
/* REFACTORED: Integrate useApiErrorHandler */
import { useState, useCallback } from 'react';
import { adminService } from '@/services/adminService.js';
import useApiErrorHandler from './useApiErrorHandler.js'; // Import the hook

// Helper function (remains the same)
const safeParseInt = (value, defaultValue = null) => { /* ... */ if (value === null || value === undefined || value === '') return defaultValue; const num = Number(value); if (isNaN(num) || !isFinite(num)) return defaultValue; return Math.floor(num); };

export const useAdminAddRow = (
    resourceType,
    columns,
    onDataMutated
    // Removed setError - handled by useApiErrorHandler
) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newRowFormData, setNewRowFormData] = useState({});
    const [isSavingNew, setIsSavingNew] = useState(false);

    // Instantiate the error handler hook
    const { errorMessage, handleError, clearError } = useApiErrorHandler();

    const handleStartAdd = useCallback(() => {
        // Prevent starting add if already adding or if there are active edits elsewhere (logic moved to useAdminTableState/parent)
        clearError(); // Clear previous errors
        const newRowDefaults = {};
        columns.forEach(col => {
            const key = col.key || col.accessor;
            if (col.editable !== false && key !== 'actions' && key !== 'select') { // Assume editable unless explicitly false
                newRowDefaults[key] = col.inputType === 'boolean' ? 'false' : '';
            }
        });
        setNewRowFormData(newRowDefaults);
        setIsAdding(true);
    }, [columns, clearError]); // Added clearError dependency

    const handleCancelAdd = useCallback(() => {
        setIsAdding(false);
        setNewRowFormData({});
        clearError(); // Clear errors on cancel
    }, [clearError]); // Added clearError dependency

    const handleNewRowDataChange = useCallback((changes) => {
        // Clear error when user starts typing/changing data
        if (errorMessage) clearError();
        setNewRowFormData(prev => ({ ...prev, ...changes }));
    }, [errorMessage, clearError]); // Added errorMessage, clearError dependencies

    const handleSaveNewRow = useCallback(async () => {
        if (isSavingNew || !resourceType) return;

        clearError(); // Clear previous errors
        setIsSavingNew(true);

        try {
            // Prepare payload (same logic as before)
            const payload = { ...newRowFormData };
            let validationFailed = false;
            columns.forEach(col => {
                const key = col.key || col.accessor;
                 if (col.required && (payload[key] === undefined || payload[key] === null || String(payload[key]).trim() === '')) {
                    handleError(`${col.header || key} is required.`); // Use error handler
                    validationFailed = true;
                    return; // Stop processing columns on first validation error
                 }

                if (payload[key] !== undefined) { // Process only fields present in the form data
                    if ((key === 'tags' || key === 'zipcode_ranges') && typeof payload[key] === 'string') { // Assuming tags/zipcodes are comma-separated strings in form
                        payload[key] = payload[key].split(',').map(s => s.trim()).filter(Boolean);
                    } else if (col.inputType === 'boolean') {
                        payload[key] = String(payload[key]) === 'true'; // Ensure boolean conversion
                    } else if (['city_id', 'neighborhood_id', 'restaurant_id', 'chain_id'].includes(key)) {
                         payload[key] = safeParseInt(payload[key]); // Allow null for optional FKs
                         // If required is true, null check already happened above
                    } else if (['latitude', 'longitude', 'price'].includes(key)) { // Added price example
                        payload[key] = (payload[key] === '' || payload[key] === null || payload[key] === undefined) ? null : parseFloat(payload[key]);
                         if (payload[key] !== null && isNaN(payload[key])) {
                              handleError(`Invalid ${col.header || key}. Must be a number.`);
                              validationFailed = true;
                              return;
                         }
                    }
                    // Remove display-only fields if they exist in formData
                    if (key === 'city_id') delete payload.city_name;
                    if (key === 'neighborhood_id') delete payload.neighborhood_name;
                    if (key === 'restaurant_id') delete payload.restaurant_name;
                }
            });

            if (validationFailed) {
                 setIsSavingNew(false);
                 return; // Stop if frontend validation failed
            }

            // adminService.createResource now propagates errors from apiClient
            await adminService.createResource(resourceType, payload);

            // If successful:
            handleCancelAdd(); // Close add row UI
            onDataMutated?.(); // Trigger refetch

        } catch (error) {
            console.error(`[useAdminAddRow SaveNewRow] Error saving new ${resourceType}:`, error);
            // Use the error handler hook
            handleError(error, `Failed to add new ${resourceType.slice(0, -1)}.`);
        } finally {
            setIsSavingNew(false);
        }
    }, [
        newRowFormData, isSavingNew, columns, resourceType, onDataMutated,
        handleCancelAdd, handleError, clearError // Added error handlers to dependency array
    ]);

    return {
        isAdding,
        newRowFormData,
        isSavingNew,
        errorMessage, // Expose error message from hook
        clearError, // Expose clearError handler
        handleStartAdd,
        handleCancelAdd,
        handleNewRowDataChange,
        handleSaveNewRow,
    };
};