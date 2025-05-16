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

    // Debug cities data
    useEffect(() => {
        console.log(`[GenericAdminTableTab] Received cities data:`, {
            length: cities?.length || 0,
            isArray: Array.isArray(cities),
            cities: cities,
            source: 'props from AdminPanel'
        });
    }, [cities]);

    // Use the state hook internally for this specific tab instance
    const { state, setState, handleSort, handleFilter, handlePageChange, handlePageSizeChange } = useAdminTableState({
        initialData: initialData || [],
        type: resourceType,
        columns: columns || [],
        onDataMutated: onRetry,
        cities: cities || [],
        neighborhoods: neighborhoods || [],
    });

    // State for search/filter input
    const [searchTerm, setSearchTerm] = React.useState('');

    // Filter data based on search term (simple client-side filtering)
    const filteredData = React.useMemo(() => {
        if (!searchTerm || !state?.updatedData) return state?.updatedData || [];
        console.log(`[GenericAdminTableTab] Filtering data with search term: "${searchTerm}"`);
        const lowerSearch = searchTerm.toLowerCase();
        const filtered = state.updatedData.filter(row => 
            Object.values(row).some(value => 
                value && typeof value === 'string' && value.toLowerCase().includes(lowerSearch)
            )
        );
        console.log(`[GenericAdminTableTab] Found ${filtered.length} results out of ${state.updatedData.length}`);
        return filtered;
    }, [searchTerm, state?.updatedData]);

    // For debugging: Create a wrapper for onStartEdit
    const handleStartEdit = (row) => {
        console.log(`[GenericAdminTableTab] handleStartEdit called for row ${row.id}, type: ${resourceType}`);
        if (setState?.handleStartEdit) {
            setState.handleStartEdit(row);
        } else {
            console.error('[GenericAdminTableTab] setState.handleStartEdit is undefined!');
        }
    };

    // Ensure data is always an array
    const safeData = useMemo(() => {
        if (!state?.updatedData) return [];
        console.log(`[GenericAdminTableTab] safeData for ${resourceType}:`, {
            length: state.updatedData.length || 0,
            isArray: Array.isArray(state.updatedData),
            sample: Array.isArray(state.updatedData) ? state.updatedData.slice(0, 2) : state.updatedData
        });
        console.log(`[GenericAdminTableTab] State props passed to AdminTable for ${resourceType}:`, {
            editingRowIds: state?.editingRowIds,
            editFormData: state?.editFormData,
            isAdding: state?.isAdding,
            selectedRows: state?.selectedRows
        });
        return Array.isArray(state.updatedData) ? state.updatedData : [state.updatedData];
    }, [state?.updatedData, resourceType]);

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
                data={safeData}
                resourceType={resourceType}
                columns={columns}
                isLoading={isLoading}
                currentSort={handleSort}
                onSort={handleSort}
                isEditing={(rowId) => state?.editingRowIds?.has(rowId)}
                editingRowIds={state?.editingRowIds}
                editFormData={state?.editFormData}
                onStartEdit={handleStartEdit}
                onCancelEdit={setState?.handleCancelEdit}
                onSaveEdit={setState?.handleSaveEdit}
                onDataChange={(changes) => setState?.handleRowDataChange(changes)}
                editError={state?.editError}
                isSaving={state?.isSaving}
                actionState={state?.actionState}
                onApprove={setState?.handleApprove}
                onReject={setState?.handleReject}
                onDelete={setState?.handleDeleteClick}
                selectedRows={state?.selectedRows}
                onRowSelect={setState?.handleRowSelect}
                onSelectAll={setState?.handleSelectAll}
                isAllSelected={state?.isAllSelected}
                isAdding={state?.isAdding}
                newRowFormData={state?.editFormData?.['__NEW_ROW__'] || {}}
                onNewRowDataChange={(changes) => setState?.handleRowDataChange('__NEW_ROW__', changes)}
                onCancelAdd={setState?.handleCancelAdd}
                onSaveNewRow={setState?.handleSaveNewRow}
                isSavingNew={state?.isSaving}
                confirmDeleteInfo={state?.confirmDeleteInfo}
                setConfirmDeleteInfo={setState?.setConfirmDeleteInfo}
                handleDeleteConfirm={setState?.handleDeleteConfirm}
                cities={cities}
                neighborhoods={neighborhoods}
                showFilters={showFilters}
                addRowEnabled={addRowEnabled}
                deleteRowEnabled={deleteRowEnabled}
                onRetry={onRetry}
                onAddNew={() => setState?.setIsAdding(true)}
                isDataCleanup={isDataCleanup}
                onFilter={handleFilter}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                state={state}
                setState={setState}
            />
        </div>
    );
};

export default GenericAdminTableTab;