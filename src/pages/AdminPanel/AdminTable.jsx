// src/pages/AdminPanel/AdminTable.jsx
// NEW FILE - Basic structure for the Admin Table component

import React, { useState, useCallback, useMemo } from 'react';
import Button from '@/components/Button'; // Use alias
import { CheckCircle, XCircle, Edit, Trash2, ArrowDown, ArrowUp, Eye } from 'lucide-react';
import useSubmissionStore from '@/stores/useSubmissionStore'; // For approve/reject
import apiClient from '@/services/apiClient'; // For direct delete/update if needed

// Helper to format date/time
const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleString();
    } catch (e) {
        return 'Invalid Date';
    }
};

// Column Configuration (Example - expand as needed)
const columnConfig = {
    submissions: [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'type', label: 'Type', sortable: true },
        { key: 'location', label: 'Location/Restaurant', sortable: false }, // Maybe sort by location?
        { key: 'tags', label: 'Tags', sortable: false },
        { key: 'user_handle', label: 'User', sortable: true },
        { key: 'created_at', label: 'Submitted', sortable: true, format: formatDateTime },
        { key: 'actions', label: 'Actions', sortable: false },
    ],
    restaurants: [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'city_name', label: 'City', sortable: true },
        { key: 'neighborhood_name', label: 'Neighborhood', sortable: true },
        { key: 'adds', label: 'Adds', sortable: true },
        // { key: 'google_place_id', label: 'Place ID', sortable: false },
        { key: 'created_at', label: 'Created', sortable: true, format: formatDateTime },
        { key: 'actions', label: 'Actions', sortable: false },
    ],
    dishes: [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'restaurant_name', label: 'Restaurant', sortable: true },
        { key: 'adds', label: 'Adds', sortable: true },
        { key: 'created_at', label: 'Created', sortable: true, format: formatDateTime },
        { key: 'actions', label: 'Actions', sortable: false },
    ],
    lists: [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'creator_handle', label: 'Creator', sortable: true },
        { key: 'type', label: 'Type', sortable: true },
        { key: 'item_count', label: 'Items', sortable: true },
        { key: 'saved_count', label: 'Saves', sortable: true },
        { key: 'is_public', label: 'Public', sortable: true },
        { key: 'created_at', label: 'Created', sortable: true, format: formatDateTime },
        { key: 'actions', label: 'Actions', sortable: false },
    ],
    hashtags: [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'category', label: 'Category', sortable: true },
        { key: 'created_at', label: 'Created', sortable: true, format: formatDateTime },
        { key: 'actions', label: 'Actions', sortable: false },
    ],
     users: [
        { key: 'id', label: 'ID', sortable: true },
        { key: 'username', label: 'Username', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
        { key: 'account_type', label: 'Type', sortable: true },
        { key: 'created_at', label: 'Created', sortable: true, format: formatDateTime },
        { key: 'actions', label: 'Actions', sortable: false },
    ],
    // Add more types as needed
};

