// src/pages/AdminPanel/AdminTable.jsx
import React, { useState, useCallback, useMemo } from 'react';
import Button from '@/components/Button';
import { CheckCircle, XCircle, Edit, Trash2, ArrowDown, ArrowUp, Eye, Type } from 'lucide-react';
import useSubmissionStore from '@/stores/useSubmissionStore';
import apiClient from '@/services/apiClient';
import ErrorMessage from '@/components/UI/ErrorMessage';

// Helper to format date/time
const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    try {
        return new Date(isoString).toLocaleString();
    } catch (e) {
        return 'Invalid Date';
    }
};

// Column Configuration
const columnConfig = {
    submissions: [
        { key: 'name', label: 'Name', sortable: true, searchable: true },
        { key: 'type', label: 'Type', sortable: true, searchable: true },
        { key: 'location', label: 'Location/Restaurant', sortable: false, searchable: true },
        { key: 'tags', label: 'Tags', sortable: false, searchable: false }, // Tags need special search logic if desired
        { key: 'user_handle', label: 'User', sortable: true, searchable: true },
        { key: 'created_at', label: 'Submitted', sortable: true, format: formatDateTime, searchable: false },
        { key: 'actions', label: 'Actions', sortable: false, searchable: false },
    ],
    restaurants: [
        { key: 'id', label: 'ID', sortable: true, searchable: true },
        { key: 'name', label: 'Name', sortable: true, searchable: true },
        { key: 'city_name', label: 'City', sortable: true, searchable: true },
        { key: 'neighborhood_name', label: 'Neighborhood', sortable: true, searchable: true },
        { key: 'adds', label: 'Adds', sortable: true, searchable: false },
        { key: 'created_at', label: 'Created', sortable: true, format: formatDateTime, searchable: false },
        { key: 'actions', label: 'Actions', sortable: false, searchable: false },
    ],
    dishes: [
        { key: 'id', label: 'ID', sortable: true, searchable: true },
        { key: 'name', label: 'Name', sortable: true, searchable: true },
        { key: 'restaurant_name', label: 'Restaurant', sortable: true, searchable: true },
        { key: 'adds', label: 'Adds', sortable: true, searchable: false },
        { key: 'created_at', label: 'Created', sortable: true, format: formatDateTime, searchable: false },
        { key: 'actions', label: 'Actions', sortable: false, searchable: false },
    ],
    lists: [
        { key: 'id', label: 'ID', sortable: true, searchable: true },
        { key: 'name', label: 'Name', sortable: true, searchable: true },
        { key: 'creator_handle', label: 'Creator', sortable: true, searchable: true },
        { key: 'list_type', label: 'Type', sortable: true, Icon: Type, searchable: true },
        { key: 'item_count', label: 'Items', sortable: true, searchable: false },
        { key: 'saved_count', label: 'Saves', sortable: true, searchable: false },
        { key: 'is_public', label: 'Public', sortable: true, searchable: false }, // Boolean search needs specific handling
        { key: 'created_at', label: 'Created', sortable: true, format: formatDateTime, searchable: false },
        { key: 'actions', label: 'Actions', sortable: false, searchable: false },
    ],
    hashtags: [
        { key: 'id', label: 'ID', sortable: true, searchable: true },
        { key: 'name', label: 'Name', sortable: true, searchable: true },
        { key: 'category', label: 'Category', sortable: true, searchable: true },
        { key: 'created_at', label: 'Created', sortable: true, format: formatDateTime, searchable: false },
        { key: 'actions', label: 'Actions', sortable: false, searchable: false },
    ],
     users: [
        { key: 'id', label: 'ID', sortable: true, searchable: true },
        { key: 'username', label: 'Username', sortable: true, searchable: true },
        { key: 'email', label: 'Email', sortable: true, searchable: true },
        { key: 'account_type', label: 'Type', sortable: true, searchable: true },
        { key: 'created_at', label: 'Created', sortable: true, format: formatDateTime, searchable: false },
        { key: 'actions', label: 'Actions', sortable: false, searchable: false },
    ],
};

