// src/pages/AdminPanel/GenericAdminTableTab.jsx
// No major changes needed here if useAdminTableState handles type differences
// We rely on AdminPanel passing the correct props (data, columns, type)
import React, { useEffect, useMemo, useCallback } from 'react';
import AdminTable from './AdminTable';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { useAdminTableState } from '@/hooks/useAdminTableState.js';
import useApiErrorHandler from '@/hooks/useApiErrorHandler.js';
import { COLUMN_CONFIG } from './columnConfig.jsx';

/**
 * GenericAdminTableTab component for displaying and managing different resource types in admin panel
 * 
 * @param {Object} props - Component props
 * @param {string} props.resourceType - Type of resource to display (e.g., 'users', 'restaurants')
 * @param {Array} props.initialData - Initial data for the table
 * @param {boolean} props.isLoading - Whether data is loading
 * @param {string|null} props.error - Error message if any
 * @param {Function} props.onRetry - Function to retry loading data
 * @param {boolean} props.addRowEnabled - Whether adding rows is enabled
 * @param {boolean} props.deleteRowEnabled - Whether deleting rows is enabled
 * @param {boolean} props.showFilters - Whether to show filters
 * @param {Array} props.cities - List of cities for dropdown options
 * @param {Array} props.neighborhoods - List of neighborhoods for dropdown options
 * @param {boolean} props.isDataCleanup - Whether data cleanup mode is active
 * @param {string} props.searchTerm - Search term for filtering data
 * @param {Object} props.displayChanges - Display changes for data cleanup
 */
