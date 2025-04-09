/* src/pages/AdminPanel/AdminTable.jsx */
import React, { useCallback, useState, useMemo } from 'react';
import Button from '@/components/Button.jsx'; // Use alias
import {
  CheckCircle, XCircle, Edit, Trash2, ArrowDown, ArrowUp, Eye, Loader2, AlertTriangle
} from 'lucide-react';
import apiClient from '@/services/apiClient'; // Use alias
import ErrorMessage from '@/components/UI/ErrorMessage.jsx'; // Use alias
import { queryClient } from '@/queryClient'; // Use alias for consistency

// Helper to format date/time
const formatDateTime = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

// Column configuration specific to each resource type
const columnConfig = {
  submissions: [
    { key: 'id', label: 'ID', sortable: true, className: 'w-12' },
    { key: 'type', label: 'Type', sortable: true, className: 'w-24 capitalize' },
    { key: 'name', label: 'Name', sortable: true, className: 'min-w-[150px]' },
    { key: 'location', label: 'Location Hint', sortable: false, className: 'min-w-[150px]' },
    { key: 'city', label: 'City', sortable: false, className: 'w-24' },
    { key: 'neighborhood', label: 'Neighborhood', sortable: false, className: 'w-32' },
    { key: 'tags', label: 'Tags', sortable: false, className: 'w-40' },
    { key: 'user_handle', label: 'By', sortable: false, className: 'w-24' }, // Field added in route query
    { key: 'created_at', label: 'Submitted', sortable: true, className: 'w-36' },
    { key: 'status', label: 'Status', sortable: true, className: 'w-24' },
    { key: 'actions', label: 'Actions', sortable: false, className: 'w-28' },
  ],
   restaurants: [
     { key: 'id', label: 'ID', sortable: true, className: 'w-12' },
     { key: 'name', label: 'Name', sortable: true, className: 'min-w-[200px]' },
     { key: 'city_name', label: 'City', sortable: true, className: 'w-32' },
     { key: 'neighborhood_name', label: 'Neighborhood', sortable: true, className: 'w-36' },
     { key: 'adds', label: 'Adds', sortable: true, className: 'w-16' },
     { key: 'created_at', label: 'Created', sortable: true, className: 'w-36' },
     { key: 'actions', label: 'Actions', sortable: false, className: 'w-28' },
   ],
   dishes: [
     { key: 'id', label: 'ID', sortable: true, className: 'w-12' },
     { key: 'name', label: 'Name', sortable: true, className: 'min-w-[150px]' },
     { key: 'restaurant_name', label: 'Restaurant', sortable: false, className: 'min-w-[150px]' }, // Joined in query
     { key: 'adds', label: 'Adds', sortable: true, className: 'w-16' },
     { key: 'created_at', label: 'Created', sortable: true, className: 'w-36' },
     { key: 'actions', label: 'Actions', sortable: false, className: 'w-28' },
   ],
   lists: [
     { key: 'id', label: 'ID', sortable: true, className: 'w-12' },
     { key: 'name', label: 'Name', sortable: true, className: 'min-w-[200px]' },
     { key: 'list_type', label: 'Type', sortable: true, className: 'w-24 capitalize' },
     { key: 'is_public', label: 'Public', sortable: false, className: 'w-16' },
     { key: 'saved_count', label: 'Saves', sortable: true, className: 'w-16' },
     { key: 'item_count', label: 'Items', sortable: false, className: 'w-16' }, // Calculated field, might not be sortable on DB
     { key: 'creator_handle', label: 'Creator', sortable: false, className: 'w-24' }, // Joined in query
     { key: 'created_at', label: 'Created', sortable: true, className: 'w-36' },
     { key: 'actions', label: 'Actions', sortable: false, className: 'w-28' },
   ],
    hashtags: [
     { key: 'id', label: 'ID', sortable: true, className: 'w-12' },
     { key: 'name', label: 'Name', sortable: true, className: 'min-w-[150px]' },
     { key: 'category', label: 'Category', sortable: true, className: 'w-32' },
     { key: 'created_at', label: 'Created', sortable: true, className: 'w-36' },
     { key: 'actions', label: 'Actions', sortable: false, className: 'w-28' },
   ],
   users: [
     { key: 'id', label: 'ID', sortable: true, className: 'w-12' },
     { key: 'username', label: 'Username', sortable: true, className: 'min-w-[150px]' },
     { key: 'email', label: 'Email', sortable: false, className: 'min-w-[200px]' },
     { key: 'account_type', label: 'Type', sortable: true, className: 'w-24 capitalize' },
     { key: 'created_at', label: 'Joined', sortable: true, className: 'w-36' },
     { key: 'actions', label: 'Actions', sortable: false, className: 'w-28' },
   ],
   // Add configurations for other types as needed
};