const AdminTable = ({ type, data = [], sort, onSortChange, onDataMutated }) => {
    const approveSubmission = useSubmissionStore(state => state.approveSubmission);
    const rejectSubmission = useSubmissionStore(state => state.rejectSubmission);
    const [processingId, setProcessingId] = useState(null);
    const [error, setError] = useState(null);

    const columns = columnConfig[type] || [];
    const [sortColumn, sortDirection] = sort ? sort.split('_') : ['', ''];

    const handleSort = useCallback((columnKey) => {
        if (!columns.find(c => c.key === columnKey)?.sortable) return;
        const currentDirection = (sortColumn === columnKey) ? sortDirection : 'asc';
        const nextDirection = currentDirection === 'asc' ? 'desc' : 'asc';
        onSortChange(type, columnKey, nextDirection);
    }, [type, sortColumn, sortDirection, onSortChange, columns]);

    const handleApprove = useCallback(async (id) => {
        setProcessingId(id);
        setError(null);
        try {
            await approveSubmission(id);
            onDataMutated(); // Notify parent to refetch
        } catch (err) {
            setError(`Failed to approve submission ${id}: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    }, [approveSubmission, onDataMutated]);

    const handleReject = useCallback(async (id) => {
        setProcessingId(id);
        setError(null);
        try {
            await rejectSubmission(id);
            onDataMutated(); // Notify parent to refetch
        } catch (err) {
            setError(`Failed to reject submission ${id}: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    }, [rejectSubmission, onDataMutated]);

    // Placeholder Edit/Delete Handlers - Implement full logic later
    const handleEdit = useCallback((item) => {
        alert(`Edit functionality for ${type} ID ${item.id} not fully implemented.`);
        // TODO: Implement modal or form for editing
    }, [type]);

    const handleDelete = useCallback(async (id) => {
        if (!window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)} (ID: ${id})? This cannot be undone.`)) {
            return;
        }
        setProcessingId(id);
        setError(null);
        try {
            await apiClient(`/api/admin/${type}/${id}`, `Admin Delete ${type} ${id}`, { method: 'DELETE' });
            onDataMutated(); // Notify parent to refetch
        } catch (err) {
             setError(`Failed to delete ${type.slice(0, -1)} ${id}: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    }, [type, onDataMutated]);

    const renderCell = (item, column) => {
        let value = item[column.key];

        // Handle nested properties if needed (e.g., user.name) - adjust key in config
        const keys = column.key.split('.');
        if (keys.length > 1) {
            value = keys.reduce((obj, key) => obj?.[key], item);
        }

        if (column.format) {
            return column.format(value);
        }

        if (column.key === 'tags' && Array.isArray(value)) {
            return (
                <div className="flex flex-wrap gap-1 max-w-xs">
                    {value.map(tag => <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-[10px] rounded-full">{tag}</span>)}
                </div>
            );
        }
        if (column.key === 'is_public' || typeof value === 'boolean') {
             return value ? <span className="text-green-600">Yes</span> : <span className="text-red-600">No</span>;
        }

        // Truncate long text for specific columns if needed
         if (['name', 'location', 'description', 'restaurant_name', 'username', 'email'].includes(column.key) && typeof value === 'string' && value.length > 60) {
             return <span title={value}>{value.substring(0, 60)}...</span>;
         }


        return value ?? 'N/A';
    };

    const renderActions = (item) => {
        const isProcessingThis = processingId === item.id;
        if (type === 'submissions') {
            return (
                <div className="flex gap-1">
                    <Button variant="primary" size="sm" onClick={() => handleApprove(item.id)} disabled={isProcessingThis} title="Approve">
                        <CheckCircle size={16} />
                    </Button>
                    <Button variant="tertiary" size="sm" onClick={() => handleReject(item.id)} disabled={isProcessingThis} className="text-red-600 hover:bg-red-50" title="Reject">
                        <XCircle size={16} />
                    </Button>
                    <Button variant="tertiary" size="sm" onClick={() => alert('View details not implemented')} title="View Details">
                         <Eye size={16} />
                     </Button>
                </div>
            );
        } else if (type !== 'users') { // Example: Don't allow direct user deletion from here
             return (
                 <div className="flex gap-1">
                     <Button variant="tertiary" size="sm" onClick={() => handleEdit(item)} disabled={isProcessingThis} title="Edit">
                         <Edit size={16} />
                     </Button>
                     <Button variant="tertiary" size="sm" onClick={() => handleDelete(item.id)} disabled={isProcessingThis} className="text-red-600 hover:bg-red-50" title="Delete">
                         <Trash2 size={16} />
                     </Button>
                 </div>
             );
        } else {
             // Add specific user actions if needed (e.g., Edit role button)
             return (
                  <div className="flex gap-1">
                      <Button variant="tertiary" size="sm" onClick={() => handleEdit(item)} disabled={isProcessingThis} title="Edit User">
                          <Edit size={16} />
                      </Button>
                  </div>
              );
        }
    };

    return (
        <div>
            {error && <ErrorMessage message={error} containerClassName="mb-4" />}
            {data.length === 0 ? (
                <p className="text-center text-gray-500 py-6">No {type} found.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        scope="col"
                                        className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                                        onClick={() => col.sortable && handleSort(col.key)}
                                        aria-sort={sortColumn === col.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                                    >
                                        <div className="flex items-center">
                                            {col.label}
                                            {col.sortable && sortColumn === col.key && (
                                                sortDirection === 'asc' ? <ArrowUp size={12} className="ml-1" /> : <ArrowDown size={12} className="ml-1" />
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    {columns.map((col) => (
                                        <td key={`${item.id}-${col.key}`} className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 align-top">
                                            {col.key === 'actions' ? renderActions(item) : renderCell(item, col)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminTable;