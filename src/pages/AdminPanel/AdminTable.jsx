/* src/components/AdminTable.jsx */
import React, { useCallback, useState } from 'react';
import Button from '@/components/Button.jsx';
import { CheckCircle, XCircle, Edit, Trash2, ArrowDown, ArrowUp, Eye, Loader2 } from 'lucide-react';
import apiClient from '@/services/apiClient';
import ErrorMessage from '@/components/UI/ErrorMessage.jsx';
import { queryClient } from '@/queryClient';

const formatDateTime = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  } catch (e) { return 'Invalid Date'; }
};

const columnConfig = {
  submissions: [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'location', label: 'Location', sortable: false },
    { key: 'tags', label: 'Tags', sortable: false },
    { key: 'user_handle', label: 'Submitter', sortable: true },
    { key: 'created_at', label: 'Submitted', sortable: true, format: formatDateTime },
    { key: 'actions', label: 'Actions', sortable: false },
  ],
  restaurants: [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'city_name', label: 'City', sortable: true },
    { key: 'neighborhood_name', label: 'Neighborhood', sortable: true },
    { key: 'adds', label: 'Adds', sortable: true },
    { key: 'tags', label: 'Tags', sortable: false },
    { key: 'created_at', label: 'Created', sortable: true, format: formatDateTime },
    { key: 'actions', label: 'Actions', sortable: false },
  ],
  dishes: [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'restaurant_name', label: 'Restaurant', sortable: true },
    { key: 'adds', label: 'Adds', sortable: true },
    { key: 'tags', label: 'Tags', sortable: false },
    { key: 'created_at', label: 'Created', sortable: true, format: formatDateTime },
    { key: 'actions', label: 'Actions', sortable: false },
  ],
  lists: [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'list_type', label: 'Type', sortable: true },
    { key: 'is_public', label: 'Public', sortable: true },
    { key: 'saved_count', label: 'Saves', sortable: true },
    { key: 'creator_handle', label: 'Creator', sortable: true },
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
    { key: 'created_at', label: 'Joined', sortable: true, format: formatDateTime },
    { key: 'actions', label: 'Actions', sortable: false },
  ],
};

const AdminTable = ({
  type,
  data = [],
  sort,
  onSortChange,
  onDataMutated,
  isLoading,
}) => {
  const [localProcessingId, setLocalProcessingId] = useState(null);
  const [localError, setLocalError] = useState(null);

  const columns = columnConfig[type] || [];
  const [sortColumn, sortDirection] = sort ? sort.split('_') : ['', ''];

  const handleSort = useCallback((columnKey) => {
    if (!columns.find(c => c.key === columnKey)?.sortable) return;
    const currentDirection = sortColumn === columnKey ? sortDirection : 'asc';
    const nextDirection = currentDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(type, columnKey, nextDirection);
  }, [type, sortColumn, sortDirection, onSortChange, columns]);

  const handleMutation = useCallback(async (action, id, endpoint, method = 'POST') => {
    setLocalProcessingId(`${action}-${id}`);
    setLocalError(null);
    try {
      const response = await apiClient(endpoint, `Admin ${action} ${type} ${id}`, { method });
      queryClient.invalidateQueries({ queryKey: ['adminData', type] });
      if (type === 'submissions' && (action === 'approve' || action === 'reject')) {
        queryClient.invalidateQueries({ queryKey: ['pendingSubmissions'] });
      }
      onDataMutated();
      return response;
    } catch (err) {
      setLocalError(`Failed to ${action} ${type.slice(0, -1)}: ${err.message}`);
      throw err;
    } finally {
      setLocalProcessingId(null);
    }
  }, [type, onDataMutated]);

  const handleApprove = useCallback((id) => {
    handleMutation('approve', id, `/api/admin/submissions/${id}/approve`, 'POST');
  }, [handleMutation]);

  const handleReject = useCallback((id) => {
    handleMutation('reject', id, `/api/admin/submissions/${id}/reject`, 'POST');
  }, [handleMutation]);

  const handleEdit = useCallback((item) => {
    alert(`Edit functionality for ${type} ID ${item.id} not fully implemented.`);
    console.log("Edit item:", item);
  }, [type]);

  const handleDelete = useCallback((id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)} (ID: ${id})? This cannot be undone.`)) {
      return;
    }
    handleMutation('delete', id, `/api/admin/${type}/${id}`, 'DELETE');
  }, [type, handleMutation]);

  const renderCell = (item, column) => {
    let value = item;
    const keys = column.key.split('.');
    for (const key of keys) {
      if (value === null || typeof value === 'undefined') {
        value = null;
        break;
      }
      value = value[key];
    }
    if (column.format) return column.format(value);
    if (column.key === 'tags' && Array.isArray(value)) {
      if (value.length === 0) return <span className="text-gray-400 italic">None</span>;
      const displayTags = value.slice(0, 3);
      const remainingCount = value.length - displayTags.length;
      return (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {displayTags.map(tag => (
            <span key={tag} className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-600 whitespace-nowrap">#{tag}</span>
          ))}
          {remainingCount > 0 && (
            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-600 whitespace-nowrap">+{remainingCount}</span>
          )}
        </div>
      );
    }
    if (column.key === 'is_public' || typeof value === 'boolean') {
      return value ? <span className="text-green-600 font-medium">Yes</span> : <span className="text-red-600">No</span>;
    }
    if (column.key === 'list_type') {
      return <span className="capitalize">{value || 'mixed'}</span>;
    }
    if (typeof value === 'string' && value.length > 60) {
      return <span title={value}>{value.substring(0, 60)}...</span>;
    }
    return value ?? <span className="text-gray-400 italic">N/A</span>;
  };

  const renderActions = (item) => {
    const isProcessingThis = localProcessingId && localProcessingId.endsWith(`-${item.id}`);
    const currentAction = localProcessingId?.split('-')[0];

    if (type === 'submissions') {
      if (item.status !== 'pending') {
        return <span className="text-xs text-gray-400 capitalize italic">{item.status}</span>;
      }
      return (
        <div className="flex gap-1">
          <Button variant="primary" size="sm" onClick={() => handleApprove(item.id)} disabled={isProcessingThis} title="Approve">
            {isProcessingThis && currentAction === 'approve' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
          </Button>
          <Button variant="tertiary" size="sm" onClick={() => handleReject(item.id)} disabled={isProcessingThis} className="text-red-600 hover:bg-red-50" title="Reject">
            {isProcessingThis && currentAction === 'reject' ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
          </Button>
          <Button variant="tertiary" size="sm" onClick={() => alert('View details not implemented')} title="View Details" disabled={isProcessingThis}>
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
            {isProcessingThis && currentAction === 'delete' ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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
    <div className="relative">
      {localError && <ErrorMessage message={localError} onRetry={() => setLocalError(null)} containerClassName="mb-4" />}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      )}
      {data.length === 0 && !isLoading ? (
        <p className="text-center text-gray-500 py-10 bg-gray-50 rounded-md border border-dashed">
          No {type} found.
        </p>
      ) : (
        <div className={`overflow-x-auto shadow border border-gray-200 sm:rounded-lg ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:bg-gray-100 group' : ''}`}
                    onClick={() => col.sortable && handleSort(col.key)}
                    aria-sort={sortColumn === col.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && (
                        <span className="opacity-40 group-hover:opacity-100 transition-opacity">
                          {sortColumn === col.key
                            ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)
                            : <ArrowUp size={12} />}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
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