/* src/pages/AdminPanel/AdminTable.jsx */
import React, { useCallback, useState, useMemo, useEffect } from 'react';
import Button from '@/components/Button.jsx';
import { Edit, Trash2, ArrowDown, ArrowUp, Loader2, Check, Save, XCircle as CancelIcon } from 'lucide-react';
import apiClient from '@/services/apiClient';
import ErrorMessage from '@/components/UI/ErrorMessage.jsx'; // Corrected import path

// --- Helper Functions ---
const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        return date.toLocaleString(undefined, {
            dateStyle: 'short',
            timeStyle: 'short',
        });
    } catch (e) {
        return 'Invalid Date';
    }
};

// --- Standalone Render Helper for Cell Content ---
// Renders either the display value or an input field if editing
const RenderEditableCell = React.memo(({ row, col, editingRowId, editFormData, isSaving, handleEditInputChange }) => {
    const isEditingThisRow = editingRowId === row.id;
    const { key, render, inputType = 'text', options = [] } = col;
    const value = row[key];

    if (isEditingThisRow && col.editable) {
        const editValue = editFormData[key] ?? '';

        if (inputType === 'textarea') {
            return (
                <textarea
                    value={editValue}
                    onChange={handleEditInputChange}
                    name={key}
                    className="w-full p-1 border border-blue-300 rounded text-xs"
                    rows={3}
                    disabled={isSaving}
                    aria-label={`Edit ${col.header}`}
                />
            );
        } else if (inputType === 'select') {
            return (
                <select
                    value={editValue}
                    onChange={handleEditInputChange}
                    name={key}
                    className="w-full p-1 border border-blue-300 rounded text-xs bg-white"
                    disabled={isSaving}
                    aria-label={`Edit ${col.header}`}
                >
                    {options.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            );
        } else if (inputType === 'boolean') {
             // Use radio buttons or a toggle switch for boolean
             return (
                 <div className="flex items-center gap-2">
                      <label className="flex items-center text-xs">
                          <input type="radio" name={key} value="true" checked={String(editValue) === 'true'} onChange={handleEditInputChange} disabled={isSaving} className="mr-1"/> True
                      </label>
                       <label className="flex items-center text-xs">
                          <input type="radio" name={key} value="false" checked={String(editValue) === 'false'} onChange={handleEditInputChange} disabled={isSaving} className="mr-1"/> False
                      </label>
                 </div>
             );
        }
        // Default to text input
        return (
            <input
                type={inputType}
                value={editValue}
                onChange={handleEditInputChange}
                name={key}
                className="w-full p-1 border border-blue-300 rounded text-xs"
                disabled={isSaving}
                aria-label={`Edit ${col.header}`}
            />
        );
    }

    // Display value (using render function if provided)
    return render ? render(value, row) : (value ?? 'N/A');
});

// --- Column Configuration ---
const baseColumns = [
    { key: 'id', header: 'ID', sortable: true },
    { key: 'created_at', header: 'Created', sortable: true, render: formatDateTime },
];

const columnConfig = {
    submissions: [
        ...baseColumns.filter(c => c.key !== 'id'), // Hide ID for submissions maybe?
        { key: 'user_handle', header: 'User', sortable: true },
        { key: 'type', header: 'Type', sortable: true },
        { key: 'name', header: 'Name', sortable: true, editable: true },
        { key: 'location', header: 'Location', editable: true, inputType: 'textarea' },
        { key: 'city', header: 'City', sortable: true, editable: true },
        { key: 'neighborhood', header: 'Neighborhood', sortable: true, editable: true },
        { key: 'tags', header: 'Tags', editable: true, render: (tags) => Array.isArray(tags) ? tags.join(', ') : '' },
        { key: 'place_id', header: 'Place ID', editable: true },
        { key: 'restaurant_name', header: 'Restaurant', editable: true }, // For dish submissions
        { key: 'status', header: 'Status', sortable: true }, // Status is changed via actions
        { key: 'actions', header: 'Actions' },
    ],
    restaurants: [
        ...baseColumns,
        { key: 'name', header: 'Name', sortable: true, editable: true },
        { key: 'city_name', header: 'City', sortable: true, editable: true },
        { key: 'neighborhood_name', header: 'Neighborhood', sortable: true, editable: true },
        { key: 'address', header: 'Address', editable: true, inputType: 'textarea', className: 'min-w-[200px]' },
        { key: 'tags', header: 'Tags', editable: true, render: (tags) => Array.isArray(tags) ? tags.join(', ') : '' },
        { key: 'adds', header: 'Adds', sortable: true },
        { key: 'actions', header: 'Actions' },
    ],
    dishes: [
        ...baseColumns,
        { key: 'name', header: 'Name', sortable: true, editable: true },
        { key: 'restaurant_name', header: 'Restaurant', sortable: true }, // Display only
        { key: 'city_name', header: 'City', sortable: true },
        { key: 'neighborhood_name', header: 'Neighborhood', sortable: true },
        { key: 'tags', header: 'Tags', editable: true, render: (tags) => Array.isArray(tags) ? tags.join(', ') : '' },
        { key: 'adds', header: 'Adds', sortable: true },
        { key: 'actions', header: 'Actions' },
    ],
    lists: [
        ...baseColumns,
        { key: 'name', header: 'Name', sortable: true, editable: true },
        { key: 'creator_handle', header: 'Creator', sortable: true },
        { key: 'description', header: 'Description', editable: true, inputType: 'textarea', className: 'min-w-[250px]' },
        { key: 'list_type', header: 'Type', sortable: true, editable: true, inputType: 'select', options: [{value: 'mixed', label: 'Mixed'}, {value: 'restaurant', label: 'Restaurant'}, {value: 'dish', label: 'Dish'}] },
        { key: 'item_count', header: 'Items', sortable: true },
        { key: 'saved_count', header: 'Saves', sortable: true },
        { key: 'is_public', header: 'Public', sortable: true, editable: true, inputType: 'boolean', render: (val) => String(val) },
        { key: 'tags', header: 'Tags', editable: true, render: (tags) => Array.isArray(tags) ? tags.join(', ') : '' },
        { key: 'city_name', header: 'City', sortable: true, editable: true },
        { key: 'actions', header: 'Actions' },
    ],
    hashtags: [
        ...baseColumns,
        { key: 'name', header: 'Name', sortable: true, editable: true },
        { key: 'category', header: 'Category', sortable: true, editable: true },
        { key: 'actions', header: 'Actions' },
    ],
    users: [
        ...baseColumns,
        { key: 'username', header: 'Username', sortable: true, editable: true },
        { key: 'email', header: 'Email', sortable: true, editable: true },
        { key: 'account_type', header: 'Type', sortable: true, editable: true, inputType: 'select', options: [{value: 'user', label: 'User'}, {value: 'contributor', label: 'Contributor'}, {value: 'superuser', label: 'Superuser'}] },
        { key: 'actions', header: 'Actions' },
    ],
};
const ALLOWED_MUTATE_TYPES = ['submissions', 'restaurants', 'dishes', 'lists', 'hashtags', 'users'];
const ALLOWED_EDIT_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags', 'users']; // Submissions approved/rejected via actions

// --- Main Component ---
const AdminTable = ({
  data = [], type = 'submissions', sort, onSortChange, onDataMutated, isLoading = false,
}) => {
  // State
  const [editingRowId, setEditingRowId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editError, setEditError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionState, setActionState] = useState({ deletingId: null, approvingId: null, rejectingId: null });
  const [error, setError] = useState(null); // For delete/approve/reject errors

  // Memos
  const currentColumns = useMemo(() => columnConfig[type] || [], [type]);
  const canMutate = useMemo(() => ALLOWED_MUTATE_TYPES.includes(type), [type]);
  const canEdit = useMemo(() => ALLOWED_EDIT_TYPES.includes(type), [type]);
  const currentSortColumn = useMemo(() => sort?.split('_')[0] || '', [sort]);
  const currentSortDirection = useMemo(() => sort?.split('_')[1] || 'desc', [sort]);

  // Clear edit state when data changes (e.g., after mutation)
   useEffect(() => {
       setEditingRowId(null);
       setEditFormData({});
       setEditError(null);
   }, [data]);

  // Callbacks
  const handleCancelEdit = useCallback(() => {
    setEditingRowId(null);
    setEditFormData({});
    setEditError(null);
  }, []);

  const handleSortClick = useCallback((key) => {
    if (!onSortChange || !key || !type) return;
    if (editingRowId) handleCancelEdit(); // Cancel edit if sorting
    const newDirection = (currentSortColumn === key && currentSortDirection === 'asc') ? 'desc' : 'asc';
    onSortChange(type, key, newDirection);
  }, [onSortChange, type, currentSortColumn, currentSortDirection, editingRowId, handleCancelEdit]);

  const handleStartEdit = useCallback((row) => {
    if (isSaving || actionState.deletingId || actionState.approvingId || actionState.rejectingId) return;
    if (editingRowId) handleCancelEdit(); // Cancel previous edit first
    setEditingRowId(row.id);
    // Initialize form data with only editable fields
    const initialData = {};
    currentColumns.forEach(col => {
        if (col.editable) {
             initialData[col.key] = row[col.key] ?? ''; // Use empty string for null/undefined
             // Handle boolean specifically for radio buttons later
             if (col.inputType === 'boolean') {
                 initialData[col.key] = String(row[col.key] ?? false);
             } else if (col.key === 'tags' && Array.isArray(row[col.key])) {
                 initialData[col.key] = row[col.key].join(', '); // Convert array to comma-separated string for input
             } else {
                 initialData[col.key] = row[col.key] ?? '';
             }
        }
    });
    setEditFormData(initialData);
    setEditError(null); // Clear previous edit errors
  }, [isSaving, actionState, editingRowId, handleCancelEdit, currentColumns]); // Added currentColumns dependency

   const handleEditInputChange = useCallback((event) => {
       const { name, value, type, checked } = event.target;
       setEditFormData(prev => ({
           ...prev,
           // Handle checkboxes/radio buttons if needed here
            [name]: type === 'checkbox' ? checked : value,
       }));
       setEditError(null); // Clear error on input change
   }, []);

   // Moved handleSaveEdit definition before handleEdit
   const handleSaveEdit = useCallback(async () => {
    if (!editingRowId || isSaving) return;
    setEditError(null); setIsSaving(true);
    const originalRow = data.find(row => row.id === editingRowId);
    if (!originalRow) { setEditError("Error: Original data not found."); setIsSaving(false); return; }

    const changes = {};
    Object.keys(editFormData).forEach(key => {
        let originalValue = originalRow[key];
        let editedValue = editFormData[key];

        // Find column config to check input type
        const colConfig = currentColumns.find(c => c.key === key);

         // Convert boolean strings back to booleans for comparison/saving
        if (colConfig?.inputType === 'boolean') {
            editedValue = editedValue === 'true'; // Convert string 'true'/'false' to boolean
            originalValue = originalValue ?? false; // Default original boolean to false if null/undefined
        }

        // Handle tags - convert string back to array for comparison/saving
        if (key === 'tags') {
            const originalTags = Array.isArray(originalValue) ? originalValue.sort() : [];
            const editedTags = typeof editedValue === 'string'
                 ? editedValue.split(',').map(t => t.trim()).filter(Boolean).sort()
                 : [];
             // Compare sorted arrays as strings
             if (JSON.stringify(originalTags) === JSON.stringify(editedTags)) {
                 return; // Skip if tags haven't changed
             }
             // Use the array for the changes payload
             changes[key] = editedTags;
             return; // Move to next key
        }

        // Compare values (treat null/undefined as empty string for comparison)
        if (String(originalValue ?? '') === String(editedValue ?? '')) {
            return; // Skip if value hasn't changed
        }

        // If we reach here, the value has changed
        changes[key] = editedValue;
    });

    if (Object.keys(changes).length === 0) {
        console.log("No changes detected.");
        handleCancelEdit(); // No changes, just cancel edit mode
        return;
    }

    console.log(`Saving changes for ${type} ID ${editingRowId}:`, changes);
    try {
        const response = await apiClient(`/api/admin/${type}/${editingRowId}`, `Admin Update ${type}`, { method: 'PUT', body: JSON.stringify(changes) });

        if (!response.success) {
             // Use the error from the response if available
             throw new Error(response.error || `Failed to save ${type}.`);
        }
        onDataMutated?.();
        handleCancelEdit(); // Exit edit mode on successful save
    } catch (err) {
        console.error(`Save failed for ${type} ID ${editingRowId}:`, err);
         let message = 'Unknown error'; // Default message
         if (err instanceof Error) {
             // Check for nested error response structure from apiClient
             if (typeof err.response === 'object' && err.response !== null && typeof err.response.error === 'string') {
                  message = err.response.error;
             } else if (err.message) { // Use direct message if no nested error found
                  message = err.message;
             }
         } else if (typeof err === 'string') { // Handle plain string errors
             message = err;
         }
        setEditError(`Save failed: ${message}`);
    } finally {
        setIsSaving(false);
    }
   }, [editingRowId, editFormData, data, type, onDataMutated, handleCancelEdit, isSaving, currentColumns]); // Added currentColumns dependency

  // Combined Edit button handler - Now defined *after* handleSaveEdit
  const handleEdit = useCallback((item) => {
     if (editingRowId === item.id) {
          // If clicking Edit again on the same row, treat as Save
          handleSaveEdit();
     } else {
          handleStartEdit(item);
     }
   }, [handleStartEdit, handleSaveEdit, editingRowId]);


    const handleApprove = useCallback(async (id) => {
        if (actionState.approvingId || actionState.rejectingId || actionState.deletingId) return;
        setActionState(prev => ({ ...prev, approvingId: id }));
        setError(null);
        try {
            const response = await apiClient(`/api/admin/submissions/${id}/approve`, 'Admin Approve Submission', { method: 'POST' });
            if (!response.success) { throw new Error(response.error || 'Approval failed.'); }
            onDataMutated?.(); // Refresh data
        } catch (err) {
            console.error(`Approve failed for submission ID ${id}:`, err);
            setError(err.message || 'Failed to approve submission.');
        } finally {
            setActionState(prev => ({ ...prev, approvingId: null }));
        }
    }, [onDataMutated, actionState]); // Added actionState

    const handleReject = useCallback(async (id) => {
         if (actionState.approvingId || actionState.rejectingId || actionState.deletingId) return;
         setActionState(prev => ({ ...prev, rejectingId: id }));
         setError(null);
        try {
            const response = await apiClient(`/api/admin/submissions/${id}/reject`, 'Admin Reject Submission', { method: 'POST' });
            if (!response.success) { throw new Error(response.error || 'Rejection failed.'); }
            onDataMutated?.(); // Refresh data
        } catch (err) {
            console.error(`Reject failed for submission ID ${id}:`, err);
            setError(err.message || 'Failed to reject submission.');
        } finally {
            setActionState(prev => ({ ...prev, rejectingId: null }));
        }
    }, [onDataMutated, actionState]); // Added actionState

    const handleDelete = useCallback(async (id) => {
        if (!canMutate || actionState.deletingId || actionState.approvingId || actionState.rejectingId) return;
        if (!window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)} (ID: ${id})? This action cannot be undone.`)) {
            return;
        }
        setActionState(prev => ({ ...prev, deletingId: id }));
        setError(null);
        try {
            const response = await apiClient(`/api/admin/${type}/${id}`, `Admin Delete ${type}`, { method: 'DELETE' });
            if (response.success === false) {
                throw new Error(response.error || 'Deletion request failed.');
            }
            onDataMutated?.(); // Refresh data
        } catch (err) { // Catch block already handles Error or other types
            console.error(`Delete failed for ${type} ID ${id}:`, err);
            // FIX: Use JavaScript property access and type checking instead of 'as any'
            if (err instanceof Error && err.code === '23503') {
                 setError(`Cannot delete ${type.slice(0, -1)}: It is referenced by other items.`);
            } else {
                 setError(err instanceof Error ? err.message : `Failed to delete ${type.slice(0, -1)}.`);
            }
        } finally {
            setActionState(prev => ({ ...prev, deletingId: null }));
        }
    }, [canMutate, onDataMutated, type, actionState]); // Added actionState


  // --- Main Render ---
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm relative">
      {/* Loading Overlay - consider more subtle loading */}
      {isLoading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-20">
              <Loader2 className="animate-spin h-6 w-6 text-[#A78B71]" />
          </div>
      )}
      {/* General Error Display */}
       {error && (
            <div className="p-3 border-b border-red-200 bg-red-50 text-center">
                <ErrorMessage message={error} onRetry={() => setError(null)} containerClassName='!p-0 !max-w-full' />
            </div>
       )}
      <table className="min-w-full bg-white text-sm table-auto">
        <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
          <tr>
            {currentColumns.map((col) => (
              <th key={col.key} className={`px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider ${col.headerClassName || ''} ${col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                  onClick={col.sortable ? () => handleSortClick(col.key) : undefined}
                  aria-sort={col.sortable ? (currentSortColumn === col.key ? (currentSortDirection === 'asc' ? 'ascending' : 'descending') : 'none') : undefined}
              >
                <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                        <span className="opacity-40 group-hover:opacity-100 transition-opacity">
                            {currentSortColumn === col.key ? (currentSortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowDown size={12} className="opacity-50" />}
                        </span>
                    )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {!data || data.length === 0 ? (
             <tr><td colSpan={currentColumns.length} className="text-center text-gray-500 py-8 italic">No {type} found.</td></tr>
          ) : (
             data.map((row) => {
                 const isEditingThisRow = editingRowId === row.id;
                 const isDeletingThisRow = actionState.deletingId === row.id;
                 const isApprovingThisRow = actionState.approvingId === row.id;
                 const isRejectingThisRow = actionState.rejectingId === row.id;
                 const isProcessingAction = isDeletingThisRow || isApprovingThisRow || isRejectingThisRow;

                 return (
                     <tr key={row.id} className={`${isEditingThisRow ? 'bg-blue-50' : 'hover:bg-gray-50'} ${isProcessingAction ? 'opacity-60' : ''} transition-colors duration-150`}>
                     {currentColumns.map((col) => {
                         // --- Actions Column ---
                         if (col.key === 'actions') {
                             return (
                                 <td key={col.key} className={`px-3 py-2 whitespace-nowrap align-top ${col?.className || ''}`}>
                                     <div className="flex items-center gap-1.5">
                                         {isEditingThisRow ? (
                                             <>
                                                 <Button size="sm" variant="primary" onClick={handleSaveEdit} disabled={isSaving} className="!p-1.5" title="Save Changes">
                                                     {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={14} />}
                                                 </Button>
                                                 <Button size="sm" variant="tertiary" onClick={handleCancelEdit} disabled={isSaving} className="!p-1.5 text-gray-600" title="Cancel Edit">
                                                     <CancelIcon size={14} />
                                                 </Button>
                                             </>
                                         ) : (
                                             <>
                                                 {/* Standard Actions */}
                                                 {canEdit && (
                                                      <Button size="sm" variant="tertiary" onClick={() => handleEdit(row)} disabled={isProcessingAction} className="!p-1.5" title="Edit Row">
                                                          <Edit size={14} />
                                                      </Button>
                                                 )}
                                                 {canMutate && type !== 'submissions' && ( // Delete for non-submissions
                                                      <Button size="sm" variant="tertiary" onClick={() => handleDelete(row.id)} disabled={isProcessingAction} className="!p-1.5 text-red-500 hover:text-red-700" title="Delete Row">
                                                           {isDeletingThisRow ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={14} />}
                                                      </Button>
                                                 )}
                                                 {/* Submission specific actions */}
                                                 {type === 'submissions' && row.status === 'pending' && (
                                                     <>
                                                         <Button size="sm" variant="tertiary" onClick={() => handleApprove(row.id)} disabled={isProcessingAction} className="!p-1.5 text-green-600 hover:text-green-800" title="Approve Submission">
                                                             {isApprovingThisRow ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check size={14} />}
                                                         </Button>
                                                         <Button size="sm" variant="tertiary" onClick={() => handleReject(row.id)} disabled={isProcessingAction} className="!p-1.5 text-red-500 hover:text-red-700" title="Reject Submission">
                                                              {isRejectingThisRow ? <Loader2 className="h-4 w-4 animate-spin" /> : <CancelIcon size={14} />}
                                                         </Button>
                                                     </>
                                                 )}
                                             </>
                                         )}
                                     </div>
                                      {/* Display edit error inline */}
                                     {isEditingThisRow && editError && (
                                         <p className="text-xs text-red-600 mt-1" role="alert">{editError}</p>
                                     )}
                                 </td>
                             );
                         }
                         // --- Normal/Editable Cell ---
                         return (
                           <td key={col.key} className={`px-3 py-2 align-top ${col?.className || ''} ${isEditingThisRow && col.editable ? 'py-1' : ''}`}>
                               <RenderEditableCell
                                   row={row} col={col} editingRowId={editingRowId} editFormData={editFormData}
                                   isSaving={isSaving} handleStartEdit={handleStartEdit} handleEditInputChange={handleEditInputChange}
                               />
                           </td>
                         );
                     })}
                     </tr>
                 );
             })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(AdminTable);