// Define which types allow deletion and editing
const ALLOWED_MUTATE_TYPES = ['submissions', 'restaurants', 'dishes', 'lists', 'hashtags'];
const ALLOWED_EDIT_TYPES = ['submissions', 'restaurants', 'dishes', 'lists', 'hashtags', 'users'];

const AdminTable = ({
    data = [], // Expect data to be the array of items
    type = 'submissions', // Type determines columns and actions
    sort, // Current sort string: "column_asc" or "column_desc"
    onSortChange, // Function to call when sort changes: (type, column, direction) => void
    onDataMutated, // Function to call after delete/approve/reject to trigger refetch
    isLoading = false, // Loading state from parent query
    // Removed onEdit - will handle inline or via separate modal triggered here
}) => {
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState(null);

    const currentColumns = useMemo(() => columnConfig[type] || [], [type]);
    const canMutate = useMemo(() => ALLOWED_MUTATE_TYPES.includes(type), [type]);
    const canEdit = useMemo(() => ALLOWED_EDIT_TYPES.includes(type), [type]); // Check if editing is allowed

    const currentSortColumn = useMemo(() => sort?.split('_')[0], [sort]);
    const currentSortDirection = useMemo(() => sort?.split('_')[1] || 'desc', [sort]);

    const handleSortClick = useCallback((key) => {
        if (!onSortChange) return; // Guard if handler not provided
        const newDirection = (key === currentSortColumn && currentSortDirection === 'asc') ? 'desc' : 'asc';
        onSortChange(type, key, newDirection);
    }, [onSortChange, type, currentSortColumn, currentSortDirection]);

    // Approve/Reject Submission Handlers (Simplified, assume store/mutation handles state)
    const handleApprove = async (id) => {
        setError(null);
        try {
             await apiClient(`/api/admin/submissions/${id}/approve`, 'Admin Approve Submission', { method: 'POST' });
             onDataMutated?.(); // Notify parent to refetch
        } catch (err) {
            setError(`Failed to approve submission ${id}: ${err.message}`);
            console.error('[AdminTable] Approve failed:', err);
        }
    };

    const handleReject = async (id) => {
         setError(null);
         try {
             await apiClient(`/api/admin/submissions/${id}/reject`, 'Admin Reject Submission', { method: 'POST' });
             onDataMutated?.(); // Notify parent to refetch
         } catch (err) {
             setError(`Failed to reject submission ${id}: ${err.message}`);
             console.error('[AdminTable] Reject failed:', err);
         }
     };

    const handleDelete = async (id) => {
        if (!canMutate) return;
        setDeletingId(id);
        setError(null);
        try {
            await apiClient(`/api/admin/${type}/${id}`, `Admin Delete ${type}`, { method: 'DELETE' });
            setDeletingId(null);
            onDataMutated?.(); // Notify parent to refetch
        } catch (err) {
            setError(`Failed to delete item ${id}: ${err.message}`);
            console.error('[AdminTable] Delete failed:', err);
            setDeletingId(null);
        }
    };

     // Placeholder edit handler
     const handleEdit = (item) => {
         console.log(`[AdminTable] Edit action clicked for ${type} ID: ${item.id}`, item);
         alert(`Edit functionality for ${type} ID ${item.id} is not implemented yet.`);
         // Implement modal opening or navigation here
     };

    return (
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm relative">
            {isLoading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                    <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
                </div>
            )}
            {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}
            <table className="min-w-full bg-white text-sm table-auto">
                <thead className="sticky top-0 z-10"> {/* Make header sticky */}
                    <tr className="bg-gray-50 text-left border-b border-gray-200">
                        {currentColumns.map((col) => (
                            <th
                                key={col.key}
                                className={`px-3 py-2.5 font-medium text-gray-600 ${col.className || ''} ${col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                                onClick={() => col.sortable && handleSortClick(col.key)}
                                aria-sort={col.sortable && col.key === currentSortColumn ? (currentSortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                            >
                                <div className="flex items-center gap-1">
                                    {col.label}
                                    {col.sortable && col.key === currentSortColumn && (
                                        sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {data.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                            {currentColumns.map((col) => {
                                const value = row[col.key];

                                // --- Specific Cell Renderers ---
                                if (col.key === 'actions') {
                                    return (
                                        <td key={col.key} className={`px-3 py-2 whitespace-nowrap ${col.className || ''}`}>
                                            <div className="flex gap-1.5">
                                                 {type === 'submissions' && row.status === 'pending' && (
                                                      <>
                                                          <Button size="xs" variant="primary" onClick={() => handleApprove(row.id)} disabled={isLoading}>Approve</Button>
                                                          <Button size="xs" variant="tertiary" onClick={() => handleReject(row.id)} disabled={isLoading}>Reject</Button>
                                                      </>
                                                 )}
                                                 {canEdit && (
                                                      <Button size="xs" variant="tertiary" onClick={() => handleEdit(row)} title="Edit" disabled={isLoading}>
                                                         <Edit size={14} />
                                                      </Button>
                                                 )}
                                                 {canMutate && (
                                                      <Button size="xs" variant="tertiary" onClick={() => handleDelete(row.id)} disabled={deletingId === row.id || isLoading} title="Delete" className="text-red-600 hover:bg-red-50 hover:border-red-300">
                                                         {deletingId === row.id ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 size={14} />}
                                                      </Button>
                                                 )}
                                            </div>
                                        </td>
                                    );
                                }
                                if (col.key === 'created_at' || col.key === 'updated_at' || col.key === 'reviewed_at' || col.key === 'followed_at') {
                                    return <td key={col.key} className={`px-3 py-2 whitespace-nowrap ${col.className || ''}`}>{formatDateTime(value)}</td>;
                                }
                                if (col.key === 'is_public') {
                                    return <td key={col.key} className={`px-3 py-2 whitespace-nowrap ${col.className || ''}`}>{value ? 'Yes' : 'No'}</td>;
                                }
                                if (Array.isArray(value)) {
                                    return <td key={col.key} className={`px-3 py-2 ${col.className || ''}`} title={value.join(', ')}><span className="line-clamp-2">{value.join(', ') || '—'}</span></td>;
                                }
                                if (typeof value === 'number' && ['adds', 'saved_count', 'item_count'].includes(col.key)) {
                                     return <td key={col.key} className={`px-3 py-2 text-right ${col.className || ''}`}>{value.toLocaleString()}</td>;
                                }

                                // --- Default Renderer ---
                                return (
                                    <td key={col.key} className={`px-3 py-2 ${col.className || ''}`} title={typeof value === 'string' ? value : ''}>
                                         <span className="line-clamp-2">{value ?? '—'}</span>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
                {data.length === 0 && !isLoading && (
                    <tfoot>
                        <tr>
                           <td colSpan={currentColumns.length} className="text-center py-6 text-gray-500 italic">No {type} found matching criteria.</td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
};

export default AdminTable;