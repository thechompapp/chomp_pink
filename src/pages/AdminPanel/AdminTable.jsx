/* root/src/pages/AdminPanel/AdminTable.jsx */
/* REFACTORED: Accepts props based on new hook structure from AdminPanel */
/* FIXED: Pass editingRowIds prop */
/* FIXED: Pass isEditing function correctly to AdminTableRow */
import React, { useEffect, useCallback, useMemo } from 'react';
import AdminTableRow from './AdminTableRow';
import TableHeader from './TableHeader';
import AddRow from './AddRow'; // Assuming AddRow component exists
import { AlertCircle, Edit, Trash2, Check, X, ChevronDown, ChevronUp, Search, RefreshCw } from 'lucide-react';
import ErrorState from './ErrorState';
import TableSkeleton from './TableSkeleton';
import EmptyState from './EmptyState';
import { cn } from '@/lib/utils';

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
    addRowEnabled = true,
    deleteRowEnabled = true,
    isBulkEditing,
    onBulkEdit,
    onCancelBulkEdit,
    onSaveAllEdits,
    isSavingAll,
    isListEditModalOpen,
    listToEditData,
    onCloseListEditModal,
    onSaveListEdit,
    isSavingList,
    onOpenListEditModal,
    showFilters,
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

    // Memoize the column configuration to prevent unnecessary recalculations
    const columnConfig = useMemo(() => {
        return columns.map(col => ({
            ...col,
            isSortable: col.isSortable !== false, // Default to true if not specified
            sortKey: col.sortKey || col.key,
            className: cn(
                col.className,
                col.width ? `w-${col.width}` : '',
                col.align === 'right' ? 'text-right' : 
                col.align === 'center' ? 'text-center' : 'text-left'
            )
        }));
    }, [columns]);

    // Memoize handler for sort column clicks
    const handleSortColumn = useCallback((column) => {
        if (!column.isSortable) return;
        
        const direction = currentSort?.column === column.sortKey && 
            currentSort?.direction === 'asc' ? 'desc' : 'asc';
        
        onSort(resourceType, column.sortKey, direction);
    }, [currentSort, onSort, resourceType]);

    // Handle row selection when checkbox is clicked
    const handleRowCheckboxChange = useCallback((e, rowId) => {
        e.stopPropagation();
        onRowSelect(rowId);
    }, [onRowSelect]);

    // Handle header checkbox for select all
    const handleSelectAllChange = useCallback((e) => {
        e.stopPropagation();
        onSelectAll(!isAllSelected);
    }, [onSelectAll, isAllSelected]);

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
        <div className="relative overflow-hidden rounded-lg border bg-background">
            {/* Table header with search and actions */}
            <TableHeader
                resourceType={resourceType}
                columnsCount={columnConfig.length + 1} // +1 for actions
                selectedCount={selectedRows?.size || 0}
                totalCount={data.length}
                isAllSelected={isAllSelected}
                onSelectAll={handleSelectAllChange}
                onBulkEdit={onBulkEdit}
                isBulkEditing={isBulkEditing}
                showFilters={showFilters}
                onSaveAll={onSaveAllEdits}
                onCancelBulkEdit={onCancelBulkEdit}
                isSavingAll={isSavingAll}
                isDataCleanup={isDataCleanup}
            />
            
            {/* Main table */}
            <div className="overflow-auto max-h-[calc(100vh-210px)]">
                <table className="w-full border-collapse">
                    <thead className="bg-muted/50 sticky top-0 z-10">
                        <tr>
                            {/* Select all checkbox */}
                            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground w-10">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={isAllSelected}
                                    onChange={handleSelectAllChange}
                                    disabled={isBulkEditing || isLoading || !data.length}
                                />
                            </th>
                            
                            {/* Column headers */}
                            {columnConfig.map((column) => (
                                <th
                                    key={column.key}
                                    className={cn(
                                        "px-4 py-3 text-left text-xs font-medium text-muted-foreground whitespace-nowrap",
                                        column.className,
                                        column.isSortable && "cursor-pointer hover:bg-muted"
                                    )}
                                    onClick={() => column.isSortable && handleSortColumn(column)}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>{column.label}</span>
                                        {column.isSortable && currentSort?.column === column.sortKey && (
                                            <span className="inline-flex items-center">
                                                {currentSort.direction === 'asc' ? (
                                                    <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                            
                            {/* Actions column */}
                            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground w-32">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    
                    <tbody className="divide-y">
                        {/* New row form */}
                        {isAdding && (
                            <AdminTableRow
                                row={{ id: '__NEW_ROW__' }}
                                columns={columnConfig}
                                isEditing={true}
                                editFormData={newRowFormData}
                                onDataChange={onNewRowDataChange}
                                resourceType={resourceType}
                                isNew={true}
                            >
                                <td className="px-4 py-3 text-left text-xs font-medium w-10">
                                    <span className="text-xs text-muted-foreground">New</span>
                                </td>
                                <ActionCell
                                    isEditing={true}
                                    isNew={true}
                                    onSave={onSaveNewRow}
                                    onCancel={onCancelAdd}
                                    isSaving={isSavingNew}
                                />
                            </AdminTableRow>
                        )}
                        
                        {/* Data rows */}
                        {data.map((row) => (
                            <AdminTableRow
                                key={row.id || `row-${row._tempId || Math.random()}`}
                                row={row}
                                columns={columnConfig}
                                isEditing={isEditing(row.id)}
                                editFormData={editFormData?.[row.id]}
                                onDataChange={(changes) => onDataChange(row.id, changes)}
                                resourceType={resourceType}
                                isNew={false}
                                isSelected={selectedRows?.has(row.id)}
                            >
                                {/* Selection checkbox */}
                                <td className="px-4 py-3 text-left text-xs font-medium w-10">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={selectedRows?.has(row.id) || false}
                                        onChange={(e) => handleRowCheckboxChange(e, row.id)}
                                        disabled={isBulkEditing || isEditing(row.id)}
                                    />
                                </td>
                                
                                {/* Actions */}
                                <ActionCell
                                    rowId={row.id}
                                    isEditing={isEditing(row.id)}
                                    onEdit={() => onStartEdit(row)}
                                    onSave={() => onSaveEdit(row.id)}
                                    onCancel={() => onCancelEdit(row.id)}
                                    onDelete={() => onDelete(row.id)}
                                    onApprove={() => onApprove(row.id)}
                                    onReject={() => onReject(row.id)}
                                    onOpenListModal={() => onOpenListEditModal(row)}
                                    actionState={actionState?.[row.id]}
                                    isDataCleanup={isDataCleanup}
                                    deleteEnabled={deleteRowEnabled}
                                    resourceType={resourceType}
                                    isSaving={isSaving}
                                />
                            </AdminTableRow>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default React.memo(AdminTable);