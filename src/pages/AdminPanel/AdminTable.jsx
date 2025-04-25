/* root/src/pages/AdminPanel/AdminTable.jsx */
/* REFACTORED: Accepts props based on new hook structure from AdminPanel */
/* FIXED: Pass editingRowIds prop */
/* FIXED: Pass isEditing function correctly to AdminTableRow */
import React from 'react';
import AdminTableRow from './AdminTableRow';
import TableHeader from './TableHeader';
import AddRow from './AddRow'; // Assuming AddRow component exists

const AdminTable = ({
    data = [],
    columns = [],
    isLoading,
    currentSort, // { column: string, direction: 'asc' | 'desc' } | null
    onSort, // (type, columnKey, direction) => void
    // Row Editing Props
    isEditing, // (rowId) => boolean  <- This is the function itself
    editingRowIds, // *** Added prop (should be a Set) ***
    editFormData,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onDataChange,
    editError,
    // Row Action Props
    isSaving,
    actionState,
    onApprove,
    onReject,
    onDelete, // This is handleDeleteClick from the hook
    // Bulk Editing Props
    selectedRows,
    onRowSelect,
    onSelectAll,
    isAllSelected,
    // Add Row Props
    isAdding,
    newRowFormData,
    onNewRowDataChange,
    onCancelAdd,
    onSaveNewRow,
    isSavingNew,
    // Confirmation Dialog Props (Passed through to AdminTableRow)
    confirmDeleteInfo,
    setConfirmDeleteInfo,
    handleDeleteConfirm,
    // Context Props
    resourceType,
    cities,
    neighborhoods,
}) => {

    if (isLoading && data.length === 0) {
        return <div className="text-center py-4">Loading data...</div>;
    }

    if (!isLoading && data.length === 0 && !isAdding) {
        return <div className="text-center py-4 text-gray-600 dark:text-gray-400">No {resourceType} found.</div>;
    }

    return (
        <div className="overflow-x-auto shadow rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <TableHeader
                    columns={columns}
                    currentSortColumn={currentSort?.column} // Pass column part
                    currentSortDirection={currentSort?.direction} // Pass direction part
                    onSortChange={onSort} // Pass sort handler (renamed prop)
                    type={resourceType}
                    isAdding={isAdding}
                    editingRowIds={editingRowIds} // *** Pass editingRowIds down ***
                    isAllSelected={isAllSelected}
                    onSelectAll={onSelectAll}
                    showSelect={resourceType !== 'submissions'} // Don't show select for submissions
                />
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {/* Add New Row UI */}
                    {isAdding && (
                        <AddRow
                            columns={columns}
                            // NOTE: Assuming newRowFormData is correctly structured under '__NEW_ROW__' key in parent
                            newRowData={newRowFormData || {}} // Pass the specific form data for the new row
                            // Pass setNewRowData callback correctly targeting the '__NEW_ROW__' key
                            setNewRowData={(key, value) => onNewRowDataChange({ [key]: value })} // Simplified, assuming hook handles '__NEW_ROW__'
                            isSaving={isSavingNew}
                            setIsSaving={() => {}} // isSavingNew is directly controlled by hook state
                            setError={() => {}} // Assuming editError state in hook handles add errors too
                            onSave={onSaveNewRow}
                            type={resourceType}
                            cities={cities}
                            neighborhoods={neighborhoods}
                            setIsAdding={onCancelAdd} // Use onCancelAdd to signal cancellation
                        />
                    )}
                    {/* Existing Data Rows */}
                    {data.map((row) => (
                        <AdminTableRow
                            key={row.id}
                            row={row}
                            columns={columns}
                            // *** FIXED: Pass the isEditing FUNCTION itself, not the result ***
                            isEditing={isEditing}
                            editFormData={editFormData || {}} // Pass the whole edit form data object
                            onStartEdit={onStartEdit}
                            onCancelEdit={onCancelEdit}
                            onSaveEdit={onSaveEdit}
                            onDataChange={onDataChange} // This function likely expects (rowId, changes)
                            editError={editError} // Pass row-specific edit error (hook needs logic for this)
                            isSaving={isSaving} // General saving state
                            actionState={actionState} // Specific action states (delete/approve/reject)
                            onApprove={onApprove}
                            onReject={onReject}
                            onDelete={onDelete} // Pass the click handler
                            selectedRows={selectedRows || new Set()} // Pass selected rows Set
                            onRowSelect={onRowSelect}
                            resourceType={resourceType}
                            cities={cities}
                            neighborhoods={neighborhoods}
                            // Pass confirmation props for potential use in ActionCell
                            confirmDeleteInfo={confirmDeleteInfo}
                            setConfirmDeleteInfo={setConfirmDeleteInfo}
                            handleDeleteConfirm={handleDeleteConfirm}
                            // Pass editingRowIds for potential conditional logic if needed
                            editingRowIds={editingRowIds}
                            // Pass add/bulk edit flags for disabling logic
                            isAdding={isAdding}
                            isBulkEditing={selectedRows?.size > 1 && editingRowIds?.size > 0} // Example logic
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminTable;