/**
 * Enhanced Admin Table Component
 * 
 * A comprehensive admin table with:
 * - Real-time inline editing
 * - Advanced sorting and filtering
 * - Bulk operations
 * - Pagination
 * - Search functionality
 * - Error handling and recovery
 * - Performance optimizations
 */

import React, { useState, useMemo, useCallback } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X,
  RefreshCw,
  MoreHorizontal,
  Download,
  Upload
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useEnhancedAdminTable } from '@/hooks/useEnhancedAdminTable';
import { EnhancedEditableCell } from './EnhancedEditableCell';
import { COLUMN_CONFIG } from '@/pages/AdminPanel/columnConfig';
import GooglePlacesModal from './GooglePlacesModal';
import { enhancedAdminService } from '@/services/enhancedAdminService';

// Table header component
const TableHeader = ({ 
  columns, 
  sortConfig, 
  onSort, 
  selectedRows, 
  onSelectAll, 
  isAllSelected,
  enableSelection = true 
}) => (
  <thead className="bg-gray-50">
    <tr>
      {enableSelection && (
        <th className="w-12 px-4 py-3 text-left">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
          />
        </th>
      )}
      {columns.map((column) => (
        <th
          key={column.accessor}
          className={cn(
            "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
            column.isSortable !== false && "cursor-pointer hover:bg-gray-100"
          )}
          onClick={() => column.isSortable !== false && onSort(column.accessor)}
        >
          <div className="flex items-center space-x-1">
            <span>{column.header}</span>
            {column.isSortable !== false && sortConfig?.column === column.accessor && (
              sortConfig.direction === 'asc' ? 
                <ChevronUp className="w-4 h-4" /> : 
                <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </th>
      ))}
      <th className="w-16 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Actions
      </th>
    </tr>
  </thead>
);

// Table row component  
const TableRow = ({ 
  row, 
  columns, 
  resourceType,
  selectedRows, 
  onRowSelect, 
  onFieldEdit,
  onDelete,
  onOpenGooglePlaces,
  cities = [],
  neighborhoods = [],
  enableSelection = true,
  enableInlineEditing = true,
  isDeleting = false
}) => {
  const isSelected = selectedRows.has(row.id);
  
  return (
    <tr className={cn(
      "hover:bg-gray-50",
      isSelected && "bg-blue-50"
    )}>
      {enableSelection && (
        <td className="w-12 px-4 py-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onRowSelect(row.id)}
            className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
          />
        </td>
      )}
      {columns.map((column) => (
        <td key={column.accessor} className="px-4 py-3 text-sm">
          {enableInlineEditing && column.isEditable !== false ? (
            <EnhancedEditableCell
              resourceType={resourceType}
              rowId={row.id}
              fieldName={column.accessor}
              value={row[column.accessor]}
              columnConfig={column}
              cities={cities}
              neighborhoods={neighborhoods}
              onSave={onFieldEdit}
              disabled={!column.isEditable}
              row={row}
            />
          ) : (
            <div className="min-h-[32px] flex items-center">
              {column.render ? 
                column.render(row[column.accessor], row) : 
                (row[column.accessor] ?? <span className="text-gray-400 italic">N/A</span>)
              }
            </div>
          )}
        </td>
      ))}
      <td className="w-16 px-4 py-3">
        <div className="flex items-center gap-1">
          {/* Google Places button for restaurants */}
          {resourceType === 'restaurants' && onOpenGooglePlaces && (
            <button
              onClick={() => onOpenGooglePlaces(row)}
              className="p-1 text-orange-600 hover:bg-orange-100 rounded"
              title="Search Google Places"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
          
          {/* Delete button */}
          <button
            onClick={() => onDelete(row.id)}
            disabled={isDeleting}
            className="p-1 text-red-600 hover:bg-red-100 rounded"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

// Pagination component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  
  const pages = [];
  const showPages = 5;
  const start = Math.max(1, currentPage - Math.floor(showPages / 2));
  const end = Math.min(totalPages, start + showPages - 1);
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm border rounded disabled:opacity-50"
        >
          Previous
        </button>
        
        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cn(
              "px-3 py-1 text-sm border rounded",
              page === currentPage ? "bg-blue-500 text-white" : "hover:bg-gray-50"
            )}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
      
      <span className="text-sm text-gray-500">
        Page {currentPage} of {totalPages}
      </span>
    </div>
  );
};

// Toolbar component
const TableToolbar = ({ 
  searchTerm, 
  onSearch, 
  selectedRows, 
  onBulkEdit,
  onRefresh,
  onCreate,
  onClearFilters,
  isFetching = false,
  enableBulkOperations = true,
  enableCreate = true
}) => (
  <div className="flex items-center justify-between p-4 bg-white border-b">
    <div className="flex items-center space-x-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {/* Clear filters */}
      <button
        onClick={onClearFilters}
        className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
      >
        Clear Filters
      </button>
    </div>
    
    <div className="flex items-center space-x-2">
      {/* Selection info */}
      {selectedRows.size > 0 && (
        <span className="text-sm text-gray-500">
          {selectedRows.size} selected
        </span>
      )}
      
      {/* Bulk edit */}
      {enableBulkOperations && selectedRows.size > 0 && (
        <button
          onClick={onBulkEdit}
          className="px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Edit className="w-4 h-4 mr-1 inline" />
          Bulk Edit
        </button>
      )}
      
      {/* Refresh */}
      <button
        onClick={onRefresh}
        disabled={isFetching}
        className="p-2 text-gray-600 hover:bg-gray-100 rounded"
        title="Refresh"
      >
        <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
      </button>
      
      {/* Create */}
      {enableCreate && (
        <button
          onClick={onCreate}
          className="px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600"
        >
          <Plus className="w-4 h-4 mr-1 inline" />
          Add New
        </button>
      )}
    </div>
  </div>
);

// Loading component
const LoadingState = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    <span className="ml-2 text-gray-600">Loading...</span>
  </div>
);

// Error component
const ErrorState = ({ error, onRetry }) => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <p className="text-red-600 mb-4">{error?.message || 'An error occurred'}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Try Again
      </button>
    </div>
  </div>
);

// Empty state component
const EmptyState = ({ resourceType, onCreate }) => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <p className="text-gray-500 mb-4">No {resourceType} found</p>
      <button
        onClick={onCreate}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        <Plus className="w-4 h-4 mr-1 inline" />
        Add First {resourceType.slice(0, -1)}
      </button>
    </div>
  </div>
);

