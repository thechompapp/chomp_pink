/* src/pages/AdminPanel/AdminTable.jsx */
import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService.js';
import TableHeader from './TableHeader.jsx';
import AdminTableRow from './AdminTableRow.jsx';
import AddRow from './AddRow.jsx';
import ConfirmationDialog from '@/components/UI/ConfirmationDialog.jsx';
import ErrorMessage from '@/components/UI/ErrorMessage.jsx';
import Button from '@/components/UI/Button.jsx';
import Input from '@/components/UI/Input.jsx';
import Select from '@/components/UI/Select.jsx';
import Modal from '@/components/UI/Modal.jsx';
import useFormHandler from '@/hooks/useFormHandler.js';
import { Loader2, Edit, Save, XCircle, Plus, Info, X as IconX, Link as LinkIcon } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '@/stores/useAuthStore';
import { useShallow } from 'zustand/react/shallow';
import { useAdminTableState } from '@/hooks/useAdminTableState.js';
import apiClient from '@/services/apiClient.js';

// --- Column Definitions (Keep as defined before) ---
const baseColumns = [ { key: 'id', header: 'ID', sortable: true, editable: false, className: 'w-16 text-gray-500' }, ];
const columnConfig = { submissions: [ ...baseColumns, { key: 'type', header: 'Type', sortable: true, editable: false }, { key: 'name', header: 'Name', sortable: true, editable: false }, { key: 'user_handle', header: 'Submitted By', sortable: true, editable: false }, { key: 'status', header: 'Status', sortable: true, editable: false }, { key: 'created_at', header: 'Submitted', sortable: true, editable: false, inputType: 'datetime' }, { key: 'actions', header: '', sortable: false, editable: false, className: 'w-32' }, ], restaurants: [ ...baseColumns, { key: 'name', header: 'Name', sortable: true, editable: true, inputType: 'google_places', required: true }, { key: 'city_id', header: 'City', sortable: true, editable: true, inputType: 'city_select', required: true }, { key: 'neighborhood_id', header: 'Neighborhood', sortable: true, editable: true, inputType: 'neighborhood_select' }, { key: 'address', header: 'Address', sortable: false, editable: true, inputType: 'text' }, { key: 'adds', header: 'Adds', sortable: true, editable: false, render: (val) => String(val ?? 0) }, { key: 'created_at', header: 'Created', sortable: true, editable: false, inputType: 'datetime' }, { key: 'actions', header: '', sortable: false, editable: false, className: 'w-32' }, ], dishes: [ ...baseColumns, { key: 'name', header: 'Name', sortable: true, editable: true, required: true }, { key: 'restaurant_name', header: 'Restaurant', sortable: true, editable: true, inputType: 'restaurant_autocomplete', required: true }, { key: 'adds', header: 'Adds', sortable: true, editable: false, render: (val) => String(val ?? 0) }, { key: 'created_at', header: 'Created', sortable: true, editable: false, inputType: 'datetime' }, { key: 'actions', header: '', sortable: false, editable: false, className: 'w-32' }, ], lists: [ ...baseColumns, { key: 'name', header: 'Name', sortable: true, editable: false, render: (val, row) => (<Link to={`/lists/${row.id}`} className="text-blue-600 hover:underline">{val || `List ${row.id}`}</Link>) }, { key: 'list_type', header: 'Type', sortable: true, editable: false, render: (val) => val ? val.charAt(0).toUpperCase() + val.slice(1) : 'N/A' }, { key: 'is_public', header: 'Public', sortable: true, editable: false, render: (val) => (val ? 'Yes' : 'No') }, { key: 'saved_count', header: 'Saves', sortable: true, editable: false }, { key: 'item_count', header: 'Items', sortable: true, editable: false }, { key: 'creator_handle', header: 'Creator', sortable: true, editable: false }, { key: 'city_name', header: 'City', sortable: true, editable: false }, { key: 'created_at', header: 'Created', sortable: true, editable: false, inputType: 'datetime' }, { key: 'actions', header: '', sortable: false, editable: false, className: 'w-32' }, ], hashtags: [ ...baseColumns, { key: 'name', header: 'Name', sortable: true, editable: true, required: true }, { key: 'category', header: 'Category', sortable: true, editable: true, inputType: 'text' }, { key: 'created_at', header: 'Created', sortable: true, editable: false, inputType: 'datetime' }, { key: 'actions', header: '', sortable: false, editable: false, className: 'w-32' }, ], users: [ ...baseColumns, { key: 'username', header: 'Username', sortable: true, editable: true, required: true }, { key: 'email', header: 'Email', sortable: true, editable: true, inputType: 'email' }, { key: 'account_type', header: 'Type', sortable: true, editable: true, inputType: 'select', options: [{ value: 'user', label: 'User' }, { value: 'contributor', label: 'Contributor' }, { value: 'superuser', label: 'Superuser' }, ], required: true }, { key: 'created_at', header: 'Created', sortable: true, editable: false, inputType: 'datetime' }, { key: 'actions', header: '', sortable: false, editable: false, className: 'w-32' }, ], neighborhoods: [ ...baseColumns, { key: 'name', header: 'Name', sortable: true, editable: true, required: true }, { key: 'city_id', header: 'City', sortable: true, editable: true, inputType: 'city_select', required: true }, { key: 'zipcode_ranges', header: 'Zipcodes', sortable: false, editable: true, inputType: 'text', render: (val) => Array.isArray(val) ? val.join(', ') : (val || '') }, { key: 'created_at', header: 'Created', sortable: true, editable: false, inputType: 'datetime' }, { key: 'actions', header: '', sortable: false, editable: false, className: 'w-32' }, ], };

