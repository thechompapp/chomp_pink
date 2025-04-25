// src/pages/AdminPanel/GenericAdminTableTab.jsx
// No major changes needed here if useAdminTableState handles type differences
// We rely on AdminPanel passing the correct props (data, columns, type)
import React from 'react';
import AdminTable from './AdminTable';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { useAdminTableState } from '@/hooks/useAdminTableState.js';

const GenericAdminTableTab = ({
    resourceType,
    initialData,
    columns,
    isLoading, // Pass loading state for data fetching
    refetchData,
    cities,
    neighborhoods,
    showFilters,
    addRowEnabled,
    deleteRowEnabled
}) => {

    // Use the state hook internally for this specific tab instance
    const tableState = useAdminTableState({
        initialData: initialData || [],
        type: resourceType, // Hook logic might differ based on type
        columns: columns || [],
        onDataMutated: refetchData,
        cities: cities || [],
        neighborhoods: neighborhoods || [],
    });

    // Render AdminTable with all props from the hook
    return (
        <AdminTable
            // Key might be useful here if needed for complex resets not handled by hook effect
            // key={resourceType}
            dataKey={resourceType}
            initialData={initialData || []}
            data={tableState.updatedData}
            resourceType={resourceType}
            columns={columns || []}
            isLoading={isLoading}
            // Pass all state and handlers from the hook
            currentSort={tableState.currentSort}
            onSort={tableState.handleSort}
            isEditing={(rowId) => tableState.editingRowIds.has(rowId)}
            editingRowIds={tableState.editingRowIds}
            editFormData={tableState.editFormData}
            onStartEdit={tableState.handleStartEdit}
            onCancelEdit={tableState.handleCancelEdit}
            onSaveEdit={tableState.handleSaveEdit}
            onDataChange={tableState.handleRowDataChange}
            editError={tableState.editError}
            isSaving={tableState.isSaving}
            actionState={tableState.actionState}
            onApprove={tableState.handleApprove} // Hook handles logic based on type
            onReject={tableState.handleReject}   // Hook handles logic based on type
            onDelete={tableState.handleDeleteClick}
            selectedRows={tableState.selectedRows}
            onRowSelect={tableState.handleRowSelect}
            onSelectAll={tableState.handleSelectAll}
            isAllSelected={tableState.isAllSelected}
            isAdding={tableState.isAdding}
            newRowFormData={tableState.editFormData['__NEW_ROW__'] || {}}
            onNewRowDataChange={(changes) => tableState.handleRowDataChange('__NEW_ROW__', changes)}
            onCancelAdd={tableState.handleCancelAdd}
            onSaveNewRow={tableState.handleSaveNewRow}
            isSavingNew={tableState.isSaving}
            confirmDeleteInfo={tableState.confirmDeleteInfo}
            setConfirmDeleteInfo={tableState.setConfirmDeleteInfo}
            handleDeleteConfirm={tableState.handleDeleteConfirm}
            cities={cities || []}
            neighborhoods={neighborhoods || []}
            // Other config
            showFilters={showFilters}
            // Let useAdminTableState/AdminTable handle row actions based on type/columns
            addRowEnabled={addRowEnabled}
            deleteRowEnabled={deleteRowEnabled}
        />
         // Optional: Render ConfirmationDialog using tableState.confirmDeleteInfo
    );
};

export default GenericAdminTableTab;