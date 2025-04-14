import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminService } from '@/services/adminService';
import apiClient from '@/services/apiClient';

// Helper function
const parseAndValidateZipcodes = (value) => {
    if (value === null || value === undefined) return [];
    const zipcodes = Array.isArray(value)
        ? value.map(String)
        : String(value).split(',').map(z => z.trim()).filter(Boolean);
    const validZipRegex = /^\d{5}$/;
    return zipcodes.filter(z => validZipRegex.test(z));
};

export const useAdminTableState = ({
  initialData = [],
  type,
  columns = [],
  cities = [],
  neighborhoods = [],
  onDataMutated,
}) => {
  // --- State ---
  const [editingRowIds, setEditingRowIds] = useState(new Set());
  const [editFormData, setEditFormData] = useState({});
  const [editError, setEditError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionState, setActionState] = useState({ deletingId: null, approvingId: null, rejectingId: null });
  const [error, setError] = useState(null);
  const [confirmDeleteInfo, setConfirmDeleteInfo] = useState({ isOpen: false, id: null, itemType: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [bulkSaveError, setBulkSaveError] = useState(null);
  const [updatedData, setUpdatedData] = useState(initialData);
  const [isListEditModalOpen, setIsListEditModalOpen] = useState(false);
  const [listToEditData, setListToEditData] = useState(null);
  const [listEditError, setListEditError] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();


  // Effect to sync local data
  useEffect(() => {
    setUpdatedData(initialData);
    setEditingRowIds(new Set()); setEditFormData({}); setIsAdding(false); setIsBulkEditing(false);
    setSelectedRows(new Set()); setEditError(null); setError(null); setListEditError(null);
    setIsListEditModalOpen(false); setListToEditData(null);
  }, [initialData]);

  // --- Core Data Update Handler ---
  const handleRowDataChange = useCallback(async (rowId, incomingChanges) => {
    setEditError(null); setError(null); setBulkSaveError(null); setListEditError(null);
    const isZipcodeChange = incomingChanges?.zipcode && typeof incomingChanges.zipcode === 'string' && type === 'restaurants';
    const isZipcodeClear = incomingChanges?.zipcode === '' && type === 'restaurants';
    const zipcodeToLookup = isZipcodeChange ? incomingChanges.zipcode.trim() : null;
    const baseUpdates = { ...incomingChanges };
    delete baseUpdates.zipcode;
    let geoUpdates = {};

    // Update state immediately with non-geo changes
    setEditFormData((prev) => ({...prev, [rowId]: {...(prev[rowId] || {}), ...baseUpdates } }));

    if (zipcodeToLookup) {
      console.log(`[handleRowDataChange] Zipcode "${zipcodeToLookup}" received. Calling backend lookup...`);
      try {
        const response = await apiClient(`/api/neighborhoods/by-zipcode/${zipcodeToLookup}`, `ZipcodeLookup ${zipcodeToLookup}`);
        if (response.success && response.data?.id != null && response.data?.city_id != null) {
          const foundNeighborhood = response.data;
          console.log(`[handleRowDataChange] Backend Lookup SUCCESS: Found neighborhood:`, foundNeighborhood);
          const foundCity = cities.find(c => String(c.id) === String(foundNeighborhood.city_id));
          geoUpdates = { neighborhood_id: String(foundNeighborhood.id), neighborhood_name: foundNeighborhood.name || '', city_id: String(foundNeighborhood.city_id), city_name: foundCity?.name || foundNeighborhood.city_name || '', lookupFailed: false };
        } else {
          console.warn(`[handleRowDataChange] Backend Zipcode Lookup FAILED or no match for "${zipcodeToLookup}".`);
          geoUpdates = { neighborhood_id: null, neighborhood_name: null, city_id: null, city_name: null, lookupFailed: true };
        }
      } catch (apiError) {
        console.error(`[handleRowDataChange] API Error during zipcode lookup:`, apiError);
        geoUpdates = { neighborhood_id: null, neighborhood_name: null, city_id: null, city_name: null, lookupFailed: true };
      }
    } else if (isZipcodeClear) {
      console.log(`[handleRowDataChange] Zipcode cleared. Clearing geo fields.`);
      geoUpdates = { neighborhood_id: null, neighborhood_name: null, city_id: null, city_name: null, lookupFailed: false };
    } else {
        // If no zipcode change, set geoUpdates based on existing data to ensure merge works
         geoUpdates = {
             lookupFailed: editFormData[rowId]?.lookupFailed ?? false
         };
    }

    // Apply combined state update (base + geo results)
    setEditFormData((prev) => {
      const existingRowData = prev[rowId] || {};
      // Make sure baseUpdates don't accidentally overwrite existing correct geo fields if zip wasn't changed
      const combinedUpdates = {
          ...existingRowData,
          ...baseUpdates,
          ...geoUpdates // Apply geo results (resolved or cleared)
      };
      console.log(`[handleRowDataChange] Applying final state update for row ${rowId}:`, combinedUpdates);
      return { ...prev, [rowId]: combinedUpdates };
    });
  }, [type, cities, editFormData]); // Added editFormData dependency

  // --- Edit Mode Toggles & Handlers ---
  const handleStartEdit = useCallback((row) => {
    if (!row || row.id == null) return;
    if (type === 'lists') { /* ... list modal logic ... */ return; }

    const initialRowData = {};
    columns.forEach((col) => {
        if (col.editable && col.key !== 'select' && col.key !== 'actions') {
             let initialValue = row[col.key];
             if ((col.key === 'tags' || col.key === 'zipcode_ranges') && Array.isArray(initialValue)) { initialValue = initialValue.join(', '); }
             if (col.inputType === 'boolean') { initialValue = String(initialValue ?? false); }
            initialRowData[col.key] = initialValue ?? '';
        }
    });
     if (row.city_id !== undefined) initialRowData.city_id = row.city_id;
     if (row.city_name !== undefined) initialRowData.city_name = row.city_name;
     if (row.neighborhood_id !== undefined) initialRowData.neighborhood_id = row.neighborhood_id;
     if (row.neighborhood_name !== undefined) initialRowData.neighborhood_name = row.neighborhood_name;
     if (row.restaurant_id !== undefined) { initialRowData.restaurant_id = row.restaurant_id; initialRowData.restaurant_name = row.restaurant_name; }

    // *** LOGGING: Confirm row ID is added to edit set ***
    const currentEditingIds = editingRowIds; // Get current state
    const newEditingRowIds = new Set(currentEditingIds).add(row.id);
    console.log(`[handleStartEdit] Adding rowId ${row.id} to editingRowIds. Prev size: ${currentEditingIds.size}, New size: ${newEditingRowIds.size}`);
    setEditingRowIds(newEditingRowIds); // Update state

    setEditFormData((prev) => ({ ...prev, [row.id]: initialRowData }));
    setEditError(null);
  }, [type, columns, editingRowIds]); // Added editingRowIds dependency

  const handleCancelEdit = useCallback((rowId) => {
    // *** LOGGING: Confirm row ID is removed from edit set ***
    console.log(`[handleCancelEdit] Removing rowId ${rowId} from editingRowIds.`);
    setEditingRowIds((prev) => {
        const newSet = new Set(prev);
        const deleted = newSet.delete(rowId);
        console.log(`[handleCancelEdit] Row ${rowId} ${deleted ? 'removed' : 'not found'} from editingRowIds. New size: ${newSet.size}`);
        return newSet;
    });
    setEditFormData((prev) => { const newState = { ...prev }; delete newState[rowId]; return newState; });
    setEditError(null);
  }, []);

  // --- Add Row Handlers ---
  const handleStartAdd = useCallback(() => { /* ... keep implementation ... */ }, [isAdding, editingRowIds.size, columns]);
  const handleCancelAdd = useCallback(() => { /* ... keep implementation ... */ }, []);

  // --- Save Operations ---

  // Save New Row
  const handleSaveNewRow = useCallback(async () => { /* ... keep implementation ... */ }, [editFormData, isSaving, columns, type, onDataMutated, handleCancelAdd, setError, cities, neighborhoods]);

  // Save Inline Edit for a Single Row
  const handleSaveEdit = useCallback(async (rowId) => {
    // *** LOGGING: Log entry and current state ***
    console.log(`[handleSaveEdit] === Initiated for rowId: ${rowId}, type: ${type} ===`);
    console.log(`[handleSaveEdit] Current isSaving state: ${isSaving}`);
    console.log(`[handleSaveEdit] Current editingRowIds:`, editingRowIds); // Log the Set object
    console.log(`[handleSaveEdit] Checking if editingRowIds has ${rowId}: ${editingRowIds.has(rowId)}`);

    if (type === 'lists') return;

    const originalRow = updatedData.find((r) => r.id === rowId);
    const currentRowFormData = editFormData[rowId];

    // *** LOGGING: Log checks inside the guard clause ***
    if (!originalRow || !editingRowIds.has(rowId) || isSaving || typeof currentRowFormData !== 'object') {
      console.warn(`[handleSaveEdit] Aborted for row ${rowId}. Conditions not met:`, {
          hasOriginalRow: !!originalRow,
          isEditing: editingRowIds.has(rowId),
          isSaving: isSaving,
          hasFormData: typeof currentRowFormData === 'object'
      });
      // Log which specific condition failed
      if (!originalRow) console.warn('[handleSaveEdit] Reason: Original row not found.');
      if (!editingRowIds.has(rowId)) console.warn(`[handleSaveEdit] Reason: Row ID ${rowId} not found in editingRowIds set.`);
      if (isSaving) console.warn('[handleSaveEdit] Reason: Already saving.');
      if (typeof currentRowFormData !== 'object') console.warn('[handleSaveEdit] Reason: Form data for row is not an object.');
      return; // Exit early
    }

    // --- Proceed with save logic ---
    console.log(`[handleSaveEdit] Row ${rowId} - Checks passed. Proceeding to build payload.`);
    setError(null);
    setEditError(null);

    const apiPayload = {};
    let validationFailed = false;
    let changedFields = false;

    // Compare values and build payload
    columns.forEach(col => {
      if (validationFailed || !col.editable || col.key === 'select' || col.key === 'actions') return;

      const key = col.key;
      const originalValue = originalRow[key];
      const editedValue = currentRowFormData[key];
      let processedEditedValue = editedValue;
      let processedOriginalValue = originalValue;
      let valueChanged = false;

      // *** LOGGING: Log comparison for each editable field ***
      // console.log(`[handleSaveEdit] Row ${rowId}, Field '${key}': Original='${originalValue}', Edited='${editedValue}'`);

      // --- Type-specific processing and change detection ---
      if (key === 'tags' || key === 'zipcode_ranges') {
        processedEditedValue = parseAndValidateZipcodes(editedValue);
        processedOriginalValue = parseAndValidateZipcodes(originalValue);
        if (JSON.stringify([...(processedOriginalValue || [])].sort()) !== JSON.stringify([...(processedEditedValue || [])].sort())) {
          valueChanged = true;
          // console.log(`[handleSaveEdit] Row ${rowId}, Field '${key}': Change detected (Array).`);
        }
      } else if (col.inputType === 'boolean') {
        processedEditedValue = editedValue === 'true' || editedValue === true;
        processedOriginalValue = originalValue ?? false;
        if (processedOriginalValue !== processedEditedValue) {
          valueChanged = true;
          // console.log(`[handleSaveEdit] Row ${rowId}, Field '${key}': Change detected (Boolean).`);
        }
      } else if (['city_id', 'neighborhood_id', 'restaurant_id'].includes(key)) {
        processedEditedValue = (editedValue === '' || editedValue === null || editedValue === undefined) ? null : Number(editedValue);
        processedOriginalValue = (originalValue === null || originalValue === undefined) ? null : Number(originalValue);
        if (editedValue !== null && editedValue !== '' && editedValue !== undefined && (isNaN(processedEditedValue) || processedEditedValue <= 0)) {
          setEditError(`Invalid ${col.header || key}. Must be a positive number or empty.`); validationFailed = true;
        }
        if (col.required && processedEditedValue === null) {
          setEditError(`${col.header || key} is required.`); validationFailed = true;
        }
        if (processedOriginalValue !== processedEditedValue) {
          valueChanged = true;
          // console.log(`[handleSaveEdit] Row ${rowId}, Field '${key}': Change detected (ID).`);
        }
      } else { // Default handling (strings, numbers, etc.)
        processedEditedValue = (typeof editedValue === 'string') ? (editedValue.trim() || null) : editedValue ?? null;
        processedOriginalValue = originalValue ?? null;
        if (col.required && (processedEditedValue === null || String(processedEditedValue).trim() === '')) {
          setEditError(`${col.header || key} is required.`); validationFailed = true;
        }
        if (String(processedOriginalValue ?? '') !== String(processedEditedValue ?? '')) {
          valueChanged = true;
          // console.log(`[handleSaveEdit] Row ${rowId}, Field '${key}': Change detected (Other).`);
        }
      }

      // Add to payload if changed and valid
      if (valueChanged && !validationFailed) {
        apiPayload[key] = processedEditedValue; changedFields = true;
        // Include names when IDs change
        if (key === 'city_id' && apiPayload[key] != null) { const city = cities?.find(c => String(c.id) === String(apiPayload[key])); apiPayload.city_name = city?.name ?? null; }
        if (key === 'neighborhood_id' && apiPayload[key] != null) { const nb = neighborhoods?.find(n => String(n.id) === String(apiPayload[key])); apiPayload.neighborhood_name = nb?.name ?? null; }
        // Clear names if IDs are cleared
        if (key === 'city_id' && apiPayload[key] === null) { apiPayload.city_name = null; }
        if (key === 'neighborhood_id' && apiPayload[key] === null) { apiPayload.neighborhood_name = null; }
        if (key === 'restaurant_id' && apiPayload[key] === null) { apiPayload.restaurant_name = null; }
      }
    });
     // Special handling for restaurant_id/name update in Dishes (Keep as is)
     if (type === 'dishes' && !validationFailed) { /* ... */ }

    if (validationFailed) {
      console.warn(`[handleSaveEdit] Validation failed for row ${rowId}. Error:`, editError);
      return;
    }
    if (!changedFields) {
      console.log(`[handleSaveEdit] No changes detected for row ${rowId}. Cancelling edit.`);
      handleCancelEdit(rowId);
      return;
    }

    console.log(`[handleSaveEdit] Row ${rowId} - Sending payload:`, apiPayload); // Log final payload
    setIsSaving(true);

    try {
      const response = await adminService.updateResource(type, rowId, apiPayload);
      if (!response.success) { throw new Error(response.error || response.message || `Failed to save ${type}.`); }
      console.log(`[handleSaveEdit] Row ${rowId} - Save successful. Response:`, response.data);
      handleCancelEdit(rowId);
      onDataMutated?.();
    } catch (err) {
      console.error(`[handleSaveEdit] Row ${rowId} - Save Error:`, err);
      setEditError(err.message || 'Save failed.');
    } finally {
      console.log(`[handleSaveEdit] Row ${rowId} - Resetting isSaving flag.`); // Log flag reset
      setIsSaving(false);
    }
  }, [
    updatedData, editFormData, isSaving, editingRowIds, columns, type,
    onDataMutated, handleCancelEdit, setEditError, cities, neighborhoods, setError // Keep dependencies
  ]);

  // --- List Edit Modal Handlers --- (Keep as before)
  const handleCloseListEditModal = useCallback(() => { /* ... */ }, []);
  const handleSaveListEdit = useCallback(async (listId, editedListData) => { /* ... */ }, [isSaving, handleCloseListEditModal, onDataMutated]);

  // --- Bulk Edit Handlers --- (Keep as before)
  const handleBulkEdit = useCallback(() => { /* ... */ }, [selectedRows, updatedData, handleStartEdit, isAdding, editingRowIds.size]);
  const handleCancelBulkEdit = useCallback(() => { /* ... */ }, [editingRowIds, selectedRows, handleCancelEdit]);
  const handleSaveAllEdits = useCallback(async () => { /* ... */ }, [ isBulkEditing, isSaving, editingRowIds, selectedRows, handleSaveEdit, handleCancelBulkEdit ]);

  // --- Action Cell Handlers (Delegated) --- (Keep as before)
  const handleDeleteClick = useCallback((id, itemType) => { /* ... */ }, []);
  const handleDeleteConfirm = useCallback(async () => { /* ... */ }, [confirmDeleteInfo, actionState.deletingId, onDataMutated]);
  const handleApprove = useCallback(async (submissionId) => { /* ... */ }, [actionState.approvingId, actionState.rejectingId, onDataMutated]);
  const handleReject = useCallback(async (submissionId) => { /* ... */ }, [actionState.approvingId, actionState.rejectingId, onDataMutated]);


  // --- Return hook state and handlers ---
  return {
    editingRowIds, editFormData, editError, isSaving, actionState, error, confirmDeleteInfo, isAdding,
    selectedRows, isBulkEditing, bulkSaveError, updatedData, handleRowDataChange, handleStartEdit,
    handleCancelEdit, handleSaveEdit, handleStartAdd, handleCancelAdd, handleSaveNewRow,
    handleDeleteClick, handleDeleteConfirm, setConfirmDeleteInfo, handleApprove, handleReject,
    setSelectedRows, handleBulkEdit, handleCancelBulkEdit, handleSaveAllEdits, setError,
    setEditError, setActionState, setEditingRowIds,
    // List Modal State & Handlers
    isListEditModalOpen, listToEditData, listEditError,
    handleCloseListEditModal, handleSaveListEdit,
  };
};