// src/pages/AdminPanel/GenericAdminTableTab.jsx
// No major changes needed here if useAdminTableState handles type differences
// We rely on AdminPanel passing the correct props (data, columns, type)
import React, { useEffect, useMemo } from 'react';
import AdminTable from './AdminTable';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { useAdminTableState } from '@/hooks/useAdminTableState.js';
import useApiErrorHandler from '@/hooks/useApiErrorHandler.js';
import { COLUMN_CONFIG } from './columnConfig.jsx';

const GenericAdminTableTab = ({
    resourceType,
    initialData,
    isLoading,
    error,
    onRetry,
    addRowEnabled = true,
    deleteRowEnabled = true,
    showFilters = true,
    cities = [],
    neighborhoods = [],
    isDataCleanup = false,
    searchTerm = '',
    displayChanges = {},
}) => {
    // Get columns for this resource type
    const columns = useMemo(() => COLUMN_CONFIG[resourceType] || [], [resourceType]);

    // Debug data
    useEffect(() => {
        console.log(`[GenericAdminTableTab] Rendered with resourceType: ${resourceType}`);
        console.log(`[GenericAdminTableTab] Initial data:`, {
            resourceType,
            dataLength: initialData?.length || 0,
            isArray: Array.isArray(initialData),
            sample: Array.isArray(initialData) ? initialData.slice(0, 3) : initialData,
            columnsLength: columns?.length || 0
        });
    }, [resourceType, initialData, columns]);

    // Log display changes when they update
    useEffect(() => {
        if (Object.keys(displayChanges).length > 0) {
            console.log(`[GenericAdminTableTab] Received display changes for ${resourceType}:`, displayChanges);
            console.log(`[GenericAdminTableTab] Display changes keys:`, Object.keys(displayChanges));
            if (displayChanges[resourceType]) {
                console.log(`[GenericAdminTableTab] Specific changes for ${resourceType}:`, displayChanges[resourceType]);
            } else {
                console.log(`[GenericAdminTableTab] Display changes available but none specific to ${resourceType}`);
            }
        } else {
            console.log(`[GenericAdminTableTab] No display changes received for ${resourceType}`);
        }
    }, [displayChanges, resourceType]);

    // Use the state hook internally for this specific tab instance
    const {
        updatedData,
        currentSort,
        editingRowIds,
        editFormData,
        error: combinedError,
        actionState,
        confirmDeleteInfo,
        isAdding,
        newRowFormData,
        isSavingNew,
        selectedRows,
        isBulkEditing,
        bulkSaveError,
        isSavingAll,
        isListEditModalOpen,
        listToEditData,
        isSavingList,
        clearError: clearCombinedError,
        handleSort,
        handleRowDataChange,
        handleStartEdit,
        handleOpenListEditModal,
        handleCancelEdit,
        handleSaveEdit,
        handleStartAdd,
        handleCancelAdd,
        handleNewRowDataChange,
        handleSaveNewRow,
        handleDeleteClick,
        handleDeleteConfirm,
        setConfirmDeleteInfo,
        handleApprove,
        handleReject,
        handleRowSelect,
        handleSelectAll,
        handleBulkEdit,
        handleCancelBulkEdit,
        handleSaveAllEdits,
        handleCloseListEditModal,
        handleSaveListEdit,
        handleFilter,
        handlePageChange,
        handlePageSizeChange
    } = useAdminTableState({
        initialData: initialData || [],
        type: resourceType,
        columns: columns || [],
        onDataMutated: onRetry,
        cities: cities || [],
        neighborhoods: neighborhoods || [],
    });

    // State for search/filter input
    const [localSearchTerm, setLocalSearchTerm] = React.useState(searchTerm);
    
    // Update searchTerm when prop changes
    React.useEffect(() => {
        setLocalSearchTerm(searchTerm);
    }, [searchTerm]);

    // Apply display changes to the data
    const dataWithDisplayChanges = useMemo(() => {
        if (!updatedData || !Array.isArray(updatedData) || Object.keys(displayChanges).length === 0 || !displayChanges[resourceType]) {
            return updatedData;
        }
        
        console.log(`[GenericAdminTableTab] Applying display changes to ${updatedData.length} rows for ${resourceType}`);
        
        return updatedData.map(row => {
            // If we have display changes for this row, apply them
            const rowChanges = displayChanges[resourceType] ? displayChanges[resourceType][row.id] : null;
            if (!rowChanges) {
                return row;
            }
            
            const updatedRow = { ...row };
            
            // Apply each field change
            Object.entries(rowChanges).forEach(([field, change]) => {
                if (change.type === 'replaceIdWithName') {
                    // For ID replacements (foreign keys), we create a display value
                    updatedRow[`${field}_display`] = change.displayValue;
                } else if (change.type === 'hideColumn') {
                    // For hidden columns, we'll handle this in the column config
                    // But we can mark it here too
                    updatedRow[`${field}_hidden`] = true;
                } else {
                    // For other changes, update the display value directly
                    updatedRow[`${field}_formatted`] = change.displayValue;
                }
            });
            
            return updatedRow;
        });
    }, [updatedData, displayChanges, resourceType]);

    // Filter data based on search term (simple client-side filtering)
    const filteredData = React.useMemo(() => {
        if (!localSearchTerm && !searchTerm) return dataWithDisplayChanges || [];
        const term = localSearchTerm || searchTerm;
        console.log(`[GenericAdminTableTab] Filtering data with search term: "${term}"`);
        const lowerSearch = term.toLowerCase();
        const filtered = dataWithDisplayChanges.filter(row => 
            Object.values(row).some(value => 
                value && typeof value === 'string' && value.toLowerCase().includes(lowerSearch)
            )
        );
        console.log(`[GenericAdminTableTab] Found ${filtered.length} results out of ${dataWithDisplayChanges.length}`);
        return filtered;
    }, [localSearchTerm, searchTerm, dataWithDisplayChanges]);

    // Ensure data is always an array
    const safeData = useMemo(() => {
        if (!filteredData) return [];
        console.log(`[GenericAdminTableTab] safeData for ${resourceType}:`, {
            length: filteredData.length || 0,
            isArray: Array.isArray(filteredData),
            sample: Array.isArray(filteredData) ? filteredData.slice(0, 2) : filteredData
        });
        console.log(`[GenericAdminTableTab] State props passed to AdminTable for ${resourceType}:`, {
            editingRowIds: editingRowIds,
            editFormData: editFormData,
            isAdding: isAdding,
            selectedRows: selectedRows
        });
        return Array.isArray(filteredData) ? filteredData : [filteredData];
    }, [filteredData, resourceType]);

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" message="Loading data..." />
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-destructive mb-4">{error}</p>
                <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                    Retry
                </button>
            </div>
        );
    }

    // Render AdminTable with all props from the hook
    return (
        <div className="space-y-4">
            <AdminTable
                data={dataWithDisplayChanges || []}
                resourceType={resourceType}
                columns={columns}
                isLoading={isLoading}
                currentSort={currentSort}
                onSort={handleSort}
                isEditing={(rowId) => editingRowIds?.has(rowId)}
                editingRowIds={editingRowIds}
                editFormData={editFormData}
                onStartEdit={handleStartEdit}
                onCancelEdit={handleCancelEdit}
                onSaveEdit={handleSaveEdit}
                onDataChange={(changes) => handleRowDataChange(changes)}
                editError={combinedError}
                isSaving={isSavingNew || isSavingAll || isSavingList}
                actionState={actionState}
                onApprove={handleApprove}
                onReject={handleReject}
                onDelete={handleDeleteClick}
                selectedRows={selectedRows}
                onRowSelect={handleRowSelect}
                onSelectAll={handleSelectAll}
                isAllSelected={selectedRows?.size === updatedData?.length && updatedData?.length > 0}
                isAdding={isAdding}
                newRowFormData={editFormData?.['__NEW_ROW__'] || {}}
                onNewRowDataChange={(changes) => handleRowDataChange('__NEW_ROW__', changes)}
                onCancelAdd={handleCancelAdd}
                onSaveNewRow={handleSaveNewRow}
                isSavingNew={isSavingNew}
                addRowEnabled={addRowEnabled}
                deleteRowEnabled={deleteRowEnabled}
                isBulkEditing={isBulkEditing}
                onBulkEdit={handleBulkEdit}
                onCancelBulkEdit={handleCancelBulkEdit}
                onSaveAllEdits={handleSaveAllEdits}
                isSavingAll={isSavingAll}
                isListEditModalOpen={isListEditModalOpen}
                listToEditData={listToEditData}
                onCloseListEditModal={handleCloseListEditModal}
                onSaveListEdit={handleSaveListEdit}
                isSavingList={isSavingList}
                onOpenListEditModal={handleOpenListEditModal}
                isDataCleanup={isDataCleanup}
                showFilters={showFilters}
                displayChanges={displayChanges}
            />
        </div>
    );
};

export default GenericAdminTableTab;