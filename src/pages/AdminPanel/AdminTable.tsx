// src/pages/AdminPanel/AdminTable.tsx
import React, { useMemo, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import TableHeader from './TableHeader';
import AdminTableRow from './AdminTableRow';
import AddRow from './AddRow';
import ConfirmationDialog from '@/components/UI/ConfirmationDialog';
import ErrorMessage from '@/components/UI/ErrorMessage';
import Button from '@/components/UI/Button';
import { Loader2, Edit, Save, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import { useShallow } from 'zustand/react/shallow';
import { useAdminTableState } from '@/hooks/useAdminTableState';

// --- Types ---
interface City {
  id: number;
  name: string;
}

interface Neighborhood {
  id: number;
  name: string;
  city_id: number;
}

interface ColumnConfig {
  key: string;
  header: string | JSX.Element;
  sortable?: boolean;
  editable?: boolean;
  className?: string;
  Cell?: (props: { row: any }) => JSX.Element;
  render?: (value: any, row: any) => JSX.Element | string;
  inputType?: string;
  required?: boolean;
}

interface AdminTableProps {
  data?: any[];
  type: string;
  sort?: string;
  onSortChange: (type: string, column: string, direction: string) => void;
  onDataMutated?: () => void;
  isLoading?: boolean;
}

// --- Column Definitions ---
const baseColumns: ColumnConfig[] = [
  { key: 'id', header: 'ID', sortable: true, editable: false, className: 'w-16 text-gray-500' },
];

const columnConfig: Record<string, ColumnConfig[]> = {
  submissions: [
    ...baseColumns,
    { key: 'type', header: 'Type', sortable: true, editable: false },
    { key: 'name', header: 'Name', sortable: true, editable: false },
    { key: 'user_handle', header: 'Submitted By', sortable: true, editable: false },
    { key: 'status', header: 'Status', sortable: true, editable: false },
    { key: 'created_at', header: 'Submitted', sortable: true, editable: false },
    { key: 'actions', header: '', sortable: false, editable: false, className: 'w-32' },
  ],
  restaurants: [
    ...baseColumns,
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      editable: true,
      inputType: 'google_places',
      required: true,
    },
    { key: 'city_id', header: 'City', sortable: true, editable: true, inputType: 'city_select' },
    {
      key: 'neighborhood_id',
      header: 'Neighborhood',
      sortable: true,
      editable: true,
      inputType: 'neighborhood_select',
    },
    {
      key: 'address',
      header: 'Address',
      sortable: false,
      editable: true,
      inputType: 'google_places',
    },
    { key: 'adds', header: 'Adds', sortable: true, editable: false },
    { key: 'created_at', header: 'Created', sortable: true, editable: false },
    { key: 'actions', header: '', sortable: false, editable: false, className: 'w-32' },
  ],
  dishes: [
    ...baseColumns,
    { key: 'name', header: 'Name', sortable: true, editable: true, required: true },
    {
      key: 'restaurant_id',
      header: 'Restaurant ID',
      sortable: true,
      editable: true,
      inputType: 'number',
      required: true,
    },
    { key: 'adds', header: 'Adds', sortable: true, editable: false },
    { key: 'created_at', header: 'Created', sortable: true, editable: false },
    { key: 'actions', header: '', sortable: false, editable: false, className: 'w-32' },
  ],
  lists: [
    ...baseColumns,
    { key: 'name', header: 'Name', sortable: true, editable: true, required: true },
    { key: 'list_type', header: 'Type', sortable: true, editable: true },
    { key: 'is_public', header: 'Public', sortable: true, editable: true, inputType: 'boolean' },
    { key: 'saved_count', header: 'Saves', sortable: true, editable: false },
    { key: 'item_count', header: 'Items', sortable: true, editable: false },
    { key: 'creator_handle', header: 'Creator', sortable: true, editable: false },
    { key: 'city_name', header: 'City', sortable: true, editable: true },
    { key: 'created_at', header: 'Created', sortable: true, editable: false },
    { key: 'actions', header: '', sortable: false, editable: false, className: 'w-32' },
  ],
  hashtags: [
    ...baseColumns,
    { key: 'name', header: 'Name', sortable: true, editable: true, required: true },
    { key: 'category', header: 'Category', sortable: true, editable: true },
    { key: 'created_at', header: 'Created', sortable: true, editable: false },
    { key: 'actions', header: '', sortable: false, editable: false, className: 'w-32' },
  ],
  users: [
    ...baseColumns,
    { key: 'username', header: 'Username', sortable: true, editable: true, required: true },
    { key: 'email', header: 'Email', sortable: true, editable: true, inputType: 'email' },
    {
      key: 'account_type',
      header: 'Type',
      sortable: true,
      editable: true,
      inputType: 'select',
      options: [
        { value: 'user', label: 'User' },
        { value: 'contributor', label: 'Contributor' },
        { value: 'superuser', label: 'Superuser' },
      ],
    },
    { key: 'created_at', header: 'Created', sortable: true, editable: false },
    { key: 'actions', header: '', sortable: false, editable: false, className: 'w-32' },
  ],
  neighborhoods: [
    ...baseColumns,
    { key: 'name', header: 'Name', sortable: true, editable: true, required: true },
    {
      key: 'city_id',
      header: 'City ID',
      sortable: true,
      editable: true,
      inputType: 'city_select',
      required: true,
    },
    {
      key: 'zipcode_ranges',
      header: 'Zipcodes',
      sortable: false,
      editable: true,
      inputType: 'text',
    },
    { key: 'created_at', header: 'Created', sortable: true, editable: false },
    { key: 'actions', header: '', sortable: false, editable: false, className: 'w-32' },
  ],
};

// --- Permission Constants ---
const ALLOWED_MUTATE_TYPES = ['submissions', 'restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods'];
const ALLOWED_EDIT_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods'];
const ALLOWED_ADD_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods'];
const ALLOWED_BULK_EDIT_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods'];

// --- Zipcode Parsing Helper ---
const parseZipcodeRanges = (value: unknown): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((zip) => zip.trim()).filter(Boolean);
  }
  return [];
};

