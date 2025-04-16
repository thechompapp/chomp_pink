/* src/hooks/useAdminTableState.js */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminService } from '@/services/adminService.js'; // Keep for generic updates/creates/deletes
import useSubmissionStore from '@/stores/useSubmissionStore'; // *** ADDED: Import the submission store ***
import apiClient from '@/services/apiClient.js';
// REMOVED: Incorrect backend model import
// import * as SubmissionModel from '../../doof-backend/models/submissionModel.js';

// Helper function (remains the same)
const parseAndValidateZipcodes = (value) => { /* ... implementation ... */
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
  onDataMutated, // Callback prop to notify parent of changes
}) => {
  // --- State ---
  const [editingRowIds, setEditingRowIds] = useState(new Set());
  const [editFormData, setEditFormData] = useState({});
  const [editError, setEditError] = useState(null);
  const [isSaving, setIsSaving] = useState(false); // Global saving state (for inline/bulk edits)
  const [actionState, setActionState] = useState({ deletingId: null, approvingId: null, rejectingId: null }); // Specific row action states
  const [error, setError] = useState(null); // General hook/action errors
  const [confirmDeleteInfo, setConfirmDeleteInfo] = useState({ isOpen: false, id: null, itemType: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [bulkSaveError, setBulkSaveError] = useState(null);
  const [updatedData, setUpdatedData] = useState(initialData); // Local copy for rendering
  // List Edit Modal State
  const [isListEditModalOpen, setIsListEditModalOpen] = useState(false);
  const [listToEditData, setListToEditData] = useState(null);
  const [listEditError, setListEditError] = useState(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  // Get submission store actions
  // Use getState() inside handlers to always get the latest store actions/state
  // const { approveSubmission, rejectSubmission } = useSubmissionStore.getState();


  // Effect to sync local data when initialData prop changes (like after fetch)
  useEffect(() => {
    setUpdatedData(initialData);
    // Reset local states when data source changes
    setEditingRowIds(new Set());
    setEditFormData({});
    setIsAdding(false);
    setIsBulkEditing(false);
    setSelectedRows(new Set());
    setEditError(null);
    setError(null);
    setListEditError(null);
    setIsListEditModalOpen(false);
    setListToEditData(null);
    setActionState({ deletingId: null, approvingId: null, rejectingId: null });
  }, [initialData]);

  // --- Core Data Update Handler ---
  // Callback for handling inline data changes (remains the same)
  const handleRowDataChange = useCallback(async (rowId, incomingChanges) => { /* ... implementation ... */
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
  }, [type, cities, editFormData]);


  // --- Edit Mode Toggles & Handlers ---
  // Callback to start editing a row (handles list modal logic)
  const handleStartEdit = useCallback((row) => {
    if (!row || row.id == null) return;
    setError(null); // Clear general errors when starting edit

    // Handle list edit via modal
    if (type === 'lists') {
        console.log("[AdminTable] Opening list edit modal for:", row);
        setListToEditData(row);
        setIsListEditModalOpen(true);
        setListEditError(null); // Clear previous list modal errors
        return; // Don't proceed with inline editing for lists
    }

    // Handle inline editing for other types
    const initialRowData = {};
    columns.forEach((col) => {
        if (col.editable && col.key !== 'select' && col.key !== 'actions') {
             let initialValue = row[col.key];
             // Convert array types to string for input fields
             if ((col.key === 'tags' || col.key === 'zipcode_ranges') && Array.isArray(initialValue)) {
                  initialValue = initialValue.join(', ');
             }
              // Convert boolean to string 'true'/'false' for selects
              if (col.inputType === 'boolean') {
                 initialValue = String(initialValue ?? false);
             }
            initialRowData[col.key] = initialValue ?? ''; // Use empty string for null/undefined
        }
    });
     // Ensure relevant IDs/names are captured if available
     if (row.city_id !== undefined) initialRowData.city_id = row.city_id;
     if (row.city_name !== undefined) initialRowData.city_name = row.city_name;
     if (row.neighborhood_id !== undefined) initialRowData.neighborhood_id = row.neighborhood_id;
     if (row.neighborhood_name !== undefined) initialRowData.neighborhood_name = row.neighborhood_name;
     if (row.restaurant_id !== undefined) { initialRowData.restaurant_id = row.restaurant_id; initialRowData.restaurant_name = row.restaurant_name; }

    setEditingRowIds((prev) => new Set(prev).add(row.id)); // Add to editing set
    setEditFormData((prev) => ({ ...prev, [row.id]: initialRowData }));
    setEditError(null); // Clear edit-specific errors
  }, [type, columns]); // Removed 'editingRowIds' from dependencies as it's being set

  // Callback to cancel editing a row (remains the same)
  const handleCancelEdit = useCallback((rowId) => {
    setEditingRowIds((prev) => { const newSet = new Set(prev); newSet.delete(rowId); return newSet; });
    setEditFormData((prev) => { const newState = { ...prev }; delete newState[rowId]; return newState; });
    setEditError(null);
  }, []); // Keep dependencies minimal

  // --- Add Row Handlers ---
  // Callback to start adding a new row (remains the same)
  const handleStartAdd = useCallback(() => {
    if (isAdding || editingRowIds.size > 0) return;
    setError(null);
    const newRowDefaults = {};
    columns.forEach(col => {
        if (col.editable && col.key !== 'actions' && col.key !== 'select') {
             newRowDefaults[col.key] = col.inputType === 'boolean' ? 'false' : '';
        }
    });
    setEditFormData({ '__NEW_ROW__': newRowDefaults });
    setIsAdding(true);
  }, [isAdding, editingRowIds.size, columns]); // Keep dependencies

  // Callback to cancel adding a new row (remains the same)
  const handleCancelAdd = useCallback(() => {
    setIsAdding(false);
    setEditFormData({});
    setError(null);
  }, []); // Keep dependencies minimal

  // --- Save Operations ---

  // Callback to save a new row (remains the same)
  const handleSaveNewRow = useCallback(async () => {
      const newRow = editFormData['__NEW_ROW__'];
      if (!newRow || isSaving) return;
      setError(null); // Clear previous general errors
      setIsSaving(true);
      try {
          // Prepare data (convert types if needed, e.g., tags string to array)
          const payload = { ...newRow };
          columns.forEach(col => {
              if (payload[col.key] !== undefined && (col.key === 'tags' || col.key === 'zipcode_ranges') && typeof payload[col.key] === 'string') {
                 payload[col.key] = payload[col.key].split(',').map(s => s.trim()).filter(Boolean);
              } else if (col.inputType === 'boolean') {
                  payload[col.key] = payload[col.key] === 'true';
              }
          });
          // Remove temporary fields if necessary before sending
          // delete payload.city_name; // If only ID should be sent
          // delete payload.neighborhood_name; // If only ID should be sent
          // delete payload.restaurant_name; // If only ID should be sent

          const result = await adminService.createResource(type, payload);
          if (result.success) {
              handleCancelAdd();
              onDataMutated?.();
          } else {
              setError(result.error || `Failed to add new ${type.slice(0, -1)}.`);
          }
      } catch (err) {
          console.error(`[AdminTable SaveNewRow] Error saving new ${type}:`, err);
          setError(err.message || 'Save failed.');
      } finally {
          setIsSaving(false);
      }
  }, [editFormData, isSaving, columns, type, onDataMutated, handleCancelAdd, setError, cities, neighborhoods]); // Added dependencies


  // Callback to save an edited row (remains the same)
  const handleSaveEdit = useCallback(async (rowId) => {
      if (type === 'lists') return; // Lists handled by modal
      const originalRow = updatedData.find((r) => r.id === rowId);
      const currentRowFormData = editFormData[rowId];
      if (!originalRow || !editingRowIds.has(rowId) || isSaving || typeof currentRowFormData !== 'object') {
          console.warn(`[handleSaveEdit] Aborted for row ${rowId}. Conditions not met.`);
          return;
      }
      setError(null); setEditError(null);
      const apiPayload = {}; let validationFailed = false; let changedFields = false;

      columns.forEach(col => {
          if (validationFailed || !col.editable || col.key === 'select' || col.key === 'actions') return;
          const key = col.key; const originalValue = originalRow[key]; const editedValue = currentRowFormData[key];
          let processedEditedValue = editedValue; let processedOriginalValue = originalValue; let valueChanged = false;

          if (key === 'tags' || key === 'zipcode_ranges') {
              processedEditedValue = parseAndValidateZipcodes(editedValue);
              processedOriginalValue = parseAndValidateZipcodes(originalValue);
              if (JSON.stringify([...(processedOriginalValue || [])].sort()) !== JSON.stringify([...(processedEditedValue || [])].sort())) { valueChanged = true; }
          } else if (col.inputType === 'boolean') {
              processedEditedValue = editedValue === 'true' || editedValue === true;
              processedOriginalValue = originalValue ?? false;
              if (processedOriginalValue !== processedEditedValue) { valueChanged = true; }
          } else if (['city_id', 'neighborhood_id', 'restaurant_id'].includes(key)) {
              processedEditedValue = (editedValue === '' || editedValue === null || editedValue === undefined) ? null : Number(editedValue);
              processedOriginalValue = (originalValue === null || originalValue === undefined) ? null : Number(originalValue);
              if (editedValue != null && editedValue !== '' && editedValue !== undefined && (isNaN(processedEditedValue) || processedEditedValue <= 0)) { setEditError(`Invalid ${col.header || key}. Must be a positive number or empty.`); validationFailed = true; }
              if (col.required && processedEditedValue === null) { setEditError(`${col.header || key} is required.`); validationFailed = true; }
              if (processedOriginalValue !== processedEditedValue) { valueChanged = true; }
          } else {
              processedEditedValue = (typeof editedValue === 'string') ? (editedValue.trim() || null) : editedValue ?? null;
              processedOriginalValue = originalValue ?? null;
              if (col.required && (processedEditedValue === null || String(processedEditedValue).trim() === '')) { setEditError(`${col.header || key} is required.`); validationFailed = true; }
              if (String(processedOriginalValue ?? '') !== String(processedEditedValue ?? '')) { valueChanged = true; }
          }
          if (valueChanged && !validationFailed) { apiPayload[key] = processedEditedValue; changedFields = true; }
      });

      if (type === 'dishes' && !validationFailed && apiPayload.restaurant_id === undefined && currentRowFormData.restaurant_name !== undefined) {
          const originalRestaurantId = originalRow?.restaurant_id;
          const editedRestaurantName = currentRowFormData.restaurant_name?.trim();
          const editedRestaurantId = currentRowFormData.restaurant_id; // Use ID if provided by autocomplete

          if (editedRestaurantId !== undefined && Number(originalRestaurantId) !== Number(editedRestaurantId)) {
              // If ID changed via autocomplete, it's already handled above
          } else if (editedRestaurantId === undefined && editedRestaurantName && editedRestaurantName !== originalRow?.restaurant_name) {
              // Name changed manually, need to look up ID - This is less reliable
              console.warn(`[handleSaveEdit] Manual restaurant name change for dish ${rowId} - ID lookup not implemented in frontend. Restaurant ID will not be updated.`);
              // If needed, implement lookup here or ensure autocomplete is always used
              // delete apiPayload.restaurant_name; // Don't send name if ID wasn't looked up
          }
      }

      if (validationFailed) { console.warn(`[handleSaveEdit] Validation failed for row ${rowId}. Error:`, editError); return; }
      if (!changedFields) { handleCancelEdit(rowId); return; }

      console.log(`[handleSaveEdit] Row ${rowId} - Sending payload:`, apiPayload);
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
          setIsSaving(false);
      }
  }, [updatedData, editFormData, isSaving, editingRowIds, columns, type, onDataMutated, handleCancelEdit, setEditError, cities, neighborhoods, setError]); // Keep dependencies


  // --- List Edit Modal Handlers ---
  // Callback to close list edit modal (remains the same)
  const handleCloseListEditModal = useCallback(() => {
    setIsListEditModalOpen(false);
    setListToEditData(null);
    setListEditError(null);
  }, []);

  // Callback to save list edits from modal (remains the same)
  const handleSaveListEdit = useCallback(async (listId, editedListData) => {
    if (isSaving) return;
    setIsSaving(true);
    setListEditError(null);
    try {
        const payload = { ...editedListData };
        // Convert tags string back to array
        if (typeof payload.tags === 'string') {
            payload.tags = payload.tags.split(',').map(s => s.trim()).filter(Boolean);
        }
        const result = await adminService.updateAdminList(listId, payload);
        if (result.success) {
            handleCloseListEditModal();
            onDataMutated?.();
        } else {
             setListEditError(result.error || 'Failed to save list.');
        }
    } catch (err) {
        console.error(`[AdminTable SaveListEdit] Error saving list ${listId}:`, err);
        setListEditError(err.message || 'Save failed.');
    } finally {
        setIsSaving(false);
    }
  }, [isSaving, handleCloseListEditModal, onDataMutated]);

  // --- Bulk Edit Handlers ---
  // Callback to initiate bulk edit (remains the same)
  const handleBulkEdit = useCallback(() => {
    if (isAdding || editingRowIds.size > 0 || selectedRows.size === 0) return;
    const initialBulkData = {};
    const newEditingIds = new Set();
    selectedRows.forEach(rowId => {
        const row = updatedData.find(r => r.id === rowId);
        if (row) {
            const rowData = {};
            columns.forEach(col => {
                if (col.editable && col.key !== 'actions' && col.key !== 'select') {
                     let value = row[col.key];
                     if ((col.key === 'tags' || col.key === 'zipcode_ranges') && Array.isArray(value)) value = value.join(', ');
                     if (col.inputType === 'boolean') value = String(value ?? false);
                     rowData[col.key] = value ?? '';
                }
            });
            // Include IDs/names
            if (row.city_id !== undefined) rowData.city_id = row.city_id;
            if (row.city_name !== undefined) rowData.city_name = row.city_name;
            if (row.neighborhood_id !== undefined) rowData.neighborhood_id = row.neighborhood_id;
            if (row.neighborhood_name !== undefined) rowData.neighborhood_name = row.neighborhood_name;
            if (row.restaurant_id !== undefined) { rowData.restaurant_id = row.restaurant_id; rowData.restaurant_name = row.restaurant_name; }

            initialBulkData[rowId] = rowData;
            newEditingIds.add(rowId);
        }
    });
    setEditFormData(initialBulkData);
    setEditingRowIds(newEditingIds);
    setIsBulkEditing(true);
    setBulkSaveError(null);
  }, [selectedRows, updatedData, columns, isAdding, editingRowIds]); // Added dependencies

  // Callback to cancel bulk edit (remains the same)
  const handleCancelBulkEdit = useCallback(() => {
    setIsBulkEditing(false);
    setEditingRowIds(new Set());
    setEditFormData({});
    setBulkSaveError(null);
  }, []); // Keep dependencies minimal

  // Callback to save all bulk edits (remains the same)
  const handleSaveAllEdits = useCallback(async () => {
    if (!isBulkEditing || isSaving) return;
    setBulkSaveError(null);
    setIsSaving(true); // Use global saving state

    const savePromises = [];
    editingRowIds.forEach(rowId => {
        savePromises.push(handleSaveEdit(rowId)); // Call individual save handler
    });

    try {
        await Promise.all(savePromises);
        // If all saves were successful (no errors thrown and set in editError), cancel bulk mode
        // Note: Individual save errors are set in `editError`, check that if needed
        handleCancelBulkEdit();
        // Data mutation is handled by individual handleSaveEdit calls
    } catch (bulkErr) {
        // This catch block might not be reached if individual saves handle their errors
        console.error("[AdminTable SaveAllEdits] Error during bulk save:", bulkErr);
        setBulkSaveError("One or more rows failed to save. Check individual rows for errors.");
    } finally {
        setIsSaving(false); // Reset global saving state
    }
  }, [isBulkEditing, isSaving, editingRowIds, handleSaveEdit, handleCancelBulkEdit]); // Added dependencies

  // --- Action Cell Handlers (Approve/Reject/Delete) ---
  // *** MODIFIED: Use submission store actions ***
  const handleApprove = useCallback(async (submissionId) => {
    if (actionState.approvingId || actionState.rejectingId) return;
    setError(null);
    setActionState(prev => ({ ...prev, approvingId: submissionId }));
    try {
        // Get the store action
        const { approveSubmission } = useSubmissionStore.getState();
        await approveSubmission(submissionId); // Let the store handle API call and invalidation
        // Success message or specific feedback handled by the store/component observing it
        onDataMutated?.(); // Trigger general refetch if needed
    } catch (err) {
        console.error(`[AdminTable Approve] Error approving submission ${submissionId}:`, err);
        setError(err.message || 'Approval failed.');
    } finally {
        setActionState(prev => ({ ...prev, approvingId: null }));
    }
  }, [actionState.approvingId, actionState.rejectingId, onDataMutated, setError]); // Removed direct model call

  // *** MODIFIED: Use submission store actions ***
  const handleReject = useCallback(async (submissionId) => {
    if (actionState.approvingId || actionState.rejectingId) return;
    setError(null);
    setActionState(prev => ({ ...prev, rejectingId: submissionId }));
    try {
         // Get the store action
         const { rejectSubmission } = useSubmissionStore.getState();
        await rejectSubmission(submissionId); // Let the store handle API call and invalidation
        // Success message or specific feedback handled by the store/component observing it
        onDataMutated?.(); // Trigger general refetch if needed
    } catch (err) {
        console.error(`[AdminTable Reject] Error rejecting submission ${submissionId}:`, err);
        setError(err.message || 'Rejection failed.');
    } finally {
        setActionState(prev => ({ ...prev, rejectingId: null }));
    }
  }, [actionState.approvingId, actionState.rejectingId, onDataMutated, setError]); // Removed direct model call

  // Callback to initiate delete confirmation (remains the same)
  const handleDeleteClick = useCallback((id, itemType) => {
    setConfirmDeleteInfo({ isOpen: true, id, itemType });
  }, []);

  // Callback to confirm deletion (remains the same)
  const handleDeleteConfirm = useCallback(async () => {
    const { id: idToDelete, itemType } = confirmDeleteInfo;
    if (!idToDelete || !itemType || actionState.deletingId) return;

    setError(null);
    setActionState(prev => ({ ...prev, deletingId: idToDelete }));

    try {
        const result = await adminService.deleteResource(itemType, idToDelete);
        if (result.success) {
            setConfirmDeleteInfo({ isOpen: false, id: null, itemType: '' });
            onDataMutated?.(); // Trigger refetch
        } else {
            setError(result.error || `Failed to delete ${itemType.slice(0, -1)}.`);
        }
    } catch (err) {
        console.error(`[AdminTable DeleteConfirm] Error deleting ${itemType} ${idToDelete}:`, err);
        setError(err.message || 'Deletion failed.');
    } finally {
        setActionState(prev => ({ ...prev, deletingId: null }));
        // Keep dialog open on error? Close it here if preferred even on error.
        // setConfirmDeleteInfo({ isOpen: false, id: null, itemType: '' });
    }
  }, [confirmDeleteInfo, actionState.deletingId, onDataMutated, setError]); // Added dependencies

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