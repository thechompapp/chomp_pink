/* src/pages/AdminPanel/SubmissionsTab.jsx */
/* FIXED: Pass editingRowIds prop down to AdminTable */
import React, { useMemo } from 'react';
import AdminTable from './AdminTable.jsx';
import { useAdminTableState } from '@/hooks/useAdminTableState.js';
import { CheckCircle, XCircle, Clock, Store, Utensils } from 'lucide-react';

// Columns definition (no changes needed here)
const submissionColumns = [ { key: 'id', header: 'ID', sortable: true, editable: false, className: 'w-16 text-gray-500 dark:text-gray-400' }, { key: 'type', header: 'Type', sortable: true, editable: false, className: 'capitalize w-24' }, { key: 'name', header: 'Name', sortable: true, editable: false }, { key: 'location', header: 'Address / Location', sortable: true, editable: false, className: 'text-xs max-w-xs truncate', render: (val) => val || <span className="text-gray-400 italic">N/A</span> }, { key: 'city', header: 'City', sortable: true, editable: false, render: (val) => val || <span className="text-gray-400 italic">N/A</span> }, { key: 'neighborhood', header: 'Neighborhood', sortable: true, editable: false, render: (val) => val || <span className="text-gray-400 italic">N/A</span> }, { key: 'user_handle', header: 'Submitted By', sortable: true, editable: false, render: (val) => val ? `@${val}` : <span className="text-gray-400 italic">N/A</span> }, { key: 'restaurant_name', header: 'Restaurant (Dishes)', sortable: true, editable: false, render: (name, row) => { if (row.type === 'dish') { const restaurantId = Number(row.restaurant_id); if (!isNaN(restaurantId) && restaurantId > 0) { return <a href={`/restaurant/${restaurantId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">{name || `ID: ${restaurantId}`}</a>; } return name || (row.restaurant_id ? `ID: ${row.restaurant_id}` : <span className="text-gray-400 italic">N/A</span>); } return <span className="text-gray-400 italic">-</span>; } }, { key: 'status', header: 'Status', sortable: true, editable: false, render: (status) => ( <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize inline-flex items-center gap-1 ${ status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' }`}> {status} </span> ) }, { key: 'created_at', header: 'Submitted', sortable: true, editable: false, render: (val) => val ? new Date(val).toLocaleDateString() : 'N/A' }, { key: 'actions', header: '', sortable: false, editable: false, className: 'w-24 text-right' }, ];

const SubmissionsTab = ({
    data,
    refetchData,
    isLoading,
}) => {

    const columns = useMemo(() => submissionColumns, []);

    // Use the admin table state hook
    const {
        updatedData,
        currentSort,
        handleSort: onSort,
        editingRowIds, // *** Get editingRowIds from hook ***
        editFormData,
        editError,
        handleRowDataChange: onDataChange,
        handleStartEdit: onStartEdit,
        handleCancelEdit: onCancelEdit,
        handleSaveEdit: onSaveEdit,
        isSaving,
        actionState,
        handleApprove: onApprove,
        handleReject: onReject,
        handleDeleteClick,
        setConfirmDeleteInfo,
        confirmDeleteInfo,
        handleDeleteConfirm,
        selectedRows,
        handleRowSelect: onRowSelect,
        handleSelectAll: onSelectAll,
        isAllSelected,
        isAdding,
        newRowFormData,
        handleNewRowDataChange: onNewRowDataChange,
        handleCancelAdd: onCancelAdd,
        handleSaveNewRow: onSaveNewRow,
        isSavingNew,
    } = useAdminTableState({
        initialData: data || [],
        type: 'submissions',
        columns: columns,
        onDataMutated: refetchData,
    });

    // Render AdminTable, passing down props from the hook
    return (
        <AdminTable
            // Data & Columns
            data={updatedData}
            resourceType="submissions"
            columns={columns}
            isLoading={isLoading}
            // Sorting
            currentSort={currentSort}
            onSort={onSort}
            // Editing
            isEditing={(rowId) => editingRowIds.has(rowId)}
            editingRowIds={editingRowIds} // *** Ensure passing down ***
            editFormData={editFormData}
            onStartEdit={onStartEdit}
            onCancelEdit={onCancelEdit}
            onSaveEdit={onSaveEdit}
            onDataChange={onDataChange}
            editError={editError}
            // Actions
            isSaving={isSaving}
            actionState={actionState}
            onApprove={onApprove}
            onReject={onReject}
            onDelete={handleDeleteClick} // Pass delete *click* handler
            // Selection
            selectedRows={selectedRows}
            onRowSelect={onRowSelect}
            onSelectAll={onSelectAll}
            isAllSelected={isAllSelected}
            // Add Row
            isAdding={isAdding}
            newRowFormData={newRowFormData}
            onNewRowDataChange={onNewRowDataChange}
            onCancelAdd={onCancelAdd}
            onSaveNewRow={onSaveNewRow}
            isSavingNew={isSavingNew}
            // Confirmation Dialog state
            confirmDeleteInfo={confirmDeleteInfo}
            setConfirmDeleteInfo={setConfirmDeleteInfo}
            handleDeleteConfirm={handleDeleteConfirm}
        />
    );
};

export default SubmissionsTab;