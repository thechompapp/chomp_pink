/* src/pages/AdminPanel/AdminTable.jsx */
import React, { useCallback, useState, useMemo, useEffect } from 'react';
import Button from '@/components/UI/Button.jsx'; // Use alias
import Modal from '@/components/UI/Modal.jsx'; // Use alias
// Corrected imports with .jsx extension:
import Input from '@/components/UI/Input.jsx';
import Select from '@/components/UI/Select.jsx';
import ErrorMessage from '@/components/UI/ErrorMessage.jsx'; // Use alias
import ConfirmationDialog from '@/components/UI/ConfirmationDialog.jsx';
// --- End Corrected Imports ---
import { Edit, Trash2, ArrowDown, ArrowUp, Loader2, Check, Save, XCircle as CancelIcon, AlertTriangle, PlusCircle } from 'lucide-react'; // Added PlusCircle
import apiClient from '@/services/apiClient'; // Use alias

// --- Helper Functions ---
const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
        // Use default locale and standard options for better consistency
        return new Date(isoString).toLocaleString(undefined, {
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: '2-digit' // Use 2-digit for minute
        });
    } catch (e) {
        console.error("Error formatting date:", isoString, e); // Log error
        return 'Invalid Date';
    }
};

// --- Standalone Render Helper for Cell Content ---
// Renders either the display value or an input field if editing
// Added isAdding prop to handle the new row state
const RenderEditableCell = React.memo(({ row, col, isAdding = false, editingRowId, editFormData, isSaving, handleEditInputChange }) => {
    const isEditingThisRow = !isAdding && editingRowId === row?.id;
    const { key, render, inputType = 'text', options = [], editable, header } = col; // Destructure header for placeholder

    // Determine the value to display or edit
    // Handle potential null/undefined values gracefully
    const rowValue = row?.[key];
    const addValue = editFormData[key];
    const value = isAdding ? (addValue ?? '') : (rowValue ?? ''); // Default to empty string if null/undefined
    const displayValue = render ? render(value, row) : (value === null || value === undefined ? 'N/A' : String(value)); // Display 'N/A' for null/undefined

    // Render input if adding or editing, and the column is editable
    if ((isAdding || isEditingThisRow) && editable) {
        // Use controlled value from state, default to empty string if null/undefined
        const editValue = isAdding ? (editFormData[key] ?? '') : (editFormData[key] ?? '');

        // --- Input Types ---
        if (inputType === 'textarea') {
            return (
                <textarea
                    value={editValue}
                    onChange={handleEditInputChange}
                    name={key}
                    className="w-full p-1 border border-blue-300 rounded text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-100 disabled:opacity-70"
                    rows={3}
                    disabled={isSaving}
                    aria-label={`Input ${header}`}
                    placeholder={`Enter ${header}...`}
                />
            );
        } else if (inputType === 'select') {
            return (
                <select
                    value={editValue} // Value should match one of the option values
                    onChange={handleEditInputChange}
                    name={key}
                    className="w-full p-1 border border-blue-300 rounded text-xs bg-white focus:ring-1 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-100 disabled:opacity-70"
                    disabled={isSaving}
                    aria-label={`Input ${header}`}
                >
                    {/* Default empty/placeholder option */}
                    <option value="" disabled={col.required}>-- Select {header} --</option>
                    {options.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            );
        } else if (inputType === 'boolean') {
             // Use radio buttons for boolean
             return (
                 <div className="flex items-center gap-3 py-1">
                      <label className="flex items-center text-xs cursor-pointer">
                          <input type="radio" name={key} value="true" checked={String(editValue) === 'true'} onChange={handleEditInputChange} disabled={isSaving} className="mr-1 text-blue-600 focus:ring-blue-500"/> True
                      </label>
                       <label className="flex items-center text-xs cursor-pointer">
                          <input type="radio" name={key} value="false" checked={String(editValue) === 'false'} onChange={handleEditInputChange} disabled={isSaving} className="mr-1 text-blue-600 focus:ring-blue-500"/> False
                      </label>
                 </div>
             );
        } else { // Default to 'text', 'number', 'email' etc.
            return (
                <input
                    type={inputType}
                    value={editValue}
                    onChange={handleEditInputChange}
                    name={key}
                    className="w-full p-1 border border-blue-300 rounded text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-100 disabled:opacity-70"
                    disabled={isSaving}
                    aria-label={`Input ${header}`}
                    placeholder={header || key}
                />
            );
        }
    }

    // Display value if not editing
    // Handle arrays (like tags) specifically for display
    const finalDisplayValue = Array.isArray(value) ? value.join(', ') : displayValue;
    return <span className="block truncate max-w-xs" title={typeof finalDisplayValue === 'string' ? finalDisplayValue : ''}>{finalDisplayValue}</span>;
});


// --- Column Configuration ---
// Defines structure and properties for columns based on data type
// Note: 'key' must match the data field name. 'accessor' is not needed if 'key' is used.
const baseColumns = [
    { key: 'id', header: 'ID', sortable: true, editable: false, className: 'w-16 text-gray-500' }, // Fixed width for ID
    // Removed created_at/updated_at from base to add specifically where needed
];

const columnConfig = {
    submissions: [ // Primarily view/approve/reject
        { key: 'id', header: 'ID', sortable: true, editable: false, className: 'w-16' },
        { key: 'type', header: 'Type', sortable: true, editable: false, className: 'capitalize' },
        { key: 'name', header: 'Name', sortable: true, editable: false },
        { key: 'user_handle', header: 'User', sortable: true, editable: false },
        { key: 'status', header: 'Status', sortable: true, editable: false, className: 'capitalize' },
        { key: 'created_at', header: 'Submitted', sortable: true, editable: false, render: formatDateTime, className: 'w-40' },
        { key: 'reviewed_at', header: 'Reviewed', sortable: true, editable: false, render: formatDateTime, className: 'w-40' },
        { key: 'actions', header: 'Actions', editable: false, className: 'w-28 text-center' }, // Actions column centered
    ],
    restaurants: [
        ...baseColumns,
        { key: 'name', header: 'Name', sortable: true, editable: true },
        { key: 'city_name', header: 'City', sortable: true, editable: true }, // Make editable for adding/fixing
        { key: 'neighborhood_name', header: 'Neighborhood', sortable: true, editable: true }, // Make editable for adding/fixing
        { key: 'address', header: 'Address', sortable: false, editable: true, inputType: 'textarea', className: 'min-w-[200px] whitespace-normal' }, // Allow wrap
        { key: 'tags', header: 'Tags', sortable: false, editable: true, render: (tags) => Array.isArray(tags) ? tags.join(', ') : '', className: 'whitespace-normal' }, // Make editable (string input)
        { key: 'adds', header: 'Adds', sortable: true, editable: false, className: 'w-20' },
        { key: 'created_at', header: 'Created', sortable: true, editable: false, render: formatDateTime, className: 'w-40' },
        { key: 'updated_at', header: 'Updated', sortable: true, editable: false, render: formatDateTime, className: 'w-40' },
        { key: 'actions', header: 'Actions', editable: false, className: 'w-28 text-center' },
    ],
    dishes: [
        ...baseColumns,
        { key: 'name', header: 'Name', sortable: true, editable: true },
        { key: 'restaurant_id', header: 'Restaurant ID', sortable: false, editable: true, inputType: 'number' }, // ID editable for add/edit
        { key: 'restaurant_name', header: 'Restaurant', sortable: true, editable: false }, // Display only
        { key: 'tags', header: 'Tags', sortable: false, editable: true, render: (tags) => Array.isArray(tags) ? tags.join(', ') : '', className: 'whitespace-normal' },
        { key: 'adds', header: 'Adds', sortable: true, editable: false, className: 'w-20' },
        { key: 'created_at', header: 'Created', sortable: true, editable: false, render: formatDateTime, className: 'w-40' },
        { key: 'updated_at', header: 'Updated', sortable: true, editable: false, render: formatDateTime, className: 'w-40' },
        { key: 'actions', header: 'Actions', editable: false, className: 'w-28 text-center' },
    ],
    lists: [
        ...baseColumns,
        { key: 'name', header: 'Name', sortable: true, editable: true },
        { key: 'creator_handle', header: 'Creator', sortable: true, editable: false },
        { key: 'description', header: 'Description', sortable: false, editable: true, inputType: 'textarea', className: 'min-w-[250px] whitespace-normal' }, // Allow wrap
        { key: 'list_type', header: 'Type', sortable: true, editable: true, inputType: 'select', options: [{value: 'mixed', label: 'Mixed'}, {value: 'restaurant', label: 'Restaurant'}, {value: 'dish', label: 'Dish'}], className: 'capitalize' },
        { key: 'item_count', header: 'Items', sortable: true, editable: false, className: 'w-20' },
        { key: 'saved_count', header: 'Saves', sortable: true, editable: false, className: 'w-20' },
        { key: 'is_public', header: 'Public', sortable: true, editable: true, inputType: 'boolean', render: (val) => String(val) }, // Use boolean input type
        { key: 'tags', header: 'Tags', sortable: false, editable: true, render: (tags) => Array.isArray(tags) ? tags.join(', ') : '', className: 'whitespace-normal' },
        { key: 'city_name', header: 'City', sortable: true, editable: true }, // Allow editing city
        { key: 'created_at', header: 'Created', sortable: true, editable: false, render: formatDateTime, className: 'w-40' },
        { key: 'updated_at', header: 'Updated', sortable: true, editable: false, render: formatDateTime, className: 'w-40' },
        { key: 'actions', header: 'Actions', editable: false, className: 'w-28 text-center' },
    ],
    hashtags: [
        ...baseColumns,
        { key: 'name', header: 'Name', sortable: true, editable: true },
        { key: 'category', header: 'Category', sortable: true, editable: true },
        { key: 'created_at', header: 'Created', sortable: true, editable: false, render: formatDateTime, className: 'w-40' },
        { key: 'updated_at', header: 'Updated', sortable: true, editable: false, render: formatDateTime, className: 'w-40' },
        { key: 'actions', header: 'Actions', editable: false, className: 'w-28 text-center' },
    ],
    users: [
        ...baseColumns,
        { key: 'username', header: 'Username', sortable: true, editable: true },
        { key: 'email', header: 'Email', sortable: true, editable: true, inputType: 'email' },
        { key: 'account_type', header: 'Type', sortable: true, editable: true, inputType: 'select', options: [{value: 'user', label: 'User'}, {value: 'contributor', label: 'Contributor'}, {value: 'superuser', label: 'Superuser'}], className: 'capitalize' },
        { key: 'created_at', header: 'Created', sortable: true, editable: false, render: formatDateTime, className: 'w-40' },
        // Updated At doesn't exist on Users table per schema
        { key: 'actions', header: 'Actions', editable: false, className: 'w-28 text-center' },
    ],
    // Neighborhoods Config
     neighborhoods: [
        ...baseColumns,
        { key: 'name', header: 'Name', sortable: true, editable: true },
        { key: 'city_id', header: 'City ID', sortable: false, editable: true, inputType: 'number' }, // Keep editable for add/edit
        { key: 'city_name', header: 'City', sortable: true, editable: false }, // Display only
        { key: 'created_at', header: 'Created', sortable: true, editable: false, render: formatDateTime, className: 'w-40' },
        { key: 'updated_at', header: 'Updated', sortable: true, editable: false, render: formatDateTime, className: 'w-40' },
        { key: 'actions', header: 'Actions', editable: false, className: 'w-28 text-center' },
    ],
};
// Types allowed to have edit/delete/approve/reject actions
const ALLOWED_MUTATE_TYPES = ['submissions', 'restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods']; // Added neighborhoods
// Types allowed to have inline editing
const ALLOWED_EDIT_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods']; // Added neighborhoods
// Types allowed for inline add functionality
const ALLOWED_ADD_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods']; // Added neighborhoods

// --- Main Component ---
const AdminTable = ({
  data = [], type = 'submissions', sort, onSortChange, onDataMutated, isLoading = false,
}) => {
  // State
  const [editingRowId, setEditingRowId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editError, setEditError] = useState(null); // Error specific to the row being edited
  const [isSaving, setIsSaving] = useState(false); // Covers both edit and add saves
  const [actionState, setActionState] = useState({ deletingId: null, approvingId: null, rejectingId: null });
  const [error, setError] = useState(null); // General errors (delete/approve/reject/add)
  const [confirmDeleteInfo, setConfirmDeleteInfo] = useState({ isOpen: false, id: null, itemType: '' });
  const [isAdding, setIsAdding] = useState(false); // State for the add row
  const [newRowData, setNewRowData] = useState({}); // State for the add row's data

  // Memos
  const currentColumns = useMemo(() => columnConfig[type] || [], [type]);
  const canMutate = useMemo(() => ALLOWED_MUTATE_TYPES.includes(type), [type]);
  const canEdit = useMemo(() => ALLOWED_EDIT_TYPES.includes(type), [type]);
  const canAdd = useMemo(() => ALLOWED_ADD_TYPES.includes(type), [type]);
  // Default sort based on type
  const defaultSortColumn = useMemo(() => {
      switch(type) {
          case 'users': return 'id';
          case 'hashtags': return 'name';
          case 'neighborhoods': return 'neighborhoods.name'; // Use qualified name
          default: return 'created_at';
      }
  }, [type]);
  const defaultSortDirection = useMemo(() => ['hashtags', 'neighborhoods'].includes(type) ? 'asc' : 'desc', [type]);

  const currentSortColumn = useMemo(() => sort?.split('_')[0] || defaultSortColumn, [sort, defaultSortColumn]);
  const currentSortDirection = useMemo(() => sort?.split('_')[1] || defaultSortDirection, [sort, defaultSortDirection]);


  // Clear edit/add state when data changes or type changes
   useEffect(() => {
       setEditingRowId(null);
       setEditFormData({});
       setEditError(null);
       setIsAdding(false);
       setNewRowData({});
       setError(null); // Clear general errors too
   }, [data, type]); // Rerun when data or type changes

  // Callbacks
  const handleCancelEdit = useCallback(() => {
    setEditingRowId(null);
    setEditFormData({});
    setEditError(null);
  }, []);

  const handleStartAdd = useCallback(() => {
      if (isAdding || editingRowId !== null) return; // Prevent multiple adds/edits
      handleCancelEdit(); // Ensure any existing edit is cancelled
      setIsAdding(true);
      setError(null); // Clear previous general errors
      // Initialize newRowData with default values based on columns
      const initialData = {};
      currentColumns.forEach(col => {
          if (col.editable) {
               // Default booleans to false string, selects to first option if available, others empty string
               const defaultValue = col.inputType === 'boolean' ? 'false'
                                 : (col.inputType === 'select' && col.options?.length > 0) ? col.options[0].value ?? '' // Use first option's value or empty string
                                 : '';
               initialData[col.key] = defaultValue;
          }
      });
      setNewRowData(initialData);
  }, [currentColumns, handleCancelEdit, isAdding, editingRowId]); // Add dependencies

  const handleCancelAdd = useCallback(() => {
    setIsAdding(false);
    setNewRowData({});
    setError(null); // Clear errors when cancelling add
  }, []);


  const handleSortClick = useCallback((key, sortable) => {
    if (!onSortChange || !key || !type || !sortable) return; // Check if sortable
    // Only cancel if actually editing/adding
    if (editingRowId) handleCancelEdit();
    if (isAdding) handleCancelAdd();
    const newDirection = (currentSortColumn === key && currentSortDirection === 'asc') ? 'desc' : 'asc';
    onSortChange(type, key, newDirection); // Pass the actual column key
  }, [onSortChange, type, currentSortColumn, currentSortDirection, editingRowId, handleCancelEdit, isAdding, handleCancelAdd]);


  const handleStartEdit = useCallback((row) => {
    // Prevent starting edit if another action is in progress OR already adding
    if (isSaving || isAdding || actionState.deletingId || actionState.approvingId || actionState.rejectingId) return;
    handleCancelEdit(); // Cancel previous edit first
    setEditingRowId(row.id);
    const initialData = {};
    currentColumns.forEach(col => {
        if (col.editable) {
             if (col.inputType === 'boolean') {
                 initialData[col.key] = String(row[col.key] ?? false); // Default null/undefined to 'false' string
             } else if (col.key === 'tags' && Array.isArray(row[col.key])) {
                 initialData[col.key] = row[col.key].join(', '); // Convert tags array to string for input
             } else {
                 initialData[col.key] = row[col.key] ?? ''; // Default null/undefined to empty string
             }
        }
    });
    setEditFormData(initialData);
    setEditError(null); // Clear previous errors when starting new edit
  }, [isSaving, isAdding, actionState, handleCancelEdit, currentColumns]); // Removed editingRowId dependency


  // Unified input change handler for both edit and add
  const handleInputChange = useCallback((event) => {
    const { name, value, type: inputTypeAttr, checked } = event.target;
    // For radio buttons, the value is directly 'true' or 'false'
    const newValue = inputTypeAttr === 'checkbox' ? checked : value;

    if (isAdding) {
      setNewRowData(prev => ({ ...prev, [name]: newValue }));
    } else if (editingRowId !== null) {
      setEditFormData(prev => ({ ...prev, [name]: newValue }));
    }
    setError(null); // Clear general error on input change
    setEditError(null); // Clear edit-specific error
  }, [isAdding, editingRowId]);

  // --- Save Edit Handler ---
  const handleSaveEdit = useCallback(async () => {
    if (!editingRowId || isSaving) return;
    setEditError(null); setIsSaving(true);
    const originalRow = data.find(row => row.id === editingRowId);
    if (!originalRow) { setEditError("Error: Original data not found."); setIsSaving(false); return; }

    const changes = {};
    let validationFailed = false;
    // Prepare payload and perform basic frontend validation
    Object.keys(editFormData).forEach(key => {
        const colConfig = currentColumns.find(c => c.key === key);
        if (!colConfig?.editable) return; // Skip non-editable

        let originalValue = originalRow[key];
        let editedValue = editFormData[key];

        // Type conversions for comparison and payload prep
        if (colConfig.inputType === 'boolean') {
            editedValue = editedValue === 'true';
            originalValue = originalValue ?? false;
        } else if (key === 'tags') {
             const originalTags = Array.isArray(originalValue) ? [...originalValue].sort() : [];
             const editedTags = typeof editedValue === 'string'
                 ? editedValue.split(',').map(t => t.trim()).filter(Boolean).sort()
                 : [];
              if (JSON.stringify(originalTags) !== JSON.stringify(editedTags)) {
                  changes[key] = editedTags; // Send array
              }
              return; // Handled tags
        } else if (colConfig.inputType === 'number') {
             if (editedValue === '' || editedValue === null || editedValue === undefined) {
                  editedValue = null; // Allow clearing number fields if needed by backend
             } else {
                 const num = parseInt(editedValue, 10); // Use parseFloat if needed
                 if (isNaN(num)) {
                     setEditError(`Invalid number for ${colConfig.header}.`);
                     validationFailed = true;
                 }
                 editedValue = isNaN(num) ? null : num;
             }
             originalValue = originalValue === null ? null : Number(originalValue);
        } else if (typeof editedValue === 'string') {
             editedValue = editedValue.trim() || null; // Trim strings, use null if empty
             originalValue = originalValue || null; // Ensure original is null if empty/nullish
        }

        // Compare original and potentially type-converted edited values
        // Convert null/undefined to empty string for comparison robustness
        if (String(originalValue ?? '') !== String(editedValue ?? '')) {
            changes[key] = editedValue;
        }
    });

    if (validationFailed) {
        setIsSaving(false);
        return;
    }
    if (Object.keys(changes).length === 0) {
        console.log('No effective changes detected.');
        handleCancelEdit();
        setIsSaving(false);
        return;
    }

    console.log(`Saving changes for ${type} ID ${editingRowId}:`, changes);
    try {
        // ** IMPORTANT: Ensure backend /api/admin/:type/:id PUT route exists and handles these partial updates **
        const response = await apiClient(`/api/admin/${type}/${editingRowId}`, `Admin Update ${type}`, { method: 'PUT', body: JSON.stringify(changes) });
        if (!response.success) {
             const backendError = response.error || (response.data && response.data.message) || `Failed to save ${type}.`;
             throw new Error(backendError);
        }
        onDataMutated?.(); // Refresh data
        handleCancelEdit(); // Exit edit mode
    } catch (err) {
        console.error(`Save failed for ${type} ID ${editingRowId}:`, err);
        const message = err instanceof Error ? err.message : 'An unknown error occurred during save.';
        setEditError(`Save failed: ${message}`); // Display error in the row
    } finally {
        setIsSaving(false);
    }
  }, [editingRowId, editFormData, data, type, onDataMutated, handleCancelEdit, isSaving, currentColumns]);

  // --- Save New Row Handler ---
  const handleSaveNewRow = useCallback(async () => {
      if (!isAdding || isSaving) return;
      setError(null); // Clear previous general errors
      setIsSaving(true);

      // Prepare payload, converting types and validating
      const payload = {};
      let validationError = null;
      for (const col of currentColumns) { // Use for...of to allow early return/break
          if (col.editable) {
              let value = newRowData[col.key];
              if (col.inputType === 'boolean') {
                  payload[col.key] = String(value) === 'true';
              } else if (col.key === 'tags' && typeof value === 'string') {
                  payload[col.key] = value.split(',').map(t => t.trim()).filter(Boolean);
              } else if (col.inputType === 'number') {
                   if (value === '' || value === null || value === undefined) {
                       payload[col.key] = null; // Allow null if not required
                   } else {
                       const num = parseInt(value, 10); // Use parseFloat if needed
                       if (isNaN(num)) {
                           validationError = `Invalid number entered for ${col.header}.`;
                           break; // Stop processing on validation error
                       }
                       payload[col.key] = num;
                   }
              } else if (typeof value === 'string') {
                  payload[col.key] = value.trim() || null; // Trim strings, use null if empty
              } else {
                   payload[col.key] = value ?? null; // Handle other types or nullish
              }
              // Basic required check (can be more specific based on type/col config)
              if (col.required && (payload[col.key] === null || payload[col.key] === '')) {
                  validationError = `${col.header} is required.`;
                  break;
              }
          }
      }

      if (validationError) {
          setError(validationError);
          setIsSaving(false);
          return;
      }

      // Add type-specific REQUIRED field validation (adjust as per backend schema)
      if (type !== 'submissions' && (!payload.name || String(payload.name).trim() === '')) { // 'name' is generally required
          setError(`Cannot save: Name is required for new ${type.slice(0, -1)}.`);
          setIsSaving(false); return;
      }
      if (type === 'dishes' && (!payload.restaurant_id || payload.restaurant_id <= 0)) {
          setError('Valid Restaurant ID is required for a new dish.');
          setIsSaving(false); return;
      }
      if (type === 'neighborhoods' && (!payload.city_id || payload.city_id <= 0)) {
          setError('Valid City ID is required for a new neighborhood.');
          setIsSaving(false); return;
      }
      if (type === 'users' && (!payload.username || !payload.email || !payload.password)) {
          setError('Username, Email, and Password are required for a new user.');
          setIsSaving(false); return;
      }

      console.log(`Attempting to save new ${type}:`, payload);

      try {
          // ** IMPORTANT: Backend endpoint POST /api/admin/:type needs to exist **
          const response = await apiClient(`/api/admin/${type}`, `Admin Create ${type}`, {
              method: 'POST',
              body: JSON.stringify(payload),
          });
          if (!response.success) {
              const backendError = response.error || (response.data && response.data.message) || `Failed to create new ${type}.`;
              throw new Error(backendError);
          }
          onDataMutated?.(); // Refresh data
          handleCancelAdd(); // Exit add mode
      } catch (err) {
          console.error(`Failed to save new ${type}:`, err);
          const message = err instanceof Error ? err.message : 'An unknown error occurred during save.';
          setError(`Save failed: ${message}`); // Display error near the add row form
      } finally {
          setIsSaving(false);
      }
  }, [isAdding, isSaving, newRowData, type, currentColumns, onDataMutated, handleCancelAdd]);


  // --- Delete Action Handlers ---
   const handleDeleteClick = useCallback((id) => {
        if (!canMutate || isAdding || editingRowId !== null || actionState.deletingId || actionState.approvingId || actionState.rejectingId) return;
        setConfirmDeleteInfo({ isOpen: true, id: id, itemType: type });
    }, [canMutate, type, actionState, isAdding, editingRowId]);

    const cancelDeletion = useCallback(() => {
        setConfirmDeleteInfo({ isOpen: false, id: null, itemType: '' });
        setError(null); // Clear general error on cancel
    }, []);

    const confirmDeletion = useCallback(async () => {
        const idToDelete = confirmDeleteInfo.id;
        const itemTypeToDelete = confirmDeleteInfo.itemType;
        if (!idToDelete || !itemTypeToDelete || actionState.deletingId === idToDelete) return;

        setActionState(prev => ({ ...prev, deletingId: idToDelete }));
        setError(null); // Clear previous error

        try {
            // ** IMPORTANT: Backend endpoint DELETE /api/admin/:type/:id needs to exist **
            const response = await apiClient(`/api/admin/${itemTypeToDelete}/${idToDelete}`, `Admin Delete ${itemTypeToDelete}`, { method: 'DELETE' });
            // DELETE often returns 204 No Content on success, which might be interpreted as success=true by apiClient if no error thrown
            if (response.success === false && response.error) { // Check for explicit failure message
                throw new Error(response.error);
            }
            onDataMutated?.(); // Refresh list on success
        } catch (err) {
            console.error(`Delete failed for ${itemTypeToDelete} ID ${idToDelete}:`, err);
            let message = `Failed to delete ${itemTypeToDelete.slice(0, -1)}.`;
             if (err instanceof Error) {
                 // Check for foreign key violation (example code '23503')
                 if (String((err )?.code) === '23503' || err.message?.includes('violates foreign key constraint') || err.message?.includes('referenced by other items')) {
                     message = `Cannot delete: This ${itemTypeToDelete.slice(0, -1)} is referenced by other items.`;
                 } else {
                     message = err.message;
                 }
             } else if (typeof err === 'string') {
                 message = err;
             }
            setError(message); // Set general error to display above table
        } finally {
            setActionState(prev => ({ ...prev, deletingId: null }));
            cancelDeletion(); // Close modal regardless of outcome
        }
    }, [confirmDeleteInfo, actionState.deletingId, onDataMutated, cancelDeletion]);


  // --- Approve/Reject Handlers ---
   const handleApprove = useCallback(async (id) => {
        if (actionState.approvingId || actionState.rejectingId || actionState.deletingId || isAdding || editingRowId !== null) return;
        setActionState(prev => ({ ...prev, approvingId: id }));
        setError(null);
        try {
            // Endpoint exists: POST /api/admin/submissions/:id/approve
            const response = await apiClient(`/api/admin/submissions/${id}/approve`, 'Admin Approve Submission', { method: 'POST' });
            if (!response.success) { throw new Error(response.error || 'Approval failed.'); }
            onDataMutated?.();
        } catch (err) {
            console.error(`Approve failed for submission ID ${id}:`, err);
            setError(err.message || 'Failed to approve submission.');
        } finally {
            setActionState(prev => ({ ...prev, approvingId: null }));
        }
    }, [onDataMutated, actionState, isAdding, editingRowId]);

    const handleReject = useCallback(async (id) => {
         if (actionState.approvingId || actionState.rejectingId || actionState.deletingId || isAdding || editingRowId !== null) return;
         setActionState(prev => ({ ...prev, rejectingId: id }));
         setError(null);
        try {
             // Endpoint exists: POST /api/admin/submissions/:id/reject
            const response = await apiClient(`/api/admin/submissions/${id}/reject`, 'Admin Reject Submission', { method: 'POST' });
            if (!response.success) { throw new Error(response.error || 'Rejection failed.'); }
            onDataMutated?.();
        } catch (err) {
            console.error(`Reject failed for submission ID ${id}:`, err);
            setError(err.message || 'Failed to reject submission.');
        } finally {
            setActionState(prev => ({ ...prev, rejectingId: null }));
        }
    }, [onDataMutated, actionState, isAdding, editingRowId]);


  // --- Main Render ---
  return (
    <>
        {/* Add New Button */}
        {canAdd && !isAdding && (
             <div className="mb-4 flex justify-end">
                 <Button
                    onClick={handleStartAdd}
                    size="sm"
                    variant="primary"
                    disabled={isLoading || editingRowId !== null} // Disable if loading or editing
                    className="whitespace-nowrap flex items-center gap-1" // Ensure icon and text stay together
                 >
                     <PlusCircle size={16} /> Add New {type.slice(0, -1)} {/* Dynamic label */}
                 </Button>
             </div>
         )}

        {/* General Action Error Display */}
        {error && (
                <div className="mb-4">
                    <ErrorMessage message={error} onRetry={() => setError(null)} />
                </div>
        )}

        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm relative bg-white">
            {/* Loading Overlay */}
            {isLoading && !data?.length && ( // Show spinner only when truly loading initial data
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20 rounded-lg">
                    <Loader2 className="animate-spin h-8 w-8 text-[#A78B71]" />
                </div>
            )}
            {/* Subtle loading indicator for background refetches */}
            {isLoading && data?.length > 0 && (
                <div className="absolute top-2 right-2 z-20 text-gray-400" title="Refreshing data...">
                    <Loader2 className="animate-spin h-4 w-4" />
                </div>
            )}
            <table className="min-w-full text-sm table-auto divide-y divide-gray-200">
                <thead className="sticky top-0 z-10 bg-gray-50">
                <tr>
                    {currentColumns.map((col) => (
                    <th key={col.key} scope="col" className={`px-3 py-2.5 text-left font-semibold text-gray-600 uppercase tracking-wider text-xs ${col.headerClassName || ''} ${col.sortable ? 'cursor-pointer hover:bg-gray-100 transition-colors group' : ''}`}
                        onClick={col.sortable ? () => handleSortClick(col.key) : undefined}
                        aria-sort={col.sortable ? (currentSortColumn === col.key ? (currentSortDirection === 'asc' ? 'ascending' : 'descending') : 'none') : undefined}
                        title={col.sortable ? `Sort by ${col.header}` : undefined}
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
                {/* Add New Row */}
                {isAdding && (
                    <tr className="bg-blue-50 hover:bg-blue-100 animate-pulse-fast"> {/* Subtle pulse */}
                        {currentColumns.map((col) => (
                            <td key={`add-${col.key}`} className={`px-3 py-1 align-top ${col?.className || ''}`}>
                                {col.key === 'actions' ? (
                                    // Actions for the add row
                                    <div className="flex items-center gap-1.5 py-1">
                                        <Button size="sm" variant="primary" onClick={handleSaveNewRow} isLoading={isSaving} disabled={isSaving} className="!p-1.5" title="Save New Row">
                                            <Save size={14} />
                                        </Button>
                                        <Button size="sm" variant="tertiary" onClick={handleCancelAdd} disabled={isSaving} className="!p-1.5 text-gray-600" title="Cancel Add">
                                            <CancelIcon size={14} />
                                        </Button>
                                    </div>
                                ) : (
                                    // Render editable cell for the new row
                                    <RenderEditableCell
                                        row={null} col={col} isAdding={true} editingRowId={null}
                                        editFormData={newRowData} isSaving={isSaving} handleEditInputChange={handleInputChange}
                                    />
                                )}
                            </td>
                        ))}
                    </tr>
                )}

                {/* Existing Data Rows */}
                {!isAdding && (!data || data.length === 0) ? ( // Check !isAdding here
                    <tr><td colSpan={currentColumns.length} className="text-center text-gray-500 py-8 italic">No {type} found matching criteria.</td></tr>
                ) : (
                    data.map((row) => {
                        const isEditingThisRow = editingRowId === row.id;
                        const isDeletingThisRow = actionState.deletingId === row.id;
                        const isApprovingThisRow = actionState.approvingId === row.id;
                        const isRejectingThisRow = actionState.rejectingId === row.id;
                        // Row is busy if any action is targeting it OR we are saving another edit/add
                        const isRowBusy = isSaving || isDeletingThisRow || isApprovingThisRow || isRejectingThisRow;
                        // Disable actions on other rows if currently adding or editing another row
                        const disableActions = isAdding || (editingRowId !== null && !isEditingThisRow);

                        return (
                            <tr key={row.id} className={`${isEditingThisRow ? 'bg-blue-50' : 'hover:bg-gray-50'} ${isRowBusy && !isEditingThisRow ? 'opacity-50 transition-opacity duration-300' : ''} transition-colors duration-150`}>
                            {currentColumns.map((col) => {
                                // --- Actions Column ---
                                if (col.key === 'actions') {
                                    return (
                                        <td key={col.key} className={`px-3 py-2 whitespace-nowrap align-top ${col?.className || ''}`}>
                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-1.5">
                                                {/* Edit/Save/Cancel */}
                                                {canEdit && (
                                                    isEditingThisRow ? (
                                                        <>
                                                            <Button size="sm" variant="primary" onClick={handleSaveEdit} isLoading={isSaving} disabled={isSaving} className="!p-1.5" title="Save Changes">
                                                                <Save size={14} />
                                                            </Button>
                                                            <Button size="sm" variant="tertiary" onClick={handleCancelEdit} disabled={isSaving} className="!p-1.5 text-gray-600" title="Cancel Edit">
                                                                <CancelIcon size={14} />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Button size="sm" variant="tertiary" onClick={() => handleStartEdit(row)} disabled={isRowBusy || disableActions} className="!p-1.5" title="Edit Row">
                                                            <Edit size={14} />
                                                        </Button>
                                                    )
                                                )}
                                                {/* Delete (for non-submissions) */}
                                                {canMutate && type !== 'submissions' && !isEditingThisRow && (
                                                     <Button size="sm" variant="tertiary" onClick={() => handleDeleteClick(row.id)} isLoading={isDeletingThisRow} disabled={isRowBusy || disableActions} className="!p-1.5 text-red-500 hover:text-red-700" title="Delete Row">
                                                          <Trash2 size={14} />
                                                     </Button>
                                                 )}
                                                 {/* Submission Actions */}
                                                 {type === 'submissions' && row.status === 'pending' && !isEditingThisRow && (
                                                     <>
                                                         <Button size="sm" variant="tertiary" onClick={() => handleApprove(row.id)} isLoading={isApprovingThisRow} disabled={isRowBusy || disableActions} className="!p-1.5 text-green-600 hover:text-green-800" title="Approve Submission">
                                                             <Check size={14} />
                                                         </Button>
                                                         <Button size="sm" variant="tertiary" onClick={() => handleReject(row.id)} isLoading={isRejectingThisRow} disabled={isRowBusy || disableActions} className="!p-1.5 text-red-500 hover:text-red-700" title="Reject Submission">
                                                             <CancelIcon size={14} />
                                                         </Button>
                                                     </>
                                                 )}
                                            </div>
                                            {/* Display edit error inline */}
                                            {isEditingThisRow && editError && (
                                                <p className="text-xs text-red-600 mt-1 whitespace-normal" role="alert">{editError}</p>
                                            )}
                                        </td>
                                    );
                                }
                                // --- Normal/Editable Cell ---
                                return (
                                <td key={col.key} className={`px-3 py-2 align-top ${col?.className || ''} ${isEditingThisRow && col.editable ? 'py-1' : ''}`}>
                                    <RenderEditableCell
                                        row={row} col={col} editingRowId={editingRowId} editFormData={editFormData}
                                        isSaving={isSaving} handleEditInputChange={handleInputChange}
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

        {/* Confirmation Modal */}
        <ConfirmationDialog
            isOpen={confirmDeleteInfo.isOpen}
            onClose={cancelDeletion}
            onConfirm={confirmDeletion}
            title="Confirm Deletion"
            isLoading={actionState.deletingId === confirmDeleteInfo.id} // Pass correct loading state
        >
            {/* Display specific delete error inside the dialog */}
            {error && actionState.deletingId === confirmDeleteInfo.id && ( // Display error only if it belongs to this delete action
                 <div className="mb-3">
                     <ErrorMessage message={error} onRetry={() => setError(null)} />
                 </div>
             )}
            Are you sure you want to delete this {confirmDeleteInfo.itemType?.slice(0, -1)}?
             {/* Optional: Show name */}
             {confirmDeleteInfo.id && data.find(r => r.id === confirmDeleteInfo.id)?.name && (
                 <span className="font-semibold block mt-1"> "{data.find(r => r.id === confirmDeleteInfo.id)?.name}"</span>
             )}
             <br/>
            <span className="font-semibold text-red-600">This action cannot be undone.</span>
        </ConfirmationDialog>
    </>
  );
};

// Memoize the component for performance if props don't change often
export default React.memo(AdminTable);