const GenericAdminTableTab = ({
    // Resource configuration
    resourceType,
    initialData,
    isLoading,
    error,
    onRetry,
    
    // Feature toggles
    addRowEnabled = true,
    deleteRowEnabled = true,
    showFilters = true,
    isDataCleanup = false,
    
    // Reference data for dropdowns
    cities = [],
    neighborhoods = [],
    
    // Search and display properties
    searchTerm = '',
    displayChanges = {},
}) => {
    // Get columns for this resource type - memoized to prevent recalculation
    const columns = useMemo(() => COLUMN_CONFIG[resourceType] || [], [resourceType]);

    // Debug logging in development environment
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            logResourceData();
            logDisplayChanges();
        }
    }, [resourceType, initialData, columns, displayChanges]);
    
    /**
     * Log resource data information (development only)
     */
    const logResourceData = () => {
        console.log(`[GenericAdminTableTab] Rendered with resourceType: ${resourceType}`);
        console.log(`[GenericAdminTableTab] Initial data:`, {
            resourceType,
            dataLength: initialData?.length || 0,
            isArray: Array.isArray(initialData),
            columnsLength: columns?.length || 0
        });
    };
    
    /**
     * Log display changes information (development only)
     */
    const logDisplayChanges = () => {
        if (Object.keys(displayChanges).length > 0) {
            console.log(`[GenericAdminTableTab] Received display changes for ${resourceType}:`, 
                displayChanges[resourceType] ? Object.keys(displayChanges[resourceType]).length : 0);
        }
    };

    // Get admin table state from hook
    const tableState = useAdminTableState({
        initialData: initialData || [],
        type: resourceType,
        columns: columns || [],
        onDataMutated: onRetry,
        cities: cities || [],
        neighborhoods: neighborhoods || [],
    });
    
    // Destructure properties from table state
    const {
        // Data state
        updatedData,
        currentSort,
        editingRowIds,
        editFormData,
        
        // UI state
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
        
        // Handler functions
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
    } = tableState;

    // Search term state management
    const [localSearchTerm, setLocalSearchTerm] = React.useState(searchTerm);
    
    // Update localSearchTerm when prop changes
    React.useEffect(() => {
        setLocalSearchTerm(searchTerm);
    }, [searchTerm]);

    /**
     * Apply display changes to the data
     * @returns {Array} Data with display changes applied
     */
    const dataWithDisplayChanges = useMemo(() => {
        // Return original data if no changes needed
        if (!updatedData || !Array.isArray(updatedData) || 
            Object.keys(displayChanges).length === 0 || 
            !displayChanges[resourceType]) {
            return updatedData;
        }
        
        // Apply changes to rows
        return updatedData.map(row => {
            // If no changes for this row, return it unchanged
            const rowChanges = displayChanges[resourceType] ? 
                displayChanges[resourceType][row.id] : null;
                
            if (!rowChanges) {
                return row;
            }
            
            // Create a new object with changes applied
            const updatedRow = { ...row };
            
            // Apply each field change based on type
            Object.entries(rowChanges).forEach(([field, change]) => {
                applyFieldChange(updatedRow, field, change);
            });
            
            return updatedRow;
        });
    }, [updatedData, displayChanges, resourceType]);
    
    /**
     * Apply a single field change to a row
     * @param {Object} row - Row to modify
     * @param {string} field - Field name
     * @param {Object} change - Change to apply
     */
    const applyFieldChange = (row, field, change) => {
        if (change.type === 'replaceIdWithName') {
            row[`${field}_display`] = change.displayValue;
        } else if (change.type === 'hideColumn') {
            row[`${field}_hidden`] = true;
        } else {
            row[`${field}_formatted`] = change.displayValue;
        }
    };

    /**
     * Filter data by search term
     * @param {Array} data - Data to filter
     * @param {string} term - Search term
     * @returns {Array} Filtered data
     */
    const filterBySearchTerm = useCallback((data, term) => {
        if (!term) return data;
        
        const lowerSearch = term.toLowerCase();
        return data.filter(row => 
            Object.values(row).some(value => 
                value && typeof value === 'string' && 
                value.toLowerCase().includes(lowerSearch)
            )
        );
    }, []);

    /**
     * Get filtered data based on search term
     */
    const filteredData = useMemo(() => {
        const term = localSearchTerm || searchTerm;
        if (!term) return dataWithDisplayChanges || [];
        
        return filterBySearchTerm(dataWithDisplayChanges, term);
    }, [localSearchTerm, searchTerm, dataWithDisplayChanges, filterBySearchTerm]);

    // Render loading state
    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" message="Loading data..." />
            </div>
        );
    }

    // Render error state
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

    // Calculate admin table props
    const adminTableProps = {
        // Data props
        data: filteredData || [],
        resourceType,
        columns,
        
        // UI state props
        isLoading,
        currentSort,
        isEditing: (rowId) => editingRowIds?.has(rowId),
        editingRowIds,
        editFormData,
        editError: combinedError,
        isSaving: isSavingNew || isSavingAll || isSavingList,
        actionState,
        selectedRows,
        isAllSelected: selectedRows?.size === updatedData?.length && updatedData?.length > 0,
        isAdding,
        newRowFormData: editFormData?.['__NEW_ROW__'] || {},
        isSavingNew,
        isBulkEditing,
        isSavingAll,
        isListEditModalOpen,
        listToEditData,
        isSavingList,
        isDataCleanup,
        showFilters,
        displayChanges,
        
        // Feature toggles
        addRowEnabled,
        deleteRowEnabled,
        
        // Handler functions
        onSort: handleSort,
        onStartEdit: handleStartEdit,
        onCancelEdit: handleCancelEdit,
        onSaveEdit: handleSaveEdit,
        onDataChange: handleRowDataChange,
        onApprove: handleApprove,
        onReject: handleReject,
        onDelete: handleDeleteClick,
        onRowSelect: handleRowSelect,
        onSelectAll: handleSelectAll,
        onNewRowDataChange: (changes) => handleRowDataChange('__NEW_ROW__', changes),
        onCancelAdd: handleCancelAdd,
        onSaveNewRow: handleSaveNewRow,
        onBulkEdit: handleBulkEdit,
        onCancelBulkEdit: handleCancelBulkEdit,
        onSaveAllEdits: handleSaveAllEdits,
        onCloseListEditModal: handleCloseListEditModal,
        onSaveListEdit: handleSaveListEdit,
        onOpenListEditModal: handleOpenListEditModal,
    };

    // Render admin table
    return (
        <div className="space-y-4">
            <AdminTable {...adminTableProps} />
        </div>
    );
};

export default React.memo(GenericAdminTableTab);