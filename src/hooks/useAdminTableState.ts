// src/hooks/useAdminTableState.ts
import { useState, useCallback, useMemo, useEffect, Dispatch, SetStateAction } from 'react'; // Add useEffect import
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminService } from '@/services/adminService';
import apiClient from '@/services/apiClient';

// Import necessary types
import type { City, Neighborhood } from '@/types/Filters';
import type { Restaurant } from '@/types/Restaurant';
import type { Dish } from '@/types/Dish';
import type { List } from '@/types/List';
import type { User } from '@/types/User';
import type { Hashtag } from '@/doof-backend/models/hashtagModel';
import type { Submission } from '@/types/Submission';

// Define generic type for row data
type RowData =
  | (Restaurant & { city_name?: string; neighborhood_name?: string })
  | (Dish & { restaurant_name?: string })
  | (List & { creator_handle?: string; item_count?: number })
  | (User & { username: string; email: string; account_type: string })
  | (Hashtag & { category?: string })
  | (Submission & { user_handle?: string })
  | (Neighborhood & { city_name?: string; zipcode_ranges?: string[] });

// Define type for column configuration
type ColumnConfig = {
  key: string;
  editable?: boolean;
  inputType?: string;
  required?: boolean;
  header?: string;
};

// Define type for ActionCell state
interface ActionState {
  deletingId: number | string | null;
  approvingId: number | string | null;
  rejectingId: number | string | null;
}

// Define type for confirmation dialog state
interface ConfirmDeleteInfo {
  isOpen: boolean;
  id: number | string | null;
  itemType: string;
}

// Define Props for the hook
interface UseAdminTableStateProps {
  initialData?: RowData[];
  type: string;
  columns?: ColumnConfig[];
  cities?: City[];
  neighborhoods?: Neighborhood[];
  onDataMutated?: () => void;
}

// Define the structure of the return value
interface UseAdminTableStateReturn {
  editingRowIds: Set<number | string>;
  editFormData: Record<string | number, Record<string, any>>;
  editError: string | null;
  isSaving: boolean;
  actionState: ActionState;
  error: string | null;
  confirmDeleteInfo: ConfirmDeleteInfo;
  isAdding: boolean;
  selectedRows: Set<number | string>;
  isBulkEditing: boolean;
  bulkSaveError: string | null;
  updatedData: RowData[];
  handleRowDataChange: (rowId: number | string | '__NEW_ROW__', changes: Record<string, any>) => void;
  handleStartEdit: (row: RowData) => void;
  handleCancelEdit: (rowId: number | string) => void;
  handleSaveEdit: (rowId: number | string) => Promise<void>;
  handleStartAdd: () => void;
  handleCancelAdd: () => void;
  handleSaveNewRow: () => Promise<void>;
  handleDeleteClick: (rowId: number | string, itemType: string) => void;
  handleDeleteConfirm: () => Promise<void>;
  setConfirmDeleteInfo: Dispatch<SetStateAction<ConfirmDeleteInfo>>;
  handleApprove: (submissionId: number | string) => Promise<void>;
  handleReject: (submissionId: number | string) => Promise<void>;
  setSelectedRows: Dispatch<SetStateAction<Set<number | string>>>;
  handleBulkEdit: () => void;
  handleCancelBulkEdit: () => void;
  handleSaveAllEdits: () => Promise<void>;
  setError: Dispatch<SetStateAction<string | null>>;
  setEditError: Dispatch<SetStateAction<string | null>>;
  setActionState: Dispatch<SetStateAction<ActionState>>;
  setEditingRowIds: Dispatch<SetStateAction<Set<number | string>>>;
}

// Helper to parse zip codes
const parseZipcodeRanges = (value: unknown): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((zip) => zip.trim()).filter(Boolean);
  }
  return [];
};

