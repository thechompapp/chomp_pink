/* root/src/hooks/useAdminRowEditing.js */
import { useState, useCallback, useEffect } from 'react';
import apiClient from '@/services/apiClient.js'; // For zipcode lookup

/**
 * Manages the state and logic for inline editing within the Admin Table.
 *
 * @param {Array} initialData - The initial data array for the table.
 * @param {Array} columns - The column definitions.
 * @param {string} type - The resource type being edited (e.g., 'restaurants').
 * @param {Array} cities - Array of cities for lookup (previously from context)
 */
export const useAdminRowEditing = (initialData, columns, type, cities = []) => {
    const [editingRowIds, setEditingRowIds] = useState(new Set());
    const [editFormData, setEditFormData] = useState({}); // { rowId: { colKey: value, ... } }
    const [editError, setEditError] = useState(null); // Error specific to validation within the row
    // Cities now passed as parameter instead of from context

    // Effect to reset editing state when initial data changes
    useEffect(() => {
        setEditingRowIds(new Set());
        setEditFormData({});
        setEditError(null);
    }, [initialData]);

    // Callback to update the form data for a specific row being edited
    const handleRowDataChange = useCallback(async (rowId, incomingChanges) => {
        console.log(`[useAdminRowEditing] Row data change for row ${rowId}:`, incomingChanges);
        setEditError(null); // Clear previous row error on new change

        // Update form state optimistically first
        let processedChanges = { ...incomingChanges };

        // Perform zipcode lookup if applicable (only for restaurants)
        if (type === 'restaurants' && incomingChanges.hasOwnProperty('zipcode')) {
            const zipcodeToLookup = String(incomingChanges.zipcode || '').trim();
            let geoUpdates = { lookupFailed: false };

            if (zipcodeToLookup && /^\d{5}$/.test(zipcodeToLookup)) {
                try {
                    const response = await apiClient(`/api/neighborhoods/by-zipcode/${zipcodeToLookup}`, `ZipcodeLookup ${zipcodeToLookup}`);
                    if (response.success && response.data?.id != null && response.data?.city_id != null) {
                        const foundNeighborhood = response.data;
                        const foundCity = cities?.find(c => String(c.id) === String(foundNeighborhood.city_id));
                        geoUpdates = {
                            neighborhood_id: String(foundNeighborhood.id),
                            neighborhood_name: foundNeighborhood.name || '',
                            city_id: String(foundNeighborhood.city_id),
                            city_name: foundCity?.name || foundNeighborhood.city_name || '',
                            lookupFailed: false
                        };
                    } else {
                        geoUpdates = { neighborhood_id: null, neighborhood_name: null, city_id: null, city_name: null, lookupFailed: true };
                    }
                } catch (apiError) {
                    console.error(`[useAdminRowEditing] API Error during zipcode lookup:`, apiError);
                    geoUpdates = { neighborhood_id: null, neighborhood_name: null, city_id: null, city_name: null, lookupFailed: true };
                }
                // Merge geo updates into the changes being applied
                processedChanges = { ...processedChanges, ...geoUpdates };
            } else if (zipcodeToLookup === '') {
                // Clear geo fields if zipcode was cleared
                processedChanges = { ...processedChanges, neighborhood_id: null, neighborhood_name: null, city_id: null, city_name: null, lookupFailed: false };
            }
             // Remove zipcode itself if it wasn't a valid 5-digit number or was cleared, keep valid ones
             if (!/^\d{5}$/.test(zipcodeToLookup)) {
                  processedChanges.zipcode = ''; // Clear invalid zipcode input
             }
        }
        
        // Retrieve existing form data for this row
        const existingRowData = editFormData[rowId] || {};
        
        // Update the central form data state
        setEditFormData((prev) => {
            const newFormData = {
                ...prev,
                [rowId]: { ...existingRowData, ...processedChanges }
            };
            console.log(`[useAdminRowEditing] Updated form data for row ${rowId}:`, newFormData[rowId]);
            return newFormData;
        });

    }, [type, cities, editFormData]); // Added editFormData as dependency

    // Callback to start editing a row
    const handleStartEdit = useCallback((row) => {
        if (!row || row.id == null) return;

        // Skip inline editing for lists (handled by modal elsewhere)
        if (type === 'lists') return;

        console.log(`[useAdminRowEditing] Starting edit for row ${row.id}, type: ${type}`);
        console.log('[useAdminRowEditing] Columns:', columns);

        const initialRowData = {};
        columns.forEach((col) => {
            const key = col.key || col.accessor;
            // Make sure to use isEditable instead of editable to match column definitions
            if (col.isEditable && key && key !== 'select' && key !== 'actions') {
                 console.log(`[useAdminRowEditing] Initializing form data for column ${key}`);
                 let initialValue = row[key];
                 if ((key === 'tags' || key === 'zipcode_ranges') && Array.isArray(initialValue)) {
                      initialValue = initialValue.join(', ');
                 }
                 if (col.inputType === 'boolean' || col.cellType === 'boolean') {
                     initialValue = String(initialValue ?? false);
                 }
                 // Capture corresponding names
                 if (key === 'city_id') initialRowData.city_name = row.city_name;
                 if (key === 'neighborhood_id') initialRowData.neighborhood_name = row.neighborhood_name;
                 if (key === 'restaurant_id') initialRowData.restaurant_name = row.restaurant_name;

                 initialRowData[key] = initialValue ?? '';
            }
        });

        console.log(`[useAdminRowEditing] Initial form data:`, initialRowData);
        
        setEditingRowIds((prev) => new Set(prev).add(row.id));
        setEditFormData((prev) => ({ ...prev, [row.id]: initialRowData }));
        setEditError(null);
    }, [type, columns]);

    // Callback to cancel editing a row
    const handleCancelEdit = useCallback((rowId) => {
        setEditingRowIds((prev) => { const newSet = new Set(prev); newSet.delete(rowId); return newSet; });
        setEditFormData((prev) => { const newState = { ...prev }; delete newState[rowId]; return newState; });
        setEditError(null);
    }, []);

    return {
        editingRowIds,
        editFormData,
        editError,
        setEditError, // Allow parent/other hooks to set row-specific errors
        setEditFormData, // Allow parent/other hooks to modify data (e.g., after save)
        handleRowDataChange,
        handleStartEdit,
        handleCancelEdit,
        setEditingRowIds, // Needed for bulk cancel
    };
};