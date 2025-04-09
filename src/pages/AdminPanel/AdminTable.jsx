/* src/pages/AdminPanel/AdminTable.jsx */
import React, { useCallback, useState, useMemo } from 'react';
import Button from '@/components/Button.jsx';
import { Edit, Trash2, ArrowDown, ArrowUp, Loader2 } from 'lucide-react';
import apiClient from '@/services/apiClient';
import ErrorMessage from '@/components/UI/ErrorMessage.jsx';

const formatDateTime = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    return new Date(isoString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

const columnConfig = {
  submissions: [
    { key: 'id', label: 'ID', sortable: true, className: 'w-12' },
    { key: 'type', label: 'Type', sortable: true, className: 'w-24 capitalize' },
    { key: 'name', label: 'Name', sortable: true, className: 'min-w-[150px]' },
    { key: 'location', label: 'Location Hint', sortable: false, className: 'min-w-[150px]' },
    { key: 'city', label: 'City', sortable: false, className: 'w-24' },
    { key: 'neighborhood', label: 'Neighborhood', sortable: false, className: 'w-32' },
    { key: 'tags', label: 'Tags', sortable: false, className: 'w-40' },
    { key: 'user_handle', label: 'By', sortable: false, className: 'w-24' },
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
    { key: 'restaurant_name', label: 'Restaurant', sortable: false, className: 'min-w-[150px]' },
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
    { key: 'item_count', label: 'Items', sortable: false, className: 'w-16' },
    { key: 'creator_handle', label: 'Creator', sortable: false, className: 'w-24' },
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
};

const ALLOWED_MUTATE_TYPES = ['submissions', 'restaurants', 'dishes', 'lists', 'hashtags'];
const ALLOWED_EDIT_TYPES = ['submissions', 'restaurants', 'dishes', 'lists', 'hashtags', 'users'];

const AdminTable = ({
  data = [],
  type = 'submissions',
  sort,
  onSortChange,
  onDataMutated,
  isLoading = false,
}) => {
  const [actionState, setActionState] = useState({ deletingId: null, approvingId: null, rejectingId: null });
  const [error, setError] = useState(null);

  const currentColumns = useMemo(() => columnConfig[type] || [], [type]);
  const canMutate = useMemo(() => ALLOWED_MUTATE_TYPES.includes(type), [type]);
  const canEdit = useMemo(() => ALLOWED_EDIT_TYPES.includes(type), [type]);

  const currentSortColumn = useMemo(() => sort?.split('_')[0] || '', [sort]);
  const currentSortDirection = useMemo(() => sort?.split('_')[1] || 'desc', [sort]);

  const handleSortClick = useCallback(
    (key) => {
      if (!onSortChange) return;
      const newDirection =
        key === currentSortColumn && currentSortDirection === 'asc' ? 'desc' : 'asc';
      onSortChange(type, key, newDirection);
    },
    [onSortChange, type, currentSortColumn, currentSortDirection]
  );

  const handleApprove = useCallback(
    async (id) => {
      setError(null);
      setActionState((prev) => ({ ...prev, approvingId: id }));
      try {
        const response = await apiClient(`/api/admin/submissions/${id}/approve`, 'Admin Approve Submission', { method: 'POST' });
        if (!response?.success) throw new Error('Approval failed');
        onDataMutated?.();
      } catch (err) {
        setError(`Failed to approve submission ${id}: ${err.message}`);
        console.error('[AdminTable] Approve failed:', err);
      } finally {
        setActionState((prev) => ({ ...prev, approvingId: null }));
      }
    },
    [onDataMutated]
  );

  const handleReject = useCallback(
    async (id) => {
      setError(null);
      setActionState((prev) => ({ ...prev, rejectingId: id }));
      try {
        const response = await apiClient(`/api/admin/submissions/${id}/reject`, 'Admin Reject Submission', { method: 'POST' });
        if (!response?.success) throw new Error('Rejection failed');
        onDataMutated?.();
      } catch (err) {
        setError(`Failed to reject submission ${id}: ${err.message}`);
        console.error('[AdminTable] Reject failed:', err);
      } finally {
        setActionState((prev) => ({ ...prev, rejectingId: null }));
      }
    },
    [onDataMutated]
  );

  const handleDelete = useCallback(
    async (id) => {
      if (!canMutate) return;
      setError(null);
      setActionState((prev) => ({ ...prev, deletingId: id }));
      try {
        const response = await apiClient(`/api/admin/${type}/${id}`, `Admin Delete ${type}`, { method: 'DELETE' });
        if (!response?.success) throw new Error('Deletion failed');
        onDataMutated?.();
      } catch (err) {
        setError(`Failed to delete ${type} ${id}: ${err.message}`);
        console.error('[AdminTable] Delete failed:', err);
      } finally {
        setActionState((prev) => ({ ...prev, deletingId: null }));
      }
    },
    [canMutate, onDataMutated, type]
  );

  const handleEdit = useCallback(
    (item) => {
      console.log(`[AdminTable] Edit action clicked for ${type} ID: ${item.id}`, item);
      alert(`Edit functionality for ${type} ID ${item.id} is not implemented yet.`);
    },
    [type]
  );

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
          <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
        </div>
      )}
      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}
      <table className="min-w-full bg-white text-sm table-auto">
        <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
          <tr>
            {currentColumns.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-2.5 font-medium text-gray-600 text-left ${col.className || ''} ${col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                onClick={() => col.sortable && handleSortClick(col.key)}
                aria-sort={col.sortable && col.key === currentSortColumn ? (currentSortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && col.key === currentSortColumn && (
                    currentSortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
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
                if (col.key === 'actions') {
                  return (
                    <td key={col.key} className={`px-3 py-2 whitespace-nowrap ${col.className || ''}`}>
                      <div className="flex gap-1.5">
                        {type === 'submissions' && row.status === 'pending' && (
                          <>
                            <Button
                              size="xs"
                              variant="primary"
                              onClick={() => handleApprove(row.id)}
                              disabled={isLoading || actionState.approvingId === row.id}
                            >
                              {actionState.approvingId === row.id ? <Loader2 className="animate-spin h-4 w-4" /> : 'Approve'}
                            </Button>
                            <Button
                              size="xs"
                              variant="tertiary"
                              onClick={() => handleReject(row.id)}
                              disabled={isLoading || actionState.rejectingId === row.id}
                              className="text-red-600 hover:bg-red-50 hover:border-red-300"
                            >
                              {actionState.rejectingId === row.id ? <Loader2 className="animate-spin h-4 w-4" /> : 'Reject'}
                            </Button>
                          </>
                        )}
                        {canEdit && (
                          <Button
                            size="xs"
                            variant="tertiary"
                            onClick={() => handleEdit(row)}
                            title="Edit"
                            disabled={isLoading}
                          >
                            <Edit size={14} />
                          </Button>
                        )}
                        {canMutate && (
                          <Button
                            size="xs"
                            variant="tertiary"
                            onClick={() => handleDelete(row.id)}
                            disabled={isLoading || actionState.deletingId === row.id}
                            title="Delete"
                            className="text-red-600 hover:bg-red-50 hover:border-red-300"
                          >
                            {actionState.deletingId === row.id ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 size={14} />}
                          </Button>
                        )}
                      </div>
                    </td>
                  );
                }
                if (['created_at', 'updated_at', 'reviewed_at', 'followed_at'].includes(col.key)) {
                  return (
                    <td key={col.key} className={`px-3 py-2 whitespace-nowrap ${col.className || ''}`}>
                      {formatDateTime(value)}
                    </td>
                  );
                }
                if (col.key === 'is_public') {
                  return (
                    <td key={col.key} className={`px-3 py-2 whitespace-nowrap ${col.className || ''}`}>
                      {value ? 'Yes' : 'No'}
                    </td>
                  );
                }
                if (Array.isArray(value)) {
                  return (
                    <td key={col.key} className={`px-3 py-2 ${col.className || ''}`} title={value.join(', ')}>
                      <span className="line-clamp-2">{value.join(', ') || '—'}</span>
                    </td>
                  );
                }
                if (typeof value === 'number' && ['adds', 'saved_count', 'item_count'].includes(col.key)) {
                  return (
                    <td key={col.key} className={`px-3 py-2 text-right ${col.className || ''}`}>
                      {value.toLocaleString()}
                    </td>
                  );
                }
                return (
                  <td key={col.key} className={`px-3 py-2 ${col.className || ''}`} title={typeof value === 'string' ? value : ''}>
                    <span className="line-clamp-2">{value ?? '—'}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        {!isLoading && data.length === 0 && (
          <tfoot>
            <tr>
              <td colSpan={currentColumns.length} className="text-center py-6 text-gray-500 italic">
                No {type} found matching criteria.
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

export default React.memo(AdminTable);