// --- Main Component ---
const AdminTable: React.FC<AdminTableProps> = ({
  data = [],
  type = 'submissions',
  sort = '',
  onSortChange,
  onDataMutated,
  isLoading = false,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading, checkAuthStatus } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      checkAuthStatus: state.checkAuthStatus,
    }))
  );

  // Fetch Cities and Neighborhoods
  const { data: cities = [], error: citiesError } = useQuery<City[], Error>({
    queryKey: ['adminCitiesSimple'],
    queryFn: adminService.getAdminCitiesSimple,
    staleTime: Infinity,
    placeholderData: [],
    onError: (err) => console.error('[AdminTable] Error fetching cities:', err),
  });

  const {
    data: neighborhoodsData,
    error: neighborhoodsError,
    refetch,
    isLoading: neighborhoodsLoading,
    isFetching: neighborhoodsFetching,
  } = useQuery<{ data: Neighborhood[] }, Error>({
    queryKey: ['adminNeighborhoods'],
    queryFn: () => adminService.getAdminNeighborhoods(),
    staleTime: 0,
    cacheTime: 0,
    placeholderData: { data: [] },
    enabled: isAuthenticated && !authLoading,
    onError: (err) => {
      if (err.message?.includes('Authentication required')) navigate('/login');
    },
  });

  const neighborhoods = useMemo(
    () => (Array.isArray(neighborhoodsData?.data) ? neighborhoodsData.data : []),
    [neighborhoodsData]
  );

  // Use Custom Hook
  const {
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
  } = useAdminTableState({
    initialData: data,
    type,
    columns: columnConfig[type] || [],
    cities,
    neighborhoods,
    onDataMutated,
  });

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/login');
  }, [isAuthenticated, authLoading, navigate]);

  // Process Data
  const getCityName = useCallback(
    (cityId: number) => {
      const city = cities.find((c) => c.id === cityId);
      return city ? city.name : 'Unknown';
    },
    [cities]
  );

  const getNeighborhoodName = useCallback(
    (neighborhoodId: number) => {
      const neighborhood = neighborhoods.find((n) => n.id === neighborhoodId);
      return neighborhood ? neighborhood.name : 'Unknown';
    },
    [neighborhoods]
  );

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((row) => {
      const processed = { ...row };
      if (row.city_id && !row.city_name && cities.length > 0) {
        processed.city_name = getCityName(row.city_id);
      }
      if (row.neighborhood_id && !row.neighborhood_name && neighborhoods.length > 0) {
        processed.neighborhood_name = getNeighborhoodName(row.neighborhood_id);
      }
      processed.zipcode_ranges = parseZipcodeRanges(row.zipcode_ranges);
      return processed;
    });
  }, [data, cities, neighborhoods, getCityName, getNeighborhoodName]);

  // Enhance Column Config
  const enhancedColumnConfig = useMemo(() => {
    const config = { ...columnConfig };
    if (config.restaurants) {
      config.restaurants = config.restaurants.map((col) => {
        if (col.key === 'city_id')
          return { ...col, render: (_val: number, row: any) => row.city_name || getCityName(row.city_id) };
        if (col.key === 'neighborhood_id')
          return {
            ...col,
            render: (_val: number, row: any) => row.neighborhood_name || getNeighborhoodName(row.neighborhood_id),
          };
        return col;
      });
    }
    if (config.neighborhoods) {
      config.neighborhoods = config.neighborhoods.map((col) => {
        if (col.key === 'city_id')
          return { ...col, render: (_val: number, row: any) => row.city_name || getCityName(row.city_id) };
        if (col.key === 'zipcode_ranges')
          return {
            ...col,
            render: (val: any) =>
              Array.isArray(val) && val.length > 0 ? (
                val.join(', ')
              ) : (
                <span className="text-gray-400 italic">None</span>
              ),
          };
        return col;
      });
    }
    return config;
  }, [getCityName, getNeighborhoodName]);

  // Current Columns
  const currentColumns = useMemo(() => {
    const baseCols = enhancedColumnConfig[type] || [];
    return [
      {
        key: 'select',
        header: (
          <input
            type="checkbox"
            checked={processedData.length > 0 && selectedRows.size === processedData.length && selectedRows.size > 0}
            onChange={(e) =>
              setSelectedRows(e.target.checked ? new Set(processedData.map((row) => row.id)) : new Set())
            }
            disabled={isLoading || isAdding || editingRowIds.size > 0 || isBulkEditing}
          />
        ),
        Cell: ({ row }: { row: any }) => (
          <input
            type="checkbox"
            checked={selectedRows.has(row.id)}
            onChange={(e) => {
              const newSet = new Set(selectedRows);
              if (e.target.checked) newSet.add(row.id);
              else newSet.delete(row.id);
              setSelectedRows(newSet);
            }}
            disabled={isLoading || isAdding || editingRowIds.has(row.id)}
          />
        ),
        className: 'w-10 text-center px-3 py-2.5',
        sortable: false,
        editable: false,
      },
      ...baseCols,
    ];
  }, [
    type,
    processedData,
    selectedRows,
    isLoading,
    isAdding,
    editingRowIds,
    isBulkEditing,
    enhancedColumnConfig,
    setSelectedRows,
  ]);

  // Permissions
  const canMutate = useMemo(() => ALLOWED_MUTATE_TYPES.includes(type), [type]);
  const canEdit = useMemo(() => ALLOWED_EDIT_TYPES.includes(type), [type]);
  const canAdd = useMemo(() => ALLOWED_ADD_TYPES.includes(type), [type]);
  const canBulkEdit = useMemo(() => ALLOWED_BULK_EDIT_TYPES.includes(type), [type]);
  const currentSortColumn = useMemo(
    () => sort?.split('_')[0] || (['users'].includes(type) ? 'id' : ['hashtags', 'neighborhoods'].includes(type) ? 'name' : 'created_at'),
    [sort, type]
  );
  const currentSortDirection = useMemo(
    () => sort?.split('_')[1] || (['hashtags', 'neighborhoods'].includes(type) ? 'asc' : 'desc'),
    [sort, type]
  );

  // --- Loading / Error States ---
  if (authLoading || neighborhoodsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-[#A78B71]" />
      </div>
    );
  }
  if (citiesError) return <ErrorMessage message="Failed to load city data." />;
  if (neighborhoodsError && !neighborhoodsFetching)
    return <ErrorMessage message={neighborhoodsError.message || 'Failed to load neighborhood data.'} onRetry={refetch} />;

  // --- Render ---
  return (
    <>
      {canBulkEdit && (editingRowIds.size > 0 || selectedRows.size > 0) && (
        <div className="mb-4 flex flex-wrap justify-end items-center gap-2 p-2 border rounded-md bg-gray-50">
          <span className="text-sm text-gray-600 mr-auto">
            {isBulkEditing ? `${editingRowIds.size} row(s) in edit mode.` : `${selectedRows.size} row(s) selected.`}
          </span>
          {bulkSaveError && (
            <div className="w-full md:w-auto text-xs text-red-600 bg-red-100 border border-red-200 rounded p-1 text-center md:text-left">
              <span className="font-semibold">Bulk Save Error:</span> {bulkSaveError}
            </div>
          )}
          {isBulkEditing ? (
            <>
              <Button
                onClick={handleSaveAllEdits}
                size="sm"
                variant="primary"
                disabled={isSaving}
                isLoading={isSaving}
                className="flex items-center gap-1"
              >
                <Save size={16} /> Save All Changes
              </Button>
              <Button
                onClick={handleCancelBulkEdit}
                size="sm"
                variant="tertiary"
                disabled={isSaving}
                className="flex items-center gap-1"
              >
                <XCircle size={16} /> Cancel Bulk Edit
              </Button>
            </>
          ) : (
            <Button
              onClick={handleBulkEdit}
              size="sm"
              variant="secondary"
              disabled={isLoading || isAdding || selectedRows.size === 0 || isSaving}
              className="whitespace-nowrap flex items-center gap-1"
            >
              <Edit size={16} /> Bulk Edit Selected ({selectedRows.size})
            </Button>
          )}
        </div>
      )}
      {error && <div className="mb-4"><ErrorMessage message={error} onRetry={() => setError(null)} /></div>}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm relative bg-white">
        {isLoading && !processedData?.length && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20 rounded-lg">
            <Loader2 className="animate-spin h-8 w-8 text-[#A78B71]" />
          </div>
        )}
        {isLoading && processedData?.length > 0 && (
          <div className="absolute top-2 right-2 z-20 text-gray-400" title="Refreshing data...">
            <Loader2 className="animate-spin h-4 w-4" />
          </div>
        )}
        <table className="min-w-full text-sm table-auto divide-y divide-gray-200">
          <TableHeader
            columns={currentColumns}
            currentSortColumn={currentSortColumn}
            currentSortDirection={currentSortDirection}
            onSortChange={onSortChange}
            type={type}
            isAdding={isAdding}
            editingRowIds={editingRowIds}
          />
          <tbody className="divide-y divide-gray-100">
            {isAdding && (
              <AddRow
                columns={currentColumns.filter((c) => c.key !== 'select')}
                newRowData={editFormData['__NEW_ROW__'] || {}}
                setNewRowData={(fieldKey, newValue) => handleRowDataChange('__NEW_ROW__', { [fieldKey]: newValue })}
                isSaving={isSaving}
                setIsSaving={() => {}} // Dummy setter, managed by hook
                setError={setError}
                onSave={handleSaveNewRow}
                type={type}
                cities={cities}
                neighborhoods={neighborhoods}
                setIsAdding={handleCancelAdd}
              />
            )}
            {!isAdding && (!processedData || processedData.length === 0) ? (
              <tr>
                <td colSpan={currentColumns.length} className="text-center text-gray-500 py-8 italic">
                  No {type} found matching criteria.
                </td>
              </tr>
            ) : (
              !isAdding &&
              processedData.map((row) => {
                const isEditingThisRow = editingRowIds.has(row.id);
                return (
                  <AdminTableRow
                    key={row.id}
                    row={row}
                    columns={currentColumns}
                    isEditing={isEditingThisRow}
                    isSaving={isSaving}
                    editFormData={editFormData}
                    actionState={actionState}
                    editError={editError}
                    selectedRows={selectedRows}
                    onDataChange={handleRowDataChange}
                    handleStartEdit={handleStartEdit}
                    handleCancelEdit={handleCancelEdit}
                    handleSaveEdit={handleSaveEdit}
                    handleDeleteClick={handleDeleteClick}
                    handleApprove={handleApprove}
                    handleReject={handleReject}
                    type={type}
                    canEdit={canEdit}
                    canMutate={canMutate}
                    cities={cities}
                    neighborhoods={neighborhoods}
                    setEditError={setEditError}
                    setError={setError}
                    setActionState={setActionState}
                    setEditingRowIds={setEditingRowIds}
                    setConfirmDeleteInfo={setConfirmDeleteInfo}
                    onDataMutated={onDataMutated}
                    isBulkEditing={isBulkEditing}
                    isAdding={isAdding}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {canAdd && !isAdding && !isBulkEditing && (
        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleStartAdd}
            variant="primary"
            size="sm"
            disabled={editingRowIds.size > 0 || isSaving}
          >
            Add New {type.slice(0, -1)}
          </Button>
        </div>
      )}
      <ConfirmationDialog
        isOpen={confirmDeleteInfo.isOpen}
        onClose={() => setConfirmDeleteInfo({ isOpen: false, id: null, itemType: '' })}
        onConfirm={handleDeleteConfirm}
        title="Confirm Deletion"
        isLoading={actionState.deletingId === confirmDeleteInfo.id}
      >
        Are you sure you want to delete this {confirmDeleteInfo.itemType.slice(0, -1)} (ID: {confirmDeleteInfo.id})? This
        action cannot be undone.
      </ConfirmationDialog>
    </>
  );
};

export default AdminTable;