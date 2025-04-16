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

// --- Column Definitions ---
const baseColumns = [ { key: 'id', header: 'ID', sortable: true, editable: false, className: 'w-16 text-gray-500' }, ];
// *** VERIFY 'cities' ENTRY ***
const columnConfig = {
    submissions: [
        // ... submissions columns ...
        ...baseColumns,
        { key: 'type', header: 'Type', sortable: true, editable: false, className: 'capitalize w-24' },
        { key: 'name', header: 'Name', sortable: true, editable: false },
        { key: 'user_handle', header: 'Submitted By', sortable: true, editable: false, render: (val) => val ? `@${val}` : <span className="text-gray-400 italic">N/A</span> },
        { key: 'status', header: 'Status', sortable: true, editable: false, render: (status) => (<span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${ status === 'approved' ? 'bg-green-100 text-green-800' : status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800' }`}>{status}</span>) },
        { key: 'created_at', header: 'Submitted', sortable: true, editable: false, inputType: 'datetime' },
        { key: 'actions', header: '', sortable: false, editable: false, className: 'w-32 text-right' },
    ],
    restaurants: [
        // ... restaurants columns ...
        ...baseColumns,
        { key: 'name', header: 'Name', sortable: true, editable: true, inputType: 'google_places', required: true },
        { key: 'city_id', header: 'City', sortable: true, editable: true, inputType: 'city_select', required: true },
        { key: 'neighborhood_id', header: 'Neighborhood', sortable: true, editable: true, inputType: 'neighborhood_select' },
        { key: 'address', header: 'Address', sortable: false, editable: true, inputType: 'text' },
        { key: 'adds', header: 'Adds', sortable: true, editable: false, render: (val) => String(val ?? 0) },
        { key: 'created_at', header: 'Created', sortable: true, editable: false, inputType: 'datetime' },
        { key: 'actions', header: '', sortable: false, editable: false, className: 'w-32 text-right' },
    ],
    dishes: [
        // ... dishes columns ...
        ...baseColumns,
        { key: 'name', header: 'Name', sortable: true, editable: true, required: true },
        { key: 'restaurant_name', header: 'Restaurant', sortable: true, editable: true, inputType: 'restaurant_autocomplete', required: true },
        { key: 'adds', header: 'Adds', sortable: true, editable: false, render: (val) => String(val ?? 0) },
        { key: 'created_at', header: 'Created', sortable: true, editable: false, inputType: 'datetime' },
        { key: 'actions', header: '', sortable: false, editable: false, className: 'w-32 text-right' },
    ],
    lists: [
        // ... lists columns ...
        ...baseColumns,
        { key: 'name', header: 'Name', sortable: true, editable: false, render: (val, row) => (<Link to={`/lists/${row.id}`} className="text-blue-600 hover:underline">{val || `List ${row.id}`}</Link>) },
        { key: 'list_type', header: 'Type', sortable: true, editable: false, render: (val) => val ? val.charAt(0).toUpperCase() + val.slice(1) : 'N/A' },
        { key: 'is_public', header: 'Public', sortable: true, editable: false, render: (val) => (val ? 'Yes' : 'No') },
        { key: 'saved_count', header: 'Saves', sortable: true, editable: false },
        { key: 'item_count', header: 'Items', sortable: true, editable: false },
        { key: 'creator_handle', header: 'Creator', sortable: true, editable: false },
        { key: 'city_name', header: 'City', sortable: true, editable: false },
        { key: 'created_at', header: 'Created', sortable: true, editable: false, inputType: 'datetime' },
        { key: 'actions', header: '', sortable: false, editable: false, className: 'w-32 text-right' },
    ],
    hashtags: [
        // ... hashtags columns ...
        ...baseColumns,
        { key: 'name', header: 'Name', sortable: true, editable: true, required: true },
        { key: 'category', header: 'Category', sortable: true, editable: true, inputType: 'text' },
        { key: 'created_at', header: 'Created', sortable: true, editable: false, inputType: 'datetime' },
        { key: 'actions', header: '', sortable: false, editable: false, className: 'w-32 text-right' },
    ],
    users: [
        // ... users columns ...
         ...baseColumns,
        { key: 'username', header: 'Username', sortable: true, editable: true, required: true },
        { key: 'email', header: 'Email', sortable: true, editable: true, inputType: 'email' },
        { key: 'account_type', header: 'Type', sortable: true, editable: true, inputType: 'select', options: [{ value: 'user', label: 'User' }, { value: 'contributor', label: 'Contributor' }, { value: 'superuser', label: 'Superuser' }, ], required: true },
        { key: 'created_at', header: 'Created', sortable: true, editable: false, inputType: 'datetime' },
        { key: 'actions', header: '', sortable: false, editable: false, className: 'w-32 text-right' },
    ],
    neighborhoods: [
        // ... neighborhoods columns ...
         ...baseColumns,
        { key: 'name', header: 'Name', sortable: true, editable: true, required: true },
        { key: 'city_id', header: 'City', sortable: true, editable: true, inputType: 'city_select', required: true },
        { key: 'zipcode_ranges', header: 'Zipcodes', sortable: false, editable: true, inputType: 'text', render: (val) => Array.isArray(val) ? val.join(', ') : (val || '') },
        { key: 'created_at', header: 'Created', sortable: true, editable: false, inputType: 'datetime' },
        { key: 'actions', header: '', sortable: false, editable: false, className: 'w-32 text-right' },
    ],
    cities: [ // *** ENSURE THIS ENTRY EXISTS ***
        ...baseColumns,
        { key: 'name', header: 'Name', sortable: true, editable: true, required: true },
        { key: 'created_at', header: 'Created', sortable: true, editable: false, inputType: 'datetime' },
        { key: 'updated_at', header: 'Updated', sortable: true, editable: false, inputType: 'datetime' },
        { key: 'actions', header: '', sortable: false, editable: false, className: 'w-32 text-right' },
    ],
};

// --- Permission Constants ---
// *** VERIFY THESE ARRAYS ***
const ALLOWED_MUTATE_TYPES = ['submissions', 'restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods', 'cities'];
const ALLOWED_EDIT_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods', 'cities'];
const ALLOWED_ADD_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods', 'cities'];
const ALLOWED_BULK_EDIT_TYPES = ['restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods', 'cities'];

// ... (rest of AdminTable component) ...

const AdminTable = ({
  data = [],
  type = 'submissions',
  sort = '',
  onSortChange,
  onDataMutated,
  isLoading = false, // This is the isFetching state from the parent's main data query
  cities: propCities = [],
  citiesError,
}) => {
  // ... (hook calls, state, effects, etc.) ...
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore(
    useShallow((state) => ({
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading
    }))
  );

  const cities = useMemo(() => Array.isArray(propCities) ? propCities : [], [propCities]);

  // Fetch ALL neighborhoods efficiently for dropdowns
  const {
      data: allNeighborhoodsData,
      error: neighborhoodsError,
      isLoading: neighborhoodsLoading,
      isFetching: neighborhoodsFetching
  } = useQuery({
      queryKey: ['allAdminNeighborhoods'],
      queryFn: async () => {
          console.log("[AdminTable] Fetching ALL neighborhoods for dropdowns...");
          try {
              const response = await adminService.getAdminData('neighborhoods', { limit: 200 }); // Use 200 limit
              if (response.success && Array.isArray(response.data)) {
                  console.log(`[AdminTable] Fetched ${response.data.length} total neighborhoods.`);
                  if (response.pagination && response.pagination.total > response.data.length) {
                      console.warn(`[AdminTable] Fetched only ${response.data.length} of ${response.pagination.total} neighborhoods. Backend limit is 200.`);
                  }
                  return response.data;
              } else {
                  console.error("[AdminTable] Failed to fetch all neighborhoods:", response.error);
                  throw new Error(response.error || "Could not fetch all neighborhoods");
              }
          } catch (err) {
               console.error("[AdminTable] Error in fetching all neighborhoods:", err);
               throw err;
          }
      },
      staleTime: 10 * 60 * 1000,
      placeholderData: [],
      enabled: isAuthenticated && !authLoading && (type === 'restaurants' || type === 'neighborhoods'),
  });
  const allNeighborhoods = useMemo(() => Array.isArray(allNeighborhoodsData) ? allNeighborhoodsData : [], [allNeighborhoodsData]);

  const validInitialData = useMemo(() => Array.isArray(data) ? data : [], [data]);

  // --- Hook Call ---
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
    columns: columnConfig[type] || [],
    cities: cities,
    neighborhoods: allNeighborhoods,
    onDataMutated,
  });

  // --- Data Processing and Memoization ---
  const getCityName = useCallback((cityId) => { const idNum = Number(cityId); const city = cities.find((c) => Number(c.id) === idNum); return city ? city.name : String(cityId || 'N/A'); },[cities]);
  const getNeighborhoodName = useCallback((neighborhoodId) => { const idNum = Number(neighborhoodId); const neighborhood = allNeighborhoods.find((n) => Number(n.id) === idNum); return neighborhood ? neighborhood.name : String(neighborhoodId || 'N/A'); },[allNeighborhoods]);

  const enhancedColumnConfig = useMemo(() => {
    const config = JSON.parse(JSON.stringify(columnConfig));
    const addRenderer = (cols, key, renderFn) => { if (!cols) return; const idx = cols.findIndex(c => c.key === key); if (idx !== -1 && !cols[idx].render) cols[idx].render = renderFn; };
    addRenderer(config.restaurants, 'city_id', (_val, row) => row.city_name || getCityName(row.city_id));
    addRenderer(config.restaurants, 'neighborhood_id', (_val, row) => row.neighborhood_name || getNeighborhoodName(row.neighborhood_id));
    addRenderer(config.neighborhoods, 'city_id', (_val, row) => row.city_name || getCityName(row.city_id));
    Object.values(config).forEach(cols => {
      if (Array.isArray(cols)) {
        addRenderer(cols, 'created_at', (val) => val ? new Date(val).toLocaleString() : 'N/A');
        addRenderer(cols, 'updated_at', (val) => val ? new Date(val).toLocaleString() : 'N/A');
      }
    });
    return config;
  }, [type, getCityName, getNeighborhoodName]);

  const currentColumns = useMemo(() => {
    const baseCols = enhancedColumnConfig[type] || [];
    const selectDisabled = isAdding || editingRowIds.size > 0 || isBulkEditing || isLoading;
    const selectCol = {
        key: 'select',
        header: ( <input type="checkbox" aria-label="Select all rows" className="h-4 w-4 rounded border-gray-300 text-[#A78B71] focus:ring-[#D1B399]" checked={updatedData.length > 0 && selectedRows.size === updatedData.length && selectedRows.size > 0} onChange={(e) => setSelectedRows(e.target.checked ? new Set(updatedData.map((row) => row?.id).filter(id => id != null)) : new Set())} disabled={selectDisabled}/> ),
        Cell: ({ row }) => ( <input type="checkbox" aria-label={`Select row ${row?.id}`} className="h-4 w-4 rounded border-gray-300 text-[#A78B71] focus:ring-[#D1B399]" checked={selectedRows.has(row?.id)} onChange={(e) => { const newSet = new Set(selectedRows); if (row?.id != null) { if (e.target.checked) newSet.add(row.id); else newSet.delete(row.id); } setSelectedRows(newSet); }} disabled={selectDisabled || editingRowIds.has(row?.id)} /> ),
        className: 'w-10 text-center px-3 py-2.5',
        sortable: false, editable: false,
    };
    return [ selectCol, ...baseCols ];
  }, [ type, updatedData, selectedRows, isLoading, isAdding, editingRowIds, isBulkEditing, enhancedColumnConfig, setSelectedRows ]);

  // --- List Edit Modal Form Handler ---
  const { formData: listEditModalFormData, handleChange: handleListEditModalChange, handleSubmit: handleListEditModalSubmit, resetForm: resetListEditModalForm } = useFormHandler({});
  useEffect(() => {
      if (listToEditData) {
          resetListEditModalForm({
              name: listToEditData.name || '',
              description: listToEditData.description || '',
              is_public: listToEditData.is_public ?? true,
              list_type: listToEditData.list_type || listToEditData.type || 'mixed',
              tags: Array.isArray(listToEditData.tags) ? listToEditData.tags.join(', ') : '',
              city_name: listToEditData.city_name || '',
          });
      }
  }, [listToEditData, resetListEditModalForm]);


  // --- Permissions, Sort State ---
  const canMutate = useMemo(() => ALLOWED_MUTATE_TYPES.includes(type), [type]); // Verify type inclusion
  const canEdit = useMemo(() => ALLOWED_EDIT_TYPES.includes(type), [type]); // Verify type inclusion
  const canAdd = useMemo(() => ALLOWED_ADD_TYPES.includes(type), [type]); // Verify type inclusion
  const canBulkEdit = useMemo(() => ALLOWED_BULK_EDIT_TYPES.includes(type), [type]); // Verify type inclusion
  // *** VERIFY 'cities' in sort logic ***
  const currentSortColumn = useMemo(() => sort?.split('_')[0] || (type === 'users' ? 'id' : ['hashtags', 'neighborhoods', 'restaurants', 'dishes', 'lists', 'cities'].includes(type) ? 'name' : 'created_at'), [sort, type]);
  const currentSortDirection = useMemo(() => sort?.split('_')[1] || (['hashtags', 'neighborhoods', 'restaurants', 'dishes', 'lists', 'cities'].includes(type) ? 'asc' : 'desc'), [sort, type]);

  // --- Loading / Error States ---
  const isNeighborhoodLookupLoading = neighborhoodsLoading || neighborhoodsFetching;
  const isMainDataLoading = isLoading;
  const displayError = error || citiesError || (isNeighborhoodLookupLoading ? neighborhoodsError : null) || null;

  if (isMainDataLoading && !updatedData?.length) {
      return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8 text-[#A78B71]" /></div>;
  }
  if (!isMainDataLoading && displayError) {
     return <ErrorMessage message={displayError.message || "Failed to load required admin data."} />;
  }

  // --- Render ---
  return (
    <>
      {/* CONTROLS ROW */}
      <div className="mb-4 flex flex-wrap justify-end items-center gap-2">
         {/* Add button logic */}
         {canAdd && !isAdding && !isBulkEditing && ( /* Verify canAdd */
            <Button onClick={handleStartAdd} variant="primary" size="sm" disabled={editingRowIds.size > 0 || isSaving || isMainDataLoading || authLoading || isNeighborhoodLookupLoading} className="flex items-center gap-1" >
                <Plus size={16} /> Add New {type.slice(0, -1)}
             </Button>
         )}
         {/* Bulk Edit Controls */}
         {canBulkEdit && (editingRowIds.size > 0 || selectedRows.size > 0) && ( /* Verify canBulkEdit */
             <div className={`flex flex-wrap justify-end items-center gap-2 p-2 border rounded-md bg-gray-50 ${canAdd && !isAdding && !isBulkEditing ? 'ml-auto' : 'w-full'}`}>
                 {isBulkEditing ? (
                    <>
                        <Button onClick={handleSaveAllEdits} variant="primary" size="sm" isLoading={isSaving} disabled={isSaving} className="!py-1 !px-2">
                            <Save size={14} className="mr-1"/> Save All ({editingRowIds.size})
                        </Button>
                        <Button onClick={handleCancelBulkEdit} variant="tertiary" size="sm" disabled={isSaving} className="!py-1 !px-2">
                            <IconX size={14} className="mr-1"/> Cancel Bulk Edit
                        </Button>
                    </>
                 ) : (
                    <Button onClick={handleBulkEdit} variant="secondary" size="sm" disabled={isAdding || isSaving || selectedRows.size === 0 || isMainDataLoading || authLoading || isNeighborhoodLookupLoading} className="!py-1 !px-2" >
                        <Edit size={14} className="mr-1"/> Edit Selected ({selectedRows.size})
                    </Button>
                 )}
                 {bulkSaveError && <p className="text-xs text-red-600 w-full text-right mt-1">{bulkSaveError}</p>}
             </div>
         )}
      </div>

      {/* General Error Display */}
      {error && <div className="mb-4"><ErrorMessage message={error} onRetry={() => setError(null)} /></div>}

      {/* Table Container */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm relative bg-white">
        {isLoading && updatedData?.length > 0 && (<div className="absolute top-2 right-2 z-20 text-gray-400" title="Refreshing data..."><Loader2 className="animate-spin h-4 w-4" /></div>)}
        {isNeighborhoodLookupLoading && <div className="absolute top-2 left-2 z-20 text-gray-400" title="Loading neighborhoods..."><Loader2 className="animate-spin h-4 w-4" /></div>}

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
                setError={setError}
                onSave={handleSaveNewRow}
                type={type}
                cities={cities}
                neighborhoods={allNeighborhoods}
                setIsAdding={handleCancelAdd}
              />
            )}
            {/* Table Rows */}
            {!isAdding && (!Array.isArray(updatedData) || updatedData.length === 0) ? (
              <tr><td colSpan={currentColumns.length} className="text-center text-gray-500 py-8 italic">No {type} found matching criteria.</td></tr>
            ) : (
              !isAdding && Array.isArray(updatedData) && updatedData.map((row, index) => {
                 if (!row || row.id == null) {
                     console.error("[AdminTable] Found invalid row data during map:", row, "at index", index);
                     return <tr key={`error-row-${index}`}><td colSpan={currentColumns.length} className="text-red-500 px-3 py-2 italic">Error: Invalid row data</td></tr>;
                 }
                const isEditingThisRow = editingRowIds.has(row.id);
                return (
                  <AdminTableRow
                    key={row.id} row={row} columns={currentColumns}
                    isEditing={isBulkEditing ? isEditingThisRow : !isBulkEditing && isEditingThisRow}
                    isSaving={isSaving} editFormData={editFormData}
                    actionState={actionState}
                    editError={(isEditingThisRow || (isBulkEditing && selectedRows.has(row.id))) ? editError : null}
                    selectedRows={selectedRows} onDataChange={handleRowDataChange}
                    handleStartEdit={handleStartEdit} handleCancelEdit={handleCancelEdit} handleSaveEdit={handleSaveEdit}
                    handleDeleteClick={handleDeleteClick} handleApprove={handleApprove} handleReject={handleReject}
                    type={type} canEdit={canEdit} canMutate={canMutate} // Pass canEdit/canMutate
                    cities={cities} neighborhoods={allNeighborhoods}
                    setEditError={setEditError} setError={setError} setActionState={setActionState}
                    setEditingRowIds={setEditingRowIds} setConfirmDeleteInfo={setConfirmDeleteInfo}
                    onDataMutated={onDataMutated} isBulkEditing={isBulkEditing} isAdding={isAdding}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDeleteInfo.isOpen}
        onClose={() => setConfirmDeleteInfo({ isOpen: false, id: null, itemType: '' })}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${confirmDeleteInfo.itemType.slice(0, -1)}?`}
        isLoading={actionState.deletingId !== null}
        confirmButtonText="Delete"
        confirmButtonCustomClasses="bg-red-600 hover:bg-red-700 focus:ring-red-500 !text-white"
      >
          Are you sure you want to delete this {confirmDeleteInfo.itemType.slice(0, -1)} (ID: {confirmDeleteInfo.id})? This action cannot be undone.
      </ConfirmationDialog>

      {/* List Edit Modal */}
      {type === 'lists' && isListEditModalOpen && listToEditData && (
          <Modal isOpen={isListEditModalOpen} onClose={handleCloseListEditModal} title={`Edit List: ${listToEditData?.name || ''}`} >
              <form onSubmit={(e) => { e.preventDefault(); handleListEditModalSubmit(() => handleSaveListEdit(listToEditData.id, listEditModalFormData)); }} className="p-4 space-y-4">
                  <div>
                      <label htmlFor="list-edit-name" className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
                      <Input id="list-edit-name" name="name" value={listEditModalFormData.name || ''} onChange={handleListEditModalChange} required />
                  </div>
                  <div>
                      <label htmlFor="list-edit-description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea id="list-edit-description" name="description" value={listEditModalFormData.description || ''} onChange={handleListEditModalChange} rows="3" className="w-full border border-gray-300 rounded p-1 text-sm"/>
                  </div>
                   <div>
                       <label htmlFor="list-edit-type" className="block text-sm font-medium text-gray-700 mb-1">Type*</label>
                       <Select id="list-edit-type" name="list_type" value={listEditModalFormData.list_type || 'mixed'} onChange={handleListEditModalChange} required>
                           <option value="restaurant">Restaurant</option>
                           <option value="dish">Dish</option>
                       </Select>
                       <p className="text-xs text-gray-500 mt-1">Cannot change type if list already contains items of the opposite type.</p>
                   </div>
                  <div>
                       <label className="flex items-center">
                          <input type="checkbox" name="is_public" checked={listEditModalFormData.is_public ?? true} onChange={handleListEditModalChange} className="mr-2 h-4 w-4 rounded border-gray-300 text-[#A78B71] focus:ring-[#D1B399]"/>
                           <span className="text-sm text-gray-700">Public List</span>
                       </label>
                  </div>
                  <div>
                      <label htmlFor="list-edit-tags" className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                      <Input id="list-edit-tags" name="tags" value={listEditModalFormData.tags || ''} onChange={handleListEditModalChange} />
                  </div>
                  <div>
                       <label htmlFor="list-edit-city" className="block text-sm font-medium text-gray-700 mb-1">City Name</label>
                       <Input id="list-edit-city" name="city_name" value={listEditModalFormData.city_name || ''} onChange={handleListEditModalChange} />
                  </div>
                  {listEditError && <p className="text-sm text-red-600">{listEditError}</p>}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button type="button" variant="tertiary" onClick={handleCloseListEditModal} disabled={isSaving}>Cancel</Button>
                      <Button type="submit" variant="primary" isLoading={isSaving} disabled={isSaving}>Save Changes</Button>
                  </div>
              </form>
          </Modal>
      )}
    </>
  );
};

export default AdminTable;