export const useAdminTableState = ({
  initialData = [],
  type,
  columns = [],
  cities = [],
  neighborhoods = [],
  onDataMutated,
}: UseAdminTableStateProps): UseAdminTableStateReturn => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [editingRowIds, setEditingRowIds] = useState<Set<number | string>>(new Set());
  const [editFormData, setEditFormData] = useState<Record<string | number, Record<string, any>>>({});
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [actionState, setActionState] = useState<ActionState>({ deletingId: null, approvingId: null, rejectingId: null });
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteInfo, setConfirmDeleteInfo] = useState<ConfirmDeleteInfo>({ isOpen: false, id: null, itemType: '' });
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<Set<number | string>>(new Set());
  const [isBulkEditing, setIsBulkEditing] = useState<boolean>(false);
  const [bulkSaveError, setBulkSaveError] = useState<string | null>(null);
  const [updatedData, setUpdatedData] = useState<RowData[]>(initialData);

  // Update updatedData when initialData changes
  useEffect(() => {
    setUpdatedData(initialData);
  }, [initialData]);

  // --- State Update Handlers ---
  const handleRowDataChange = useCallback(
    (rowId: number | string | '__NEW_ROW__', changes: Record<string, any>) => {
      setEditFormData((prev) => {
        const currentData = prev[rowId] || {};
        const newData = { ...currentData, ...changes };
        if (JSON.stringify(currentData) === JSON.stringify(newData)) {
          return prev;
        }
        console.log(`[useAdminTableState] handleRowDataChange for row ${rowId}:`, changes);
        return { ...prev, [rowId]: newData };
      });

      // Update updatedData immediately to reflect changes in the table
      if (rowId !== '__NEW_ROW__') {
        setUpdatedData((prevData) => {
          const rowIndex = prevData.findIndex((row) => row.id === rowId);
          if (rowIndex === -1) return prevData;
          const updatedRow = { ...prevData[rowIndex], ...changes };
          const newData = [...prevData];
          newData[rowIndex] = updatedRow;
          console.log(`[useAdminTableState] Updated data for row ${rowId}:`, updatedRow);
          return newData;
        });
      }

      setEditError(null);
      setBulkSaveError(null);
    },
    []
  );

  // --- Edit Mode Toggles ---
  const handleStartEdit = useCallback(
    (row: RowData) => {
      if (!row || row.id == null) return;
      const initialData: Record<string, any> = {};
      columns.forEach((col) => {
        if (col.editable && col.key !== 'select' && col.key !== 'actions') {
          let initialValue: any;
          if (col.inputType === 'boolean') {
            initialValue = String(row[col.key] ?? false);
          } else if ((col.key === 'tags' || col.key === 'zipcode_ranges') && Array.isArray(row[col.key])) {
            initialValue = row[col.key].join(', ');
          } else {
            initialValue = row[col.key] ?? '';
          }
          initialData[col.key] = initialValue;
        }
      });
      if ('city_id' in row) initialData.city_id = row.city_id;
      if ('city_name' in row) initialData.city_name = row.city_name;
      if ('neighborhood_id' in row) initialData.neighborhood_id = row.neighborhood_id;
      if ('neighborhood_name' in row) initialData.neighborhood_name = row.neighborhood_name;

      console.log(`[useAdminTableState] StartEdit Row ${row.id}`, initialData);
      setEditFormData((prev) => ({ ...prev, [row.id]: initialData }));
      setEditingRowIds((prev) => new Set(prev).add(row.id));
      setEditError(null);
    },
    [columns]
  );

  const handleCancelEdit = useCallback((rowId: number | string) => {
    setEditingRowIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(rowId);
      return newSet;
    });
    setEditFormData((prev) => {
      const newData = { ...prev };
      delete newData[rowId];
      return newData;
    });
    setEditError(null);
  }, []);

  // --- Add Row Handlers ---
  const handleStartAdd = useCallback(() => {
    setIsAdding(true);
    setEditFormData((prev) => ({ ...prev, '__NEW_ROW__': {} }));
    setEditError(null);
    setError(null);
  }, []);

  const handleCancelAdd = useCallback(() => {
    setIsAdding(false);
    setEditFormData((prev) => {
      const nextState = { ...prev };
      delete nextState['__NEW_ROW__'];
      return nextState;
    });
    setError(null);
  }, []);

  const handleSaveNewRow = useCallback(async () => {
    if (isSaving) return;
    setError(null);
    setIsSaving(true);

    const newRowData = editFormData['__NEW_ROW__'] || {};
    const payload: Record<string, any> = {};
    let validationError: string | null = null;

    for (const col of columns) {
      if (col.editable) {
        let value = newRowData[col.key];
        if (col.inputType === 'boolean') {
          payload[col.key] = String(value) === 'true';
        } else if ((col.key === 'tags' || col.key === 'zipcode_ranges') && typeof value === 'string') {
          payload[col.key] = value.split(',').map((t) => t.trim()).filter(Boolean);
        } else if (col.inputType === 'number' || col.inputType === 'city_select' || col.inputType === 'neighborhood_select') {
          const numValue = value === '' || value === null || value === undefined ? null : parseInt(String(value), 10);
          if (numValue !== null && isNaN(numValue)) {
            validationError = `Invalid number for ${col.header}.`;
            break;
          }
          if (col.required && numValue === null) {
            validationError = `${col.header} is required.`;
            break;
          }
          payload[col.key] = numValue;
        } else if (typeof value === 'string') {
          payload[col.key] = value.trim() || null;
        } else {
          payload[col.key] = value ?? null;
        }
        if (col.required && (payload[col.key] === null || payload[col.key] === '')) {
          validationError = `${col.header} is required.`;
          break;
        }
      }
    }

    if (!validationError) {
      if (type !== 'submissions' && (!payload.name || String(payload.name).trim() === '')) {
        validationError = `Name is required.`;
      }
      if (type === 'dishes' && (!payload.restaurant_id || payload.restaurant_id <= 0)) {
        validationError = 'Valid Restaurant ID required.';
      }
      if (type === 'neighborhoods' && (!payload.city_id || payload.city_id <= 0)) {
        validationError = 'Valid City ID required.';
      }
      if (type === 'users' && (!payload.username || !payload.email || !payload.password)) {
        validationError = 'Username, Email, Password required.';
      }
      if (type === 'restaurants' && (!payload.city_id || payload.city_id <= 0)) {
        validationError = 'Valid City ID required.';
      }
    }

    if (validationError) {
      setError(validationError);
      setIsSaving(false);
      return;
    }

    console.log(`[useAdminTableState] Saving new ${type}:`, payload);

    try {
      const newRow = await adminService.createResource(type, payload);
      setUpdatedData((prev) => [...prev, newRow]);
      onDataMutated?.();
      handleCancelAdd();
    } catch (err) {
      setError((err as Error).message || 'Save failed.');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, editFormData, columns, type, adminService, onDataMutated, handleCancelAdd]);

  // --- Single Row Save ---
  const handleSaveEdit = useCallback(
    async (rowId: number | string) => {
      const row = updatedData.find((r) => r.id === rowId);
      const currentRowFormData = editFormData[rowId];
      if (!row || !editingRowIds.has(rowId) || isSaving || typeof currentRowFormData !== 'object' || currentRowFormData === null) {
        console.warn('Save conditions not met', { rowId, isEditing: editingRowIds.has(rowId), isSaving });
        return;
      }

      setEditError(null);
      setIsSaving(true);
      const changes: Record<string, any> = {};
      let validationFailed = false;

      columns
        .filter((col) => col.editable && col.key !== 'select' && col.key !== 'actions')
        .forEach((col) => {
          const key = col.key;
          let originalValue = row[key];
          let editedValue = currentRowFormData[key];
          let processedEditedValue: any = editedValue;
          let processedOriginalValue: any = originalValue;

          switch (col.key) {
            case 'city_id':
            case 'neighborhood_id':
              processedEditedValue =
                editedValue === '' || editedValue === null || editedValue === undefined ? null : parseInt(String(editedValue), 10);
              processedOriginalValue = originalValue === null || originalValue === undefined ? null : Number(originalValue);
              if (editedValue !== '' && editedValue !== null && editedValue !== undefined && isNaN(processedEditedValue)) {
                if (col.required) {
                  setEditError(`Invalid or missing ID for ${col.header}.`);
                  validationFailed = true;
                }
                processedEditedValue = null;
              }
              if (col.required && processedEditedValue === null) {
                setEditError(`${col.header} is required.`);
                validationFailed = true;
              }
              break;
            case 'tags':
            case 'zipcode_ranges':
              const originalArray =
                col.key === 'zipcode_ranges' ? parseZipcodeRanges(originalValue).sort() : Array.isArray(originalValue) ? [...originalValue].sort() : [];
              const editedArray =
                typeof editedValue === 'string' ? editedValue.split(',').map((t) => t.trim()).filter(Boolean).sort() : [];
              if (JSON.stringify(originalArray) !== JSON.stringify(editedArray)) {
                changes[key] = editedArray;
              }
              return;
            case 'is_public':
              processedEditedValue = String(editedValue) === 'true';
              processedOriginalValue = originalValue ?? false;
              break;
            default:
              processedEditedValue = typeof editedValue === 'string' ? (editedValue.trim() || null) : editedValue ?? null;
              processedOriginalValue = originalValue ?? null;
              if (col.inputType === 'number' && processedEditedValue !== null && isNaN(Number(processedEditedValue))) {
                setEditError(`Invalid number for ${col.header}.`);
                validationFailed = true;
              }
              if (col.required && (processedEditedValue === null || String(processedEditedValue).trim() === '')) {
                setEditError(`${col.header} is required.`);
                validationFailed = true;
              }
              break;
          }
          if (String(processedOriginalValue ?? '') !== String(processedEditedValue ?? '')) {
            changes[key] = processedEditedValue;
            if (key === 'city_id' && changes[key] !== null) {
              const city = cities.find((c) => Number(c.id) === Number(changes[key]));
              if (city && row.city_name !== city.name) changes.city_name = city.name;
              if (row.city_id !== changes[key]) {
                changes.neighborhood_id = null;
                changes.neighborhood_name = null;
              }
            }
            if (key === 'neighborhood_id' && changes[key] !== null) {
              const nb = neighborhoods.find((n) => Number(n.id) === Number(changes[key]));
              if (nb && row.neighborhood_name !== nb.name) changes.neighborhood_name = nb.name;
            }
          }
        });

      if (validationFailed) {
        setIsSaving(false);
        return;
      }
      if (Object.keys(changes).length === 0) {
        handleCancelEdit(rowId);
        setIsSaving(false);
        return;
      }
      if (type === 'restaurants' && !currentRowFormData.city_id && !changes.city_id) {
        setEditError('City ID is required.');
        setIsSaving(false);
        return;
      }

      console.log(`[useAdminTableState] Saving changes for ${type} ${rowId}:`, changes);
      try {
        const updatedRow = await adminService.updateResource(type, rowId, changes);
        setUpdatedData((prevData) => {
          const rowIndex = prevData.findIndex((r) => r.id === rowId);
          if (rowIndex === -1) return prevData;
          const newData = [...prevData];
          newData[rowIndex] = { ...prevData[rowIndex], ...updatedRow };
          return newData;
        });
        handleCancelEdit(rowId);
        onDataMutated?.();
      } catch (err) {
        setEditError((err as Error).message || 'Save failed.');
      } finally {
        setIsSaving(false);
      }
    },
    [updatedData, editFormData, isSaving, editingRowIds, columns, type, adminService, onDataMutated, handleCancelEdit, cities, neighborhoods]
  );

  // --- Bulk Edit Handlers ---
  const handleBulkEdit = useCallback(() => {
    if (selectedRows.size === 0 || isAdding || isSaving || isBulkEditing) return;
    setBulkSaveError(null);
    setEditError(null);
    const newEditingRowIds = new Set(selectedRows);
    const newEditFormData: Record<string | number, Record<string, any>> = {};
    updatedData.forEach((row) => {
      if (selectedRows.has(row.id)) {
        const rowData: Record<string, any> = {};
        columns
          .filter((col) => col.key !== 'select')
          .forEach((col) => {
            if (col.editable) {
              let initialValue: any;
              if (col.inputType === 'boolean') {
                initialValue = String(row[col.key] ?? false);
              } else if ((col.key === 'tags' || col.key === 'zipcode_ranges') && Array.isArray(row[col.key])) {
                initialValue = row[col.key].join(', ');
              } else {
                initialValue = row[col.key] ?? '';
              }
              rowData[col.key] = initialValue;
            }
          });
        if ('city_id' in row) rowData.city_id = row.city_id;
        if ('city_name' in row) rowData.city_name = row.city_name;
        if ('neighborhood_id' in row) rowData.neighborhood_id = row.neighborhood_id;
        if ('neighborhood_name' in row) rowData.neighborhood_name = row.neighborhood_name;
        newEditFormData[row.id] = rowData;
      }
    });
    setEditingRowIds(newEditingRowIds);
    setEditFormData(newEditFormData);
    setIsBulkEditing(true);
  }, [selectedRows, isAdding, isSaving, isBulkEditing, updatedData, columns]);

  const handleCancelBulkEdit = useCallback(() => {
    setEditingRowIds(new Set());
    setEditFormData({});
    setEditError(null);
    setIsBulkEditing(false);
    setSelectedRows(new Set());
    setBulkSaveError(null);
  }, []);

  // --- Save All Edits (Bulk Save) ---
  const handleSaveAllEdits = useCallback(async () => {
    if (editingRowIds.size === 0 || isSaving) return;
    setEditError(null);
    setBulkSaveError(null);
    setIsSaving(true);
    let successCount = 0;
    const errorMessages: string[] = [];
    const promises: Promise<void>[] = [];

    editingRowIds.forEach((rowId) => {
      const row = updatedData.find((r) => r.id === rowId);
      const rowFormData = editFormData[rowId] || {};
      if (!row) return;

      const changes: Record<string, any> = {};
      let validationFailedForRow = false;

      columns
        .filter((c) => c.key !== 'select')
        .forEach((col) => {
          if (!col.editable || col.key === 'id') return;
          let originalValue = row[col.key];
          let editedValue = rowFormData[col.key];
          let processedEditedValue: any = editedValue;
          let processedOriginalValue: any = originalValue;

          switch (col.key) {
            case 'city_id':
            case 'neighborhood_id':
              processedEditedValue =
                editedValue === '' || editedValue === null || editedValue === undefined ? null : parseInt(String(editedValue), 10);
              processedOriginalValue = originalValue === null || originalValue === undefined ? null : Number(originalValue);
              if (editedValue !== '' && editedValue !== null && editedValue !== undefined && isNaN(processedEditedValue)) {
                if (col.required) {
                  errorMessages.push(`Row ${rowId}: Invalid ID for ${col.header}.`);
                  validationFailedForRow = true;
                }
                processedEditedValue = null;
              }
              if (col.required && processedEditedValue === null) {
                errorMessages.push(`Row ${rowId}: ${col.header} required.`);
                validationFailedForRow = true;
              }
              break;
            case 'tags':
            case 'zipcode_ranges':
              const originalArray =
                col.key === 'zipcode_ranges' ? parseZipcodeRanges(originalValue).sort() : Array.isArray(originalValue) ? [...originalValue].sort() : [];
              const editedArray =
                typeof editedValue === 'string' ? editedValue.split(',').map((t) => t.trim()).filter(Boolean).sort() : [];
              if (JSON.stringify(originalArray) !== JSON.stringify(editedArray)) {
                changes[col.key] = editedArray;
              }
              return;
            case 'is_public':
              processedEditedValue = String(editedValue) === 'true';
              processedOriginalValue = originalValue ?? false;
              break;
            default:
              processedEditedValue = typeof editedValue === 'string' ? (editedValue.trim() || null) : editedValue ?? null;
              processedOriginalValue = originalValue ?? null;
              if (col.inputType === 'number' && processedEditedValue !== null && isNaN(Number(processedEditedValue))) {
                errorMessages.push(`Row ${rowId}: Invalid number for ${col.header}.`);
                validationFailedForRow = true;
              }
              if (col.required && (processedEditedValue === null || String(processedEditedValue).trim() === '')) {
                errorMessages.push(`Row ${rowId}: ${col.header} required.`);
                validationFailedForRow = true;
              }
              break;
          }
          if (String(processedOriginalValue ?? '') !== String(processedEditedValue ?? '')) {
            changes[col.key] = processedEditedValue;
            if (col.key === 'city_id' && changes[col.key] !== null) {
              const city = cities.find((c) => Number(c.id) === Number(changes[col.key]));
              if (city && row.city_name !== city.name) changes.city_name = city.name;
              if (row.city_id !== changes[col.key]) {
                changes.neighborhood_id = null;
                changes.neighborhood_name = null;
              }
            }
            if (col.key === 'neighborhood_id' && changes[col.key] !== null) {
              const nb = neighborhoods.find((n) => Number(n.id) === Number(changes[col.key]));
              if (nb && row.neighborhood_name !== nb.name) changes.neighborhood_name = nb.name;
            }
          }
        });

      if (validationFailedForRow) {
        console.warn(`[useAdminTableState] Validation failed for row ${rowId}. Skipping save.`);
        return;
      }

      if (Object.keys(changes).length > 0) {
        console.log(`[useAdminTableState] Bulk saving changes for ${type} ID ${rowId}:`, changes);
        promises.push(
          adminService
            .updateResource(type, rowId, changes)
            .then((updatedRow) => {
              setUpdatedData((prevData) => {
                const rowIndex = prevData.findIndex((r) => r.id === rowId);
                if (rowIndex === -1) return prevData;
                const newData = [...prevData];
                newData[rowIndex] = { ...prevData[rowIndex], ...updatedRow };
                return newData;
              });
              successCount++;
            })
            .catch((err) => {
              errorMessages.push(`Row ${rowId}: ${(err as Error).message || 'Save failed'}`);
              if ((err as Error).message?.includes('Authentication required')) navigate('/login');
            })
        );
      } else {
        console.log(`[useAdminTableState] No changes for row ${rowId}. Skipping save.`);
      }
    });

    await Promise.allSettled(promises);
    setIsSaving(false);

    if (errorMessages.length === 0) {
      setEditingRowIds(new Set());
      setEditFormData({});
      setIsBulkEditing(false);
      onDataMutated?.();
      setSelectedRows(new Set());
    } else {
      setBulkSaveError(`Bulk save finished with errors: ${errorMessages.join('; ')}`);
      onDataMutated?.();
    }
  }, [
    editingRowIds,
    isSaving,
    updatedData,
    editFormData,
    type,
    columns,
    adminService,
    onDataMutated,
    navigate,
    cities,
    neighborhoods,
  ]);

  // --- Action Cell Handlers ---
  const handleDeleteClick = useCallback((rowId: number | string, itemType: string) => {
    setConfirmDeleteInfo({ isOpen: true, id: rowId, itemType });
    setError(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    const { id: deleteId, itemType: deleteType } = confirmDeleteInfo;
    if (deleteId && deleteType) {
      setError(null);
      setActionState((prev) => ({ ...prev, deletingId: deleteId }));
      try {
        await adminService.deleteResource(deleteType, deleteId);
        setUpdatedData((prev) => prev.filter((row) => row.id !== deleteId));
        onDataMutated?.();
        queryClient.invalidateQueries({ queryKey: ['adminData', { tab: deleteType }] });
      } catch (err) {
        setError((err as Error).message || `Failed to delete ${deleteType}.`);
        if ((err as Error).message?.includes('Authentication required')) navigate('/login');
      } finally {
        setActionState((prev) => ({ ...prev, deletingId: null }));
        setConfirmDeleteInfo({ isOpen: false, id: null, itemType: '' });
      }
    }
  }, [confirmDeleteInfo, adminService, onDataMutated, queryClient, navigate]);

  const handleApprove = useCallback(
    async (submissionId: number | string) => {
      if (actionState.approvingId || actionState.rejectingId) return;
      setError(null);
      setActionState((prev) => ({ ...prev, approvingId: submissionId }));
      try {
        await apiClient(`/api/admin/submissions/${submissionId}/approve`, `Admin Approve Submission ${submissionId}`, {
          method: 'POST',
        });
        setUpdatedData((prev) => prev.filter((row) => row.id !== submissionId));
        onDataMutated?.();
        queryClient.invalidateQueries({ queryKey: ['adminData', { tab: 'submissions' }] });
      } catch (err) {
        setError((err as Error).message || 'Approval failed.');
      } finally {
        setActionState((prev) => ({ ...prev, approvingId: null }));
      }
    },
    [actionState, apiClient, onDataMutated, queryClient]
  );

  const handleReject = useCallback(
    async (submissionId: number | string) => {
      if (actionState.approvingId || actionState.rejectingId) return;
      setError(null);
      setActionState((prev) => ({ ...prev, rejectingId: submissionId }));
      try {
        await apiClient(`/api/admin/submissions/${submissionId}/reject`, `Admin Reject Submission ${submissionId}`, {
          method: 'POST',
        });
        setUpdatedData((prev) => prev.filter((row) => row.id !== submissionId));
        onDataMutated?.();
        queryClient.invalidateQueries({ queryKey: ['adminData', { tab: 'submissions' }] });
      } catch (err) {
        setError((err as Error).message || 'Rejection failed.');
      } finally {
        setActionState((prev) => ({ ...prev, rejectingId: null }));
      }
    },
    [actionState, apiClient, onDataMutated, queryClient]
  );

  return {
    editingRowIds,
    editFormData,
    editError,
    isSaving,
    actionState,
    error,
    confirmDeleteInfo,
    isAdding,
    selectedRows,
    isBulkEditing,
    bulkSaveError,
    updatedData,
    handleRowDataChange,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleStartAdd,
    handleCancelAdd,
    handleSaveNewRow,
    handleDeleteClick,
    handleDeleteConfirm,
    setConfirmDeleteInfo,
    handleApprove,
    handleReject,
    setSelectedRows,
    handleBulkEdit,
    handleCancelBulkEdit,
    handleSaveAllEdits,
    setError,
    setEditError,
    setActionState,
    setEditingRowIds,
  };
};