// --- Permission Constants ---
const ALLOWED_MUTATE_TYPES = ['submissions', 'restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods'];
const ALLOWED_EDIT_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods'];
const ALLOWED_ADD_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods'];
const ALLOWED_BULK_EDIT_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods'];

// --- Main Component ---
const AdminTable = ({
  data = [],
  type = 'submissions',
  sort = '',
  onSortChange,
  onDataMutated,
  isLoading = false,
  cities: propCities = [],
  citiesError,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
    }))
  );

  const cities = useMemo(() => Array.isArray(propCities) ? propCities : [], [propCities]);

  // Fetch neighborhoods
  const { data: neighborhoodsData, error: neighborhoodsError, refetch: refetchNeighborhoods, isLoading: neighborhoodsLoading, isFetching: neighborhoodsFetching } = useQuery({ queryKey: ['allNeighborhoodsForAdmin'], queryFn: async () => { let allN = []; let p = 1; const l = 200; try { while (true) { const r = await apiClient(`/api/neighborhoods?page=${p}&limit=${l}`, `AdminTable Fetch Nb Page ${p}`); const d = r?.data; if (!r.success || !d || !Array.isArray(d.data)) { console.warn(`Inv Nb Resp p${p}:`, r); break; } allN = allN.concat(d.data); const pg = d.pagination; if (!pg || p >= pg.totalPages) break; p++; } } catch (e) { console.error('Err fetch all nb:', e); throw e; } return { data: allN }; }, staleTime: 300000, placeholderData: { data: [] }, enabled: isAuthenticated && !authLoading });
  const neighborhoods = useMemo(() => Array.isArray(neighborhoodsData?.data) ? neighborhoodsData.data : [], [neighborhoodsData]);

  const validInitialData = useMemo(() => Array.isArray(data) ? data : [], [data]);

  // ** HOOK CALL IS NOW AT THE TOP **
  const {
    editingRowIds, editFormData, editError, isSaving,
    actionState, error, confirmDeleteInfo, isAdding,
    selectedRows, isBulkEditing, bulkSaveError, updatedData,
    handleRowDataChange, handleStartEdit, handleCancelEdit, handleSaveEdit,
    handleStartAdd, handleCancelAdd, handleSaveNewRow,
    handleDeleteClick, handleDeleteConfirm, setConfirmDeleteInfo,
    handleApprove, handleReject,
    setSelectedRows, handleBulkEdit, handleCancelBulkEdit, handleSaveAllEdits,
    setError, setEditError, setActionState, setEditingRowIds,
    isListEditModalOpen, listToEditData, listEditError,
    handleCloseListEditModal, handleSaveListEdit,
  } = useAdminTableState({
    initialData: validInitialData,
    type,
    columns: columnConfig[type] || [], // Pass base config to hook
    cities, neighborhoods, onDataMutated,
  });

  // --- Data Processing and Memoization ---
  const getCityName = useCallback((cityId) => { const idNum = Number(cityId); const city = cities.find((c) => Number(c.id) === idNum); return city ? city.name : String(cityId || 'N/A'); },[cities]);
  const getNeighborhoodName = useCallback((neighborhoodId) => { const idNum = Number(neighborhoodId); const neighborhood = neighborhoods.find((n) => Number(n.id) === idNum); return neighborhood ? neighborhood.name : String(neighborhoodId || 'N/A'); },[neighborhoods]);

  const enhancedColumnConfig = useMemo(() => {
      const config = JSON.parse(JSON.stringify(columnConfig));
      const addRenderer = (cols, key, renderFn) => { if (!cols) return; const idx = cols.findIndex(c=>c.key===key); if (idx !== -1 && !cols[idx].render) cols[idx].render = renderFn; };
      addRenderer(config.restaurants, 'city_id', (_val, row) => row.city_name || getCityName(row.city_id));
      addRenderer(config.restaurants, 'neighborhood_id', (_val, row) => row.neighborhood_name || getNeighborhoodName(row.neighborhood_id));
      addRenderer(config.neighborhoods, 'city_id', (_val, row) => row.city_name || getCityName(row.city_id));
      Object.values(config).forEach(cols => { if (Array.isArray(cols)) { addRenderer(cols, 'created_at', (val) => val ? new Date(val).toLocaleString() : 'N/A'); addRenderer(cols, 'updated_at', (val) => val ? new Date(val).toLocaleString() : 'N/A'); } });
      return config;
  }, [type, getCityName, getNeighborhoodName]);

  const currentColumns = useMemo(() => {
      const baseCols = enhancedColumnConfig[type] || [];
      const selectCol = { key: 'select', header: ( <input type="checkbox" aria-label="Select all rows" className="h-4 w-4 rounded border-gray-300 text-[#A78B71] focus:ring-[#D1B399]" checked={updatedData.length > 0 && selectedRows.size === updatedData.length && selectedRows.size > 0} onChange={(e) => setSelectedRows(e.target.checked ? new Set(updatedData.map((row) => row?.id).filter(id => id != null)) : new Set())} disabled={isLoading || isAdding || editingRowIds.size > 0 || isBulkEditing}/> ), Cell: ({ row }) => ( <input type="checkbox" aria-label={`Select row ${row?.id}`} className="h-4 w-4 rounded border-gray-300 text-[#A78B71] focus:ring-[#D1B399]" checked={selectedRows.has(row?.id)} onChange={(e) => { const newSet = new Set(selectedRows); if (row?.id != null) { if (e.target.checked) newSet.add(row.id); else newSet.delete(row.id); } setSelectedRows(newSet); }} disabled={isLoading || isAdding || editingRowIds.has(row?.id)} /> ), className: 'w-10 text-center px-3 py-2.5', sortable: false, editable: false, };
      // console.log(`[AdminTable] Using ENHANCED Columns for type "${type}"`);
      return [ selectCol, ...baseCols ];
  }, [ type, updatedData, selectedRows, isLoading, isAdding, editingRowIds, isBulkEditing, enhancedColumnConfig, setSelectedRows ]);

  // Setup form handler for the List Edit Modal
  const { formData: listEditModalFormData, handleChange: handleListEditModalChange, handleSubmit: handleListEditModalSubmit, resetForm: resetListEditModalForm } = useFormHandler({});

  // Effect to populate modal form
  useEffect(() => {
      if (listToEditData) {
          // console.log("[AdminTable] Populating modal form with:", listToEditData); // Keep log if needed
          resetListEditModalForm({
              name: listToEditData.name || '',
              description: listToEditData.description || '',
              is_public: listToEditData.is_public ?? true,
              tags: Array.isArray(listToEditData.tags) ? listToEditData.tags.join(', ') : '',
              city_name: listToEditData.city_name || '',
              list_type: listToEditData.list_type || 'N/A'
          });
      }
  // ** MODIFIED Dependency Array: Use listToEditData?.id and stable resetForm **
  }, [listToEditData?.id, resetListEditModalForm]); // Only re-run if the ID changes or resetForm changes reference

  // Permissions, Sort State, Loading/Error States (Keep as before)
  useEffect(() => { if (!authLoading && !isAuthenticated) navigate('/login'); }, [isAuthenticated, authLoading, navigate]);
  const canMutate = useMemo(() => ALLOWED_MUTATE_TYPES.includes(type), [type]);
  const canEdit = useMemo(() => ALLOWED_EDIT_TYPES.includes(type), [type]);
  const canAdd = useMemo(() => ALLOWED_ADD_TYPES.includes(type), [type]);
  const canBulkEdit = useMemo(() => ALLOWED_BULK_EDIT_TYPES.includes(type), [type]);
  const currentSortColumn = useMemo(() => sort?.split('_')[0] || (type === 'users' ? 'id' : ['hashtags', 'neighborhoods', 'restaurants', 'dishes', 'lists'].includes(type) ? 'name' : 'created_at'), [sort, type]);
  const currentSortDirection = useMemo(() => sort?.split('_')[1] || (['hashtags', 'neighborhoods', 'restaurants', 'dishes', 'lists'].includes(type) ? 'asc' : 'desc'), [sort, type]);
  if (authLoading || neighborhoodsLoading) { return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8 text-[#A78B71]" /></div>; }
  if (citiesError) return <ErrorMessage message={citiesError || "Failed to load city data."} />;
  if (neighborhoodsError && !neighborhoodsFetching) return <ErrorMessage message={neighborhoodsError.message || 'Failed to load neighborhood data.'} onRetry={refetchNeighborhoods} />;

  // --- Render ---
  // console.log(`[AdminTable] Rendering tbody for type "${type}". isAdding: ${isAdding}, updatedData valid: ${Array.isArray(updatedData)}, length: ${updatedData?.length ?? 'N/A'}`);

  return (
    <>
      {/* CONTROLS ROW (Keep as before) */}
      <div className="mb-4 flex flex-wrap justify-end items-center gap-2"> {canAdd && !isAdding && !isBulkEditing && ( <Button onClick={handleStartAdd} variant="primary" size="sm" disabled={editingRowIds.size > 0 || isSaving} className="flex items-center gap-1"> <Plus size={16} /> Add New {type.slice(0, -1)} </Button> )} {canBulkEdit && (editingRowIds.size > 0 || selectedRows.size > 0) && ( <div className={`flex flex-wrap justify-end items-center gap-2 p-2 border rounded-md bg-gray-50 ${canAdd && !isAdding && !isBulkEditing ? 'ml-auto' : 'w-full'}`}> {/* ... bulk controls ... */ } {bulkSaveError && <p className="text-xs text-red-600">{bulkSaveError}</p>} </div> )} </div>

      {/* General Error (Keep as before) */}
      {error && <div className="mb-4"><ErrorMessage message={error} onRetry={() => setError(null)} /></div>}

      {/* Table Container */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm relative bg-white">
        {/* Loading Indicators (Keep as before) */}
        {(isLoading && !updatedData?.length) && ( <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20 rounded-lg"><Loader2 className="animate-spin h-8 w-8 text-[#A78B71]" /></div> )}
        {isLoading && updatedData?.length > 0 && ( <div className="absolute top-2 right-2 z-20 text-gray-400" title="Refreshing data..."><Loader2 className="animate-spin h-4 w-4" /></div> )}

        <table className="min-w-full text-sm table-auto divide-y divide-gray-200">
          <TableHeader columns={currentColumns} currentSortColumn={currentSortColumn} currentSortDirection={currentSortDirection} onSortChange={onSortChange} type={type} isAdding={isAdding} editingRowIds={editingRowIds} />
          <tbody className="divide-y divide-gray-100">
            {isAdding && ( <AddRow columns={currentColumns.filter((c) => c.key !== 'select')} newRowData={editFormData['__NEW_ROW__'] || {}} setNewRowData={(fieldKey, newValue) => handleRowDataChange('__NEW_ROW__', { [fieldKey]: newValue })} isSaving={isSaving} setIsSaving={() => {}} setError={setError} onSave={handleSaveNewRow} type={type} cities={cities} neighborhoods={neighborhoods} setIsAdding={handleCancelAdd} /> )}

            {/* Mapping Logic (Keep row validation checks) */}
            {!isAdding && (!Array.isArray(updatedData) || updatedData.length === 0) ? (
              <tr><td colSpan={currentColumns.length} className="text-center text-gray-500 py-8 italic">No {type} found matching criteria.</td></tr>
            ) : (
              !isAdding && Array.isArray(updatedData) && updatedData.map((row, index) => {
                // Row validation checks (Keep as before)
                if (!row || typeof row !== 'object') { console.warn(`[AdminTable] Skipping invalid row at index ${index}:`, row); return <tr key={`invalid-row-${index}`}><td colSpan={currentColumns.length} className="text-red-500 italic px-3 py-2">Error: Invalid row data</td></tr>; }
                if (row.id == null) { console.warn(`[AdminTable] Skipping row with missing ID at index ${index}:`, row); return <tr key={`missing-id-row-${index}`}><td colSpan={currentColumns.length} className="text-orange-500 italic px-3 py-2">Warn: Row missing ID</td></tr>; }
                const isEditingThisRow = editingRowIds.has(row.id);
                return ( <AdminTableRow
                            key={row.id} row={row} columns={currentColumns}
                            isEditing={type !== 'lists' && isEditingThisRow}
                            isSaving={isSaving} editFormData={editFormData}
                            actionState={actionState}
                            editError={(type !== 'lists' && isEditingThisRow) ? editError : null}
                            selectedRows={selectedRows} onDataChange={handleRowDataChange}
                            handleStartEdit={handleStartEdit} handleCancelEdit={handleCancelEdit}
                            handleSaveEdit={handleSaveEdit} handleDeleteClick={handleDeleteClick}
                            handleApprove={handleApprove} handleReject={handleReject}
                            type={type} canEdit={canEdit} canMutate={canMutate}
                            cities={cities} neighborhoods={neighborhoods}
                            setEditError={setEditError} setError={setError}
                            setActionState={setActionState} setEditingRowIds={setEditingRowIds}
                            setConfirmDeleteInfo={setConfirmDeleteInfo} onDataMutated={onDataMutated}
                            isBulkEditing={isBulkEditing} isAdding={isAdding}
                        />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog (Keep as before) */}
      <ConfirmationDialog isOpen={confirmDeleteInfo.isOpen} onClose={() => setConfirmDeleteInfo({ isOpen: false, id: null, itemType: '' })} onConfirm={handleDeleteConfirm} title="Confirm Deletion" isLoading={actionState.deletingId === confirmDeleteInfo.id} > Are you sure you want to delete this {confirmDeleteInfo.itemType?.slice(0, -1)} (ID: {confirmDeleteInfo.id})? This action cannot be undone. </ConfirmationDialog>

      {/* List Edit Modal (Keep form bindings as before) */}
       {listToEditData && ( <Modal isOpen={isListEditModalOpen && !!listToEditData} onClose={handleCloseListEditModal} title={`Edit List: ${listToEditData?.name || ''}`}> {listToEditData ? ( <form onSubmit={(e) => { e.preventDefault(); handleListEditModalSubmit(() => handleSaveListEdit(listToEditData.id, listEditModalFormData)); }} className="p-4 space-y-4"> <div> <label htmlFor="list-edit-name" className="block text-sm font-medium text-gray-700 mb-1">List Name*</label> <Input id="list-edit-name" name="name" type="text" required value={listEditModalFormData.name ?? ''} onChange={handleListEditModalChange} disabled={isSaving} /> </div> <div> <label htmlFor="list-edit-desc" className="block text-sm font-medium text-gray-700 mb-1">Description</label> <textarea id="list-edit-desc" name="description" rows="3" value={listEditModalFormData.description ?? ''} onChange={handleListEditModalChange} disabled={isSaving} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-[#D1B399] focus:border-[#D1B399] sm:text-sm disabled:opacity-60 disabled:bg-gray-100" /> </div> <div> <label htmlFor="list-edit-city" className="block text-sm font-medium text-gray-700 mb-1">City Name</label> <Input id="list-edit-city" name="city_name" type="text" value={listEditModalFormData.city_name ?? ''} onChange={handleListEditModalChange} disabled={isSaving} /> </div> <div> <label htmlFor="list-edit-tags" className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label> <Input id="list-edit-tags" name="tags" type="text" value={listEditModalFormData.tags ?? ''} onChange={handleListEditModalChange} disabled={isSaving} /> </div> <div> <label className="block text-sm font-medium text-gray-700 mb-1">List Type</label> <p className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-md capitalize">{listEditModalFormData.list_type || 'N/A'}</p> <p className="text-xs text-gray-400 mt-1">List type cannot be changed.</p> </div> <div className="flex items-center justify-start pt-1"> <label className={`flex items-center mr-3 ${isSaving ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}> <div className="relative"> <input type="checkbox" name="is_public" checked={listEditModalFormData.is_public ?? true} onChange={handleListEditModalChange} className="sr-only peer" disabled={isSaving}/> <div className="block bg-gray-300 peer-checked:bg-[#D1B399] w-10 h-6 rounded-full transition"></div> <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform peer-checked:translate-x-4"></div> </div> <span className="ml-2 text-sm text-gray-700 select-none">{listEditModalFormData.is_public ?? true ? 'Public' : 'Private'}</span> </label> <span className="text-xs text-gray-500 flex items-center"><Info size={13} className="mr-1 flex-shrink-0"/> Public lists may appear...</span> </div> {listEditError && ( <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 text-center">{listEditError}</p> )} <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100"> <Button type="button" onClick={handleCloseListEditModal} variant="tertiary" size="sm" disabled={isSaving}> Cancel </Button> <Button type="submit" variant="primary" size="sm" isLoading={isSaving} disabled={isSaving} className="flex items-center justify-center min-w-[80px]"> {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'} </Button> </div> </form> ) : ( <p>Loading list data...</p> )} </Modal> )}
    </>
  );
};

export default AdminTable;