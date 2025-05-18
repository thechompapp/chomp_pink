/* root/src/pages/AdminPanel/AdminTable.jsx */
/* REFACTORED: Accepts props based on new hook structure from AdminPanel */
/* FIXED: Pass editingRowIds prop */
/* FIXED: Pass isEditing function correctly to AdminTableRow */
/* FIXED: Added null checks for currentSort to prevent TypeError */
import React, { useEffect, useCallback, useMemo } from 'react';
import AdminTableRow from './AdminTableRow';
import TableHeader from './TableHeader';
import AddRow from './AddRow'; // Assuming AddRow component exists
import ActionCell from './ActionCell';
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
    currentSort = null, // { column: string, direction: 'asc' | 'desc' } | null - Provide default null
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

    // Memoize handler for sort column clicks with better null handling
    const handleSortColumn = useCallback((column) => {
        if (!column?.isSortable) return;
        
        // Default to 'asc' if currentSort is null or if changing columns
        let direction = 'asc';
        
        // Only toggle direction if we're sorting the same column
        if (currentSort && typeof currentSort === 'object' && 
            currentSort.column === column.sortKey && 
            currentSort.direction === 'asc') {
            direction = 'desc';
        }
        
        if (onSort && typeof onSort === 'function') {
            onSort(resourceType, column.sortKey, direction);
        }
    }, [currentSort, onSort, resourceType]);

    // Handle row selection when checkbox is clicked
    const handleRowCheckboxChange = useCallback((e, rowId) => {
        e.stopPropagation();
        if (onRowSelect && typeof onRowSelect === 'function') {
            onRowSelect(rowId);
        }
    }, [onRowSelect]);

    // Handle header checkbox for select all
    const handleSelectAllChange = useCallback((e) => {
        e.stopPropagation();
        if (onSelectAll && typeof onSelectAll === 'function') {
            onSelectAll(!isAllSelected);
        }
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
            {/* Custom Table Header Controls - Not the same as the TableHeader component */}
            <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold">{resourceType}</h3>
                    <span className="text-sm text-muted-foreground">
                        {selectedRows?.size || 0} of {data.length} selected
                    </span>
                </div>
                <div className="flex items-center space-x-2">
                    {isBulkEditing ? (
                        <>
                            <button
                                onClick={onSaveAllEdits}
                                disabled={isSavingAll}
                                className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
                            >
                                {isSavingAll ? 'Saving...' : 'Save All'}
                            </button>
                            <button
                                onClick={onCancelBulkEdit}
                                className="px-3 py-1.5 text-sm bg-muted text-foreground rounded hover:bg-muted/90"
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <>
                            {selectedRows?.size > 0 && (
                                <button
                                    onClick={onBulkEdit}
                                    className="px-3 py-1.5 text-sm bg-muted text-foreground rounded hover:bg-muted/90"
                                >
                                    Bulk Edit
                                </button>
                            )}
                            {showFilters && (
                                <button className="px-3 py-1.5 text-sm bg-muted text-foreground rounded hover:bg-muted/90">
                                    <Search className="h-4 w-4 mr-1" />
                                    Filters
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
            
            {/* Main table */}
            <div className="overflow-auto max-h-[calc(100vh-210px)]">
                <table className="w-full border-collapse">
                    {/* Use the TableHeader component properly */}
                    <TableHeader
                        columns={columnConfig || []}
                        currentSortColumn={currentSort?.column}
                        currentSortDirection={currentSort?.direction}
                        onSortChange={onSort}
                        type={resourceType}
                        isAdding={isAdding}
                        editingRowIds={editingRowIds || new Set()}
                        isAllSelected={isAllSelected}
                        onSelectAll={onSelectAll}
                        showSelect={true}
                        visibleColumns={visibleColumns}
                        onToggleColumn={onToggleColumn}
                    />
                    
                    <tbody className="divide-y">
                        {/* New row form */}
                        {isAdding && (
                            <tr>
                                {/* Checkbox column */}
                                <td className="px-4 py-3 text-left text-xs font-medium w-10">
                                    <span className="text-xs text-muted-foreground">New</span>
                                </td>
                                
                                {/* Form fields */}
                                {columnConfig.map((column) => (
                                    <td key={`new-${column.accessor}`} className="px-4 py-3">
                                        {/* Render appropriate input field based on column type */}
                                        <input
                                            type="text"
                                            className="w-full p-2 border rounded"
                                            value={newRowFormData?.[column.accessor] || ''}
                                            onChange={(e) => onNewRowDataChange({ 
                                                [column.accessor]: e.target.value 
                                            })}
                                        />
                                    </td>
                                ))}
                                
                                {/* Actions */}
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end space-x-2">
                                        <button
                                            onClick={onSaveNewRow}
                                            disabled={isSavingNew}
                                            className="p-1 text-green-600 hover:text-green-800"
                                        >
                                            <Check className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={onCancelAdd}
                                            className="p-1 text-red-600 hover:text-red-800"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                        
                        {/* Data rows */}
                        {data.map((row) => (
                            <AdminTableRow
                                key={row.id || `row-${row._tempId || Math.random()}`}
                                row={row}
                                columns={columnConfig}
                                isEditing={(rowId) => typeof isEditing === 'function' ? isEditing(rowId) : false}
                                editFormData={{[row.id]: editFormData?.[row.id] || {}}}
                                onDataChange={onDataChange}
                                onStartEdit={() => onStartEdit && onStartEdit(row)}
                                onCancelEdit={onCancelEdit}
                                onSaveEdit={onSaveEdit}
                                editError={editError}
                                isSaving={isSaving}
                                actionState={actionState}
                                onApprove={onApprove}
                                onReject={onReject}
                                onDelete={onDelete}
                                selectedRows={selectedRows}
                                onRowSelect={onRowSelect}
                                resourceType={resourceType}
                                cities={cities}
                                neighborhoods={neighborhoods}
                                confirmDeleteInfo={confirmDeleteInfo}
                                setConfirmDeleteInfo={setConfirmDeleteInfo}
                                handleDeleteConfirm={handleDeleteConfirm}
                                isBulkEditing={isBulkEditing}
                                isAdding={isAdding}
                                isDataCleanup={isDataCleanup}
                                displayChanges={displayChanges[row.id] || {}}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default React.memo(AdminTable);