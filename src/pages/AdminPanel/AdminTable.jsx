/* root/src/pages/AdminPanel/AdminTable.jsx */
/* REFACTORED: Accepts props based on new hook structure from AdminPanel */
/* FIXED: Pass editingRowIds prop */
/* FIXED: Pass isEditing function correctly to AdminTableRow */
import React, { useEffect } from 'react';
import AdminTableRow from './AdminTableRow';
import TableHeader from './TableHeader';
import AddRow from './AddRow'; // Assuming AddRow component exists
import { AlertCircle } from 'lucide-react';
import ErrorState from './ErrorState';
import TableSkeleton from './TableSkeleton';
import EmptyState from './EmptyState';

const AdminTable = ({
    data = [],
    columns = [],
    isLoading,
    error,
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
    onRetry,
    onAddNew,
    visibleColumns = [],
    onToggleColumn,
    isDataCleanup = false, // Added: Flag for data cleanup mode
    displayChanges = {}, // Added: Display changes for data cleanup
}) => {

    // Debug cities data
    useEffect(() => {
        console.log(`[AdminTable] Received cities data:`, {
            length: cities?.length || 0,
            isArray: Array.isArray(cities),
            sample: cities?.slice(0, 3),
            source: 'props from GenericAdminTableTab'
        });
    }, [cities]);

    // Log display changes
    useEffect(() => {
        if (Object.keys(displayChanges).length > 0) {
            console.log(`[AdminTable] Received display changes:`, displayChanges);
        }
    }, [displayChanges]);

    if (error) {
        return <ErrorState error={error} onRetry={onRetry} />;
    }

    if (isLoading) {
        return <TableSkeleton />;
    }

    if (!isLoading && data.length === 0 && !isAdding) {
        return <EmptyState resourceType={resourceType} onAdd={onAddNew} />;
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-border shadow-sm">
            <table className="min-w-full divide-y divide-border">
                <TableHeader
                    columns={columns}
                    currentSortColumn={currentSort?.column}
                    currentSortDirection={currentSort?.direction}
                    onSortChange={onSort}
                    type={resourceType}
                    isAdding={isAdding}
                    editingRowIds={editingRowIds}
                    isAllSelected={isAllSelected}
                    onSelectAll={onSelectAll}
                    showSelect={resourceType !== 'submissions'}
                    visibleColumns={visibleColumns}
                    onToggleColumn={onToggleColumn}
                />
                <tbody className="bg-background divide-y divide-border">
                    {/* Add New Row UI */}
                    {isAdding && (
                        <AddRow
                            columns={columns}
                            newRowData={newRowFormData || {}}
                            setNewRowData={(key, value) => onNewRowDataChange({ [key]: value })}
                            isSaving={isSavingNew}
                            setIsSaving={() => {}}
                            setError={() => {}}
                            onSave={onSaveNewRow}
                            type={resourceType}
                            cities={cities}
                            neighborhoods={neighborhoods}
                            setIsAdding={onCancelAdd}
                        />
                    )}
                    {/* Existing Data Rows */}
                    {data.map((row) => (
                        <AdminTableRow
                            key={row.id}
                            row={row}
                            columns={columns}
                            isEditing={isEditing}
                            editFormData={editFormData || {}}
                            onStartEdit={onStartEdit}
                            onCancelEdit={onCancelEdit}
                            onSaveEdit={onSaveEdit}
                            onDataChange={onDataChange}
                            editError={editError}
                            isSaving={isSaving}
                            actionState={actionState}
                            onApprove={onApprove}
                            onReject={onReject}
                            onDelete={onDelete}
                            selectedRows={selectedRows || new Set()}
                            onRowSelect={onRowSelect}
                            resourceType={resourceType}
                            cities={cities}
                            neighborhoods={neighborhoods}
                            confirmDeleteInfo={confirmDeleteInfo}
                            setConfirmDeleteInfo={setConfirmDeleteInfo}
                            handleDeleteConfirm={handleDeleteConfirm}
                            editingRowIds={editingRowIds}
                            isAdding={isAdding}
                            isBulkEditing={selectedRows?.size > 1 && editingRowIds?.size > 0}
                            isDataCleanup={isDataCleanup}
                            displayChanges={displayChanges[row.id] || {}}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminTable;