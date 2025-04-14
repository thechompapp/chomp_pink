/* src/hooks/useAdminTableState.js */
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminService } from '@/services/adminService.js';
import apiClient from '@/services/apiClient.js'; // Keep if used elsewhere, maybe not needed directly now

// Helper to parse zip codes
const parseZipcodeRanges = (value) => { if (Array.isArray(value)) return value.map(String).filter(Boolean); if (typeof value === 'string' && value.trim()) { return value.split(',').map((zip) => zip.trim()).filter(zip => /^\d{5}$/.test(zip)); } return []; };

export const useAdminTableState = ({
  initialData = [],
  type,
  columns = [], // Expecting final columns structure from AdminTable
  cities = [],
  neighborhoods = [],
  onDataMutated,
}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // State variables
  const [editingRowIds, setEditingRowIds] = useState(new Set()); // Used for inline editing (non-lists)
  const [editFormData, setEditFormData] = useState({}); // Used for inline editing & add row
  const [editError, setEditError] = useState(null);
  const [isSaving, setIsSaving] = useState(false); // General saving flag (inline edit, add new, list modal save)
  const [actionState, setActionState] = useState({ deletingId: null, approvingId: null, rejectingId: null });
  const [error, setError] = useState(null); // General errors (delete, approve, reject, add)
  const [confirmDeleteInfo, setConfirmDeleteInfo] = useState({ isOpen: false, id: null, itemType: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [bulkSaveError, setBulkSaveError] = useState(null);
  const [updatedData, setUpdatedData] = useState(initialData);

  // ** NEW State for List Edit Modal **
  const [isListEditModalOpen, setIsListEditModalOpen] = useState(false);
  const [listToEditData, setListToEditData] = useState(null); // Stores the list object being edited
  const [listEditError, setListEditError] = useState(null); // Specific error for the modal save

  // Effect to update local data
  useEffect(() => { setUpdatedData(initialData); setEditingRowIds(new Set()); setEditFormData({}); setIsAdding(false); setIsBulkEditing(false); setSelectedRows(new Set()); setEditError(null); setError(null); setListEditError(null); setIsListEditModalOpen(false); setListToEditData(null); }, [initialData]);

  // State Update Handler (for inline edits)
  const handleRowDataChange = useCallback((rowId, changes) => { /* ... same ... */ setEditFormData((prev) => ({ ...prev, [rowId]: { ...(prev[rowId] || {}), ...changes } })); setEditError(null); setBulkSaveError(null); setError(null); setListEditError(null); }, []);

  // Edit Mode Toggles & Handlers
  const handleStartEdit = useCallback((row) => {
    if (!row || row.id == null) return;

    // ** NEW: Handle lists differently **
    if (type === 'lists') {
        console.log(`[useAdminTableState] StartEdit List ID ${row.id}`, row);
        // Prepare data for the modal, converting tags array to string if needed by form
        const modalData = {
            ...row,
            tags: Array.isArray(row.tags) ? row.tags.join(', ') : '', // Convert tags array to comma-separated string for input
        };
        setListToEditData(modalData);
        setIsListEditModalOpen(true);
        setListEditError(null); // Clear previous modal errors
    } else { // Handle inline editing for other types
        const initialData = {};
        columns.forEach((col) => {
            if (col.editable && col.key !== 'select' && col.key !== 'actions') {
                let initialValue;
                const dataKey = col.key;
                const sourceValue = row[dataKey];
                if (col.inputType === 'boolean') { initialValue = String(sourceValue ?? false); }
                else if ((col.key === 'tags' || col.key === 'zipcode_ranges') && Array.isArray(sourceValue)) { initialValue = sourceValue.join(', '); }
                else { initialValue = sourceValue ?? ''; }
                initialData[col.key] = initialValue;
            }
        });
        if (row.city_id !== undefined) initialData.city_id = row.city_id;
        if (row.neighborhood_id !== undefined) initialData.neighborhood_id = row.neighborhood_id;
        if (row.restaurant_id !== undefined) { initialData.restaurant_id = row.restaurant_id; initialData.restaurant_name = row.restaurant_name; }
        console.log(`[useAdminTableState] StartEdit Inline Row ${row.id}`, initialData);
        setEditFormData((prev) => ({ ...prev, [row.id]: initialData }));
        setEditingRowIds((prev) => new Set(prev).add(row.id));
        setEditError(null);
    }
  }, [type, columns]); // Added type dependency

  const handleCancelEdit = useCallback((rowId) => { /* ... same - handles inline edits ... */ setEditingRowIds((prev) => { const newSet = new Set(prev); newSet.delete(rowId); return newSet; }); setEditFormData((prev) => { const newState = { ...prev }; delete newState[rowId]; return newState; }); setEditError(null); }, []);

  // Add Row Handlers (Keep as before)
  const handleStartAdd = useCallback(() => { /* ... */ }, [isAdding, editingRowIds.size, columns]);
  const handleCancelAdd = useCallback(() => { /* ... */ }, []);
  const handleSaveNewRow = useCallback(async () => { /* ... */ }, [editFormData, isSaving, columns, type, adminService, onDataMutated, handleCancelAdd]);

  // --- Single Row Inline Save (for non-list types) ---
  const handleSaveEdit = useCallback(async (rowId) => {
     // ** Ensure this only runs for non-list types now **
     if (type === 'lists') {
          console.warn("handleSaveEdit called for list type, should use handleSaveListEdit instead.");
          return;
     }
    // ... (Rest of the inline save logic remains the same as previous version) ...
     const row = updatedData.find((r) => r.id === rowId); const currentRowFormData = editFormData[rowId]; if (!row || !editingRowIds.has(rowId) || isSaving || typeof currentRowFormData !== 'object' || currentRowFormData === null) return; setError(null); setEditError(null); setIsSaving(true); const apiPayload = {}; let validationFailed = false; let changedFields = false; columns .filter((col) => col.editable && col.key !== 'select' && col.key !== 'actions') .forEach((col) => { if (validationFailed) return; const key = col.key; let originalValue = row[key]; let editedValue = currentRowFormData[key]; let processedEditedValue = editedValue; let processedOriginalValue = originalValue; if (key === 'tags' || key === 'zipcode_ranges') { processedEditedValue = parseZipcodeRanges(editedValue); processedOriginalValue = Array.isArray(originalValue) ? originalValue : []; if (JSON.stringify(processedOriginalValue.sort()) !== JSON.stringify(processedEditedValue.sort())) { apiPayload[key] = processedEditedValue; changedFields = true; } } else if (key === 'is_public') { processedEditedValue = editedValue === 'true'; processedOriginalValue = originalValue ?? false; if (processedOriginalValue !== processedEditedValue) { apiPayload[key] = processedEditedValue; changedFields = true; } } else if (key === 'city_id' || key === 'neighborhood_id' || key === 'restaurant_id') { processedEditedValue = (editedValue === '' || editedValue == null) ? null : parseInt(String(editedValue), 10); processedOriginalValue = (originalValue == null) ? null : Number(originalValue); if (editedValue != null && editedValue !== '' && isNaN(processedEditedValue)) { setEditError(`Invalid ID for ${col.header || key}.`); validationFailed = true; } if (col.required && processedEditedValue == null) { setEditError(`${col.header || key} is required.`); validationFailed = true; } if (processedOriginalValue !== processedEditedValue && !validationFailed) { apiPayload[key] = processedEditedValue; changedFields = true; if (key === 'city_id' && apiPayload[key] != null) { const city = cities?.find(c => c.id === apiPayload[key]); apiPayload.city_name = city?.name || null; } if (key === 'neighborhood_id' && apiPayload[key] != null) { const nb = neighborhoods?.find(n => n.id === apiPayload[key]); apiPayload.neighborhood_name = nb?.name || null; } } } else { processedEditedValue = typeof editedValue === 'string' ? (editedValue.trim() || null) : editedValue ?? null; processedOriginalValue = originalValue ?? null; if (col.required && (processedEditedValue === null || String(processedEditedValue).trim() === '')) { setEditError(`${col.header || key} is required.`); validationFailed = true; } if (String(processedOriginalValue ?? '') !== String(processedEditedValue ?? '') && !validationFailed) { apiPayload[key] = processedEditedValue; changedFields = true; } } }); if (type === 'dishes' && !validationFailed) { const nameInForm = currentRowFormData.restaurant_name?.trim() || null; const idInForm = currentRowFormData.restaurant_id; const originalId = row.restaurant_id; if (nameInForm && (idInForm == null || idInForm === originalId)) { if (nameInForm !== row.restaurant_name) { setEditError("Restaurant field changed, please select a valid restaurant from the suggestions."); validationFailed = true; } } else if (idInForm != null && idInForm !== originalId) { apiPayload['restaurant_id'] = idInForm; changedFields = true; } } if (validationFailed) { setIsSaving(false); return; } if (!changedFields) { handleCancelEdit(rowId); setIsSaving(false); return; } console.log(`[useAdminTableState handleSaveEdit] Sending payload for ${type} ${rowId}:`, apiPayload); try { const response = await adminService.updateResource(type, rowId, apiPayload); if (!response.success) { throw new Error(response.error || response.message || `Failed to save ${type}.`); } setUpdatedData((prevData) => { const rowIndex = prevData.findIndex((r) => r.id === rowId); if (rowIndex === -1) return prevData; const newData = [...prevData]; const dataFromServer = response.data || {}; newData[rowIndex] = { ...prevData[rowIndex], ...apiPayload, ...dataFromServer }; return newData; }); handleCancelEdit(rowId); onDataMutated?.(); } catch (err) { console.error(`[useAdminTableState handleSaveEdit Error] Row ${rowId}:`, err); setEditError(err.message || 'Save failed.'); } finally { setIsSaving(false); }
  }, [ updatedData, editFormData, isSaving, editingRowIds, columns, type, adminService, onDataMutated, handleCancelEdit, cities, neighborhoods ]); // Added columns, type

  // ** NEW: List Edit Modal Handlers **
  const handleCloseListEditModal = useCallback(() => {
      setIsListEditModalOpen(false);
      setListToEditData(null);
      setListEditError(null); // Clear modal error on close
  }, []);

  const handleSaveListEdit = useCallback(async (listId, editedListData) => {
       if (!listId || !editedListData || isSaving) return;

       setListEditError(null); // Clear previous modal error
       setIsSaving(true);
       const apiPayload = { ...editedListData }; // Copy data from modal form

       // ** Important: Convert tags string back to array **
       if (typeof apiPayload.tags === 'string') {
           apiPayload.tags = apiPayload.tags.split(',').map(t => t.trim()).filter(Boolean);
       } else if (!Array.isArray(apiPayload.tags)) {
            apiPayload.tags = []; // Default to empty array if not string or array
       }

       // Remove fields that shouldn't be sent directly (or handled by backend)
       delete apiPayload.id;
       delete apiPayload.user_id;
       delete apiPayload.creator_handle;
       delete apiPayload.item_count; // Calculated field
       delete apiPayload.saved_count; // Managed by follow/unfollow
       delete apiPayload.created_at;
       delete apiPayload.updated_at;
       delete apiPayload.is_following;
       delete apiPayload.created_by_user;
       // Keep: name, description, is_public, list_type (read-only?), tags, city_name

        // Basic validation (e.g., name required)
       if (!apiPayload.name || !apiPayload.name.trim()) {
           setListEditError("List name cannot be empty.");
           setIsSaving(false);
           return;
       }
       // Ensure list_type is valid if it was somehow editable (it shouldn't be for existing lists)
        if (apiPayload.list_type && !['restaurant', 'dish'].includes(apiPayload.list_type)) {
             setListEditError("Invalid list type.");
             setIsSaving(false);
             return;
        }

       console.log(`[useAdminTableState handleSaveListEdit] Sending payload for list ${listId}:`, apiPayload);

       try {
            const response = await adminService.updateResource('lists', listId, apiPayload);
            if (!response.success) {
                throw new Error(response.error || response.message || 'Failed to save list changes.');
            }
            handleCloseListEditModal(); // Close modal on success
            onDataMutated?.(); // Trigger refetch
       } catch(err) {
           console.error(`[useAdminTableState handleSaveListEdit Error] List ${listId}:`, err);
           setListEditError(err.message || 'Failed to save changes.'); // Set modal-specific error
       } finally {
           setIsSaving(false);
       }

  }, [isSaving, handleCloseListEditModal, onDataMutated]); // Dependencies


  // Bulk Edit Handlers (Keep as before)
  const handleBulkEdit = useCallback(() => { /* ... */ }, [selectedRows, updatedData, handleStartEdit, isAdding, editingRowIds.size]);
  const handleCancelBulkEdit = useCallback(() => { /* ... */ }, [selectedRows]);
  const handleSaveAllEdits = useCallback(async () => { /* ... */ }, [ isBulkEditing, isSaving, editingRowIds, selectedRows, updatedData, editFormData, columns, type, adminService, onDataMutated, handleCancelEdit, handleCancelBulkEdit, cities, neighborhoods ]); // Added columns

  // Action Cell Handlers (Keep as before)
  const handleDeleteClick = useCallback((id, itemType) => { /* ... */ }, []);
  const handleDeleteConfirm = useCallback(async () => { /* ... */ }, [confirmDeleteInfo, actionState.deletingId, adminService, onDataMutated]);
  const handleApprove = useCallback(async (submissionId) => { /* ... */ }, [actionState.approvingId, actionState.rejectingId, adminService, onDataMutated]);
  const handleReject = useCallback(async (submissionId) => { /* ... */ }, [actionState.approvingId, actionState.rejectingId, adminService, onDataMutated]);

  return {
    // Existing state and handlers...
    editingRowIds, editFormData, editError, isSaving, actionState, error, confirmDeleteInfo, isAdding,
    selectedRows, isBulkEditing, bulkSaveError, updatedData, handleRowDataChange, handleStartEdit,
    handleCancelEdit, handleSaveEdit, handleStartAdd, handleCancelAdd, handleSaveNewRow,
    handleDeleteClick, handleDeleteConfirm, setConfirmDeleteInfo, handleApprove, handleReject,
    setSelectedRows, handleBulkEdit, handleCancelBulkEdit, handleSaveAllEdits, setError,
    setEditError, setActionState, setEditingRowIds,

    // ** NEW state and handlers for List Edit Modal **
    isListEditModalOpen,
    listToEditData,
    listEditError, // Specific error for the modal
    handleCloseListEditModal,
    handleSaveListEdit, // Pass this to the modal component
  };
};