const AdminTable = ({
    type,
    data = [],
    sort,
    onSortChange,
    onDataMutated,
    listTypeFilter = 'all',
    hashtagCategoryFilter = 'all',
    // --- Accept search term prop ---
    searchTerm = '',
}) => {
    const approveSubmission = useSubmissionStore(state => state.approveSubmission);
    const rejectSubmission = useSubmissionStore(state => state.rejectSubmission);
    const [processingId, setProcessingId] = useState(null);
    const [error, setError] = useState(null);

    const columns = columnConfig[type] || [];
    const searchableColumns = useMemo(() => columns.filter(c => c.searchable), [columns]); // Memoize searchable columns
    const [sortColumn, sortDirection] = sort ? sort.split('_') : ['', ''];

    const filteredData = useMemo(() => {
        let items = data;

        if (type === 'lists' && listTypeFilter !== 'all') {
            items = items.filter(item => (item.list_type || 'mixed') === listTypeFilter);
        }

        if (type === 'hashtags' && hashtagCategoryFilter !== 'all') {
            items = items.filter(item => (item.category?.toLowerCase() || '') === hashtagCategoryFilter.toLowerCase());
        }

        // --- Apply search term filter (Client-side) ---
        if (searchTerm.trim()) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            items = items.filter(item =>
                // Check against searchable columns only
                searchableColumns.some(col => {
                    let value = item[col.key];
                    const keys = col.key.split('.'); // Handle potential nested keys if needed later
                    if (keys.length > 1) {
                        value = keys.reduce((obj, key) => obj?.[key], item);
                    }
                    // Ensure value exists and can be converted to string for searching
                    return value != null && String(value).toLowerCase().includes(lowerSearchTerm);
                })
            );
        }

        return items;
    }, [data, type, listTypeFilter, hashtagCategoryFilter, searchTerm, searchableColumns]); // Added dependencies


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
            onDataMutated();
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
            onDataMutated();
        } catch (err) {
            setError(`Failed to reject submission ${id}: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    }, [rejectSubmission, onDataMutated]);

    const handleEdit = useCallback((item) => {
        alert(`Edit functionality for ${type} ID ${item.id} not fully implemented.`);
    }, [type]);

    const handleDelete = useCallback(async (id) => {
        if (!window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)} (ID: ${id})? This cannot be undone.`)) {
            return;
        }
        setProcessingId(id);
        setError(null);
        try {
            await apiClient(`/api/admin/${type}/${id}`, `Admin Delete ${type} ${id}`, { method: 'DELETE' });
            onDataMutated();
        } catch (err) {
             setError(`Failed to delete ${type.slice(0, -1)} ${id}: ${err.message}`);
        } finally {
            setProcessingId(null);
        }
    }, [type, onDataMutated]);

    const renderCell = (item, column) => {
        let value = item[column.key];

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
                    {value.slice(0, 5).map(tag => <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-[10px] rounded-full">{tag}</span>)}
                    {value.length > 5 && <span className="px-1.5 py-0.5 bg-gray-200 text-[10px] rounded-full">+{value.length - 5}</span>}
                </div>
            );
        }
        if (column.key === 'is_public' || typeof value === 'boolean') {
             return value ? <span className="text-green-600">Yes</span> : <span className="text-red-600">No</span>;
        }
        if (column.key === 'list_type') {
             return <span className='capitalize flex items-center gap-1'>{column.Icon && <column.Icon size={14} className="text-gray-500"/>}{value ?? 'mixed'}</span>;
        }
         if (['name', 'location', 'description', 'restaurant_name', 'username', 'email', 'category'].includes(column.key) && typeof value === 'string' && value.length > 60) {
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
        } else if (type !== 'users') {
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
            {filteredData.length === 0 ? (
                 <p className="text-center text-gray-500 py-6 bg-gray-50 rounded-md border border-dashed">
                    {searchTerm || (type === 'lists' && listTypeFilter !== 'all') || (type === 'hashtags' && hashtagCategoryFilter !== 'all')
                      ? `No ${type} match the current filters/search.`
                      : `No ${type} found.`}
                 </p>
            ) : (
                <div className="overflow-x-auto shadow border-b border-gray-200 sm:rounded-lg">
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
                            {filteredData.map((item) => (
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