/**
 * Enhanced Admin Table Component
 */
export const EnhancedAdminTable = ({
  resourceType,
  initialData = [],
  cities = [],
  neighborhoods = [],
  pageSize = 20,
  enableInlineEditing = true,
  enableBulkOperations = true,
  enableSelection = true,
  enableCreate = true,
  onGlobalRefresh,
  className = ''
}) => {
  // Google Places modal state
  const [googlePlacesModal, setGooglePlacesModal] = useState({
    isOpen: false,
    restaurantId: null,
    currentData: {}
  });

  // Get column configuration
  const columns = useMemo(() => 
    COLUMN_CONFIG[resourceType] || [], 
    [resourceType]
  );
  
  // Use enhanced admin table hook
  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    currentPage,
    totalPages,
    totalItems,
    setCurrentPage,
    sortConfig,
    handleSort,
    searchTerm,
    handleSearch,
    selectedRows,
    handleRowSelect,
    handleSelectAll,
    isAllSelected,
    bulkEditMode,
    handleFieldEdit,
    handleCreate,
    handleDelete,
    handleRefresh,
    handleBulkEdit,
    handleBulkSave,
    handleBulkCancel,
    isUpdating,
    isCreating,
    isDeleting,
    isBatchUpdating,
    clearFilters,
    resetSelection
  } = useEnhancedAdminTable({
    resourceType,
    initialData,
    columns,
    pageSize,
    enableInlineEditing,
    enableBulkOperations
  });
  
  // Google Places modal handlers
  const handleOpenGooglePlaces = useCallback((row) => {
    setGooglePlacesModal({
      isOpen: true,
      restaurantId: row.id,
      currentData: row
    });
  }, []);

  const handleCloseGooglePlaces = useCallback(() => {
    setGooglePlacesModal({
      isOpen: false,
      restaurantId: null,
      currentData: {}
    });
  }, []);

  const handleApplyGooglePlaces = useCallback(async (restaurantId, extractedData) => {
    try {
      console.log('[EnhancedAdminTable] ===== APPLY GOOGLE PLACES DEBUG =====');
      console.log('[EnhancedAdminTable] Restaurant ID:', restaurantId);
      console.log('[EnhancedAdminTable] Extracted data:', JSON.stringify(extractedData, null, 2));
      
      // Apply multiple field updates
      const updates = {};
      
      if (extractedData.name) updates.name = extractedData.name;
      if (extractedData.address) updates.address = extractedData.address;
      if (extractedData.zipcode) updates.zipcode = extractedData.zipcode;
      if (extractedData.city?.id) updates.city_id = extractedData.city.id;
      if (extractedData.neighborhood?.id) updates.neighborhood_id = extractedData.neighborhood.id;
      if (extractedData.latitude !== undefined) updates.latitude = extractedData.latitude;
      if (extractedData.longitude !== undefined) updates.longitude = extractedData.longitude;
      if (extractedData.googlePlaceId) updates.google_place_id = extractedData.googlePlaceId;
      
      console.log('[EnhancedAdminTable] Updates to be applied:', JSON.stringify(updates, null, 2));
      
      // Apply the updates
      await enhancedAdminService.updateResource(resourceType, restaurantId, updates);
      console.log('[EnhancedAdminTable] Update completed successfully');
      
      // Force refresh all data to ensure neighborhoods are up to date
      await handleRefresh();
      console.log('[EnhancedAdminTable] Data refresh completed');
      
      // Also refresh global admin data if available (including neighborhoods)
      if (onGlobalRefresh) {
        await onGlobalRefresh();
        console.log('[EnhancedAdminTable] Global admin data refresh completed');
      }
      
      toast.success('Restaurant information updated successfully from Google Places');
    } catch (error) {
      console.error('Error applying Google Places data:', error);
      toast.error(`Failed to apply Google Places data: ${error.message}`);
      throw error;
    }
  }, [resourceType, handleRefresh, onGlobalRefresh]);
  
  // Create new item handler
  const handleCreateNew = useCallback(() => {
    toast.info('Create form not implemented yet');
  }, []);
  
  // Bulk edit save handler
  const handleBulkSaveClick = useCallback(() => {
    toast.info('Bulk edit form not implemented yet');
  }, []);
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  if (isError) {
    return <ErrorState error={error} onRetry={handleRefresh} />;
  }
  
  if (!isLoading && data.length === 0 && !searchTerm) {
    return <EmptyState resourceType={resourceType} onCreate={handleCreateNew} />;
  }
  
  return (
    <div className={cn("bg-white rounded-lg border", className)}>
      {/* Toolbar */}
      <TableToolbar
        searchTerm={searchTerm}
        onSearch={handleSearch}
        selectedRows={selectedRows}
        onBulkEdit={handleBulkEdit}
        onRefresh={handleRefresh}
        onCreate={handleCreateNew}
        onClearFilters={clearFilters}
        isFetching={isFetching}
        enableBulkOperations={enableBulkOperations}
        enableCreate={enableCreate}
      />
      
      {/* Bulk edit mode toolbar */}
      {bulkEditMode && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border-b">
          <span className="text-sm text-blue-800">
            Bulk editing {selectedRows.size} items
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleBulkSaveClick}
              disabled={isBatchUpdating}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isBatchUpdating ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleBulkCancel}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <TableHeader
            columns={columns}
            sortConfig={sortConfig}
            onSort={handleSort}
            selectedRows={selectedRows}
            onSelectAll={handleSelectAll}
            isAllSelected={isAllSelected}
            enableSelection={enableSelection}
          />
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row) => (
              <TableRow
                key={row.id}
                row={row}
                columns={columns}
                resourceType={resourceType}
                selectedRows={selectedRows}
                onRowSelect={handleRowSelect}
                onFieldEdit={handleFieldEdit}
                onDelete={handleDelete}
                onOpenGooglePlaces={handleOpenGooglePlaces}
                cities={cities}
                neighborhoods={neighborhoods}
                enableSelection={enableSelection}
                enableInlineEditing={enableInlineEditing}
                isDeleting={isDeleting}
              />
            ))}
          </tbody>
        </table>
      </div>
      
      {/* No results message */}
      {data.length === 0 && searchTerm && (
        <div className="text-center py-8 text-gray-500">
          No results found for "{searchTerm}"
        </div>
      )}
      
      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
      
      {/* Status bar */}
      <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500">
        Showing {data.length} of {totalItems} {resourceType}
        {isUpdating && <span className="ml-2">• Saving...</span>}
        {isFetching && <span className="ml-2">• Refreshing...</span>}
      </div>

      {/* Google Places Modal */}
      <GooglePlacesModal
        isOpen={googlePlacesModal.isOpen}
        onClose={handleCloseGooglePlaces}
        onApply={handleApplyGooglePlaces}
        restaurantId={googlePlacesModal.restaurantId}
        currentData={googlePlacesModal.currentData}
        cities={cities}
        neighborhoods={neighborhoods}
      />
    </div>
  );
};

export default EnhancedAdminTable; 