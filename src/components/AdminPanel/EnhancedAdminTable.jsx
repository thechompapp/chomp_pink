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
 * - Data cleanup functionality
 * - Virtual scrolling for large datasets
 * - Dynamic column configuration
 * - Enhanced caching
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  Upload,
  Save,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useEnhancedAdminTable } from '@/hooks/useEnhancedAdminTable';
import { EnhancedEditableCell } from './EnhancedEditableCell';
import { getColumnsForResource } from '@/utils/dynamicColumnConfig';
import { adminCache } from '@/utils/enhancedCache';
import { TableRow } from './TableRow';
import { CreateForm } from './CreateForm';
import { VirtualizedTable, withVirtualization } from './VirtualizedTable';
import GooglePlacesModal from './GooglePlacesModal';
import { DataCleanupButton } from './DataCleanupButton';
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
            aria-label="Select all rows"
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
              page === currentPage 
                ? "bg-blue-500 text-white border-blue-500" 
                : "hover:bg-gray-50"
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
      
      <div className="text-sm text-gray-500">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
};

// Table toolbar with enhanced features
const TableToolbar = ({ 
  resourceType,
  data = [],
  searchTerm, 
  onSearch, 
  selectedRows, 
  onBulkEdit,
  onRefresh,
  onCreate,
  onClearFilters,
  isFetching = false,
  enableBulkOperations = true,
  enableCreate = true,
  onBulkDelete,
  onToggleVirtualization,
  isVirtualized = false
}) => (
  <div className="flex items-center justify-between p-4 border-b">
    <div className="flex items-center space-x-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder={`Search ${resourceType}...`}
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {/* Cache Status */}
      <div className="text-xs text-gray-500">
        Cache: {adminCache.getStats().hitRate} hit rate
      </div>
    </div>
    
    <div className="flex items-center space-x-2">
      {/* Virtualization Toggle */}
      {data.length > 50 && (
        <button
          onClick={onToggleVirtualization}
          className={cn(
            "px-3 py-2 text-sm rounded-md transition-colors",
            isVirtualized 
              ? "bg-green-100 text-green-800" 
              : "bg-gray-100 text-gray-800"
          )}
          title={isVirtualized ? "Disable virtualization" : "Enable virtualization"}
        >
          Virtual: {isVirtualized ? 'ON' : 'OFF'}
        </button>
      )}
      
      {/* Bulk operations */}
      {enableBulkOperations && selectedRows.size > 0 && (
        <>
          <button
            onClick={onBulkEdit}
            className="flex items-center px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            <Edit className="w-4 h-4 mr-1" />
            Bulk Edit ({selectedRows.size})
          </button>
          <button
            onClick={onBulkDelete}
            className="flex items-center px-3 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete ({selectedRows.size})
          </button>
        </>
      )}
      
      {/* Data cleanup */}
      <DataCleanupButton resourceType={resourceType} />
      
      {/* Create button */}
      {enableCreate && (
        <button
          onClick={onCreate}
          className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New
        </button>
      )}
      
      {/* Refresh button */}
      <button
        onClick={onRefresh}
        disabled={isFetching}
        className="flex items-center px-3 py-2 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50"
      >
        <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
      </button>
    </div>
  </div>
);

const LoadingState = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    <span className="ml-2 text-gray-600">Loading...</span>
  </div>
);

const ErrorState = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center h-64 text-red-600">
    <p className="mb-4">Error: {error?.message || 'Something went wrong'}</p>
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
    >
      Retry
    </button>
  </div>
);

const EmptyState = ({ resourceType, onCreate }) => (
  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
    <p className="mb-4">No {resourceType} found</p>
    <button
      onClick={onCreate}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Create First {resourceType.slice(0, -1)}
    </button>
  </div>
);

// Create enhanced table with virtualization support
const EnhancedTable = withVirtualization(({ 
  data,
  columns,
  resourceType,
  selectedRows,
  handleRowSelect,
  handleFieldEdit,
  handleDeleteClick,
  handleOpenGooglePlaces,
  cities,
  neighborhoods,
  enableSelection,
  enableInlineEditing,
  isDeleting
}) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
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
            onDelete={handleDeleteClick}
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
));

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
  className = '',
  columnOptions = {}
}) => {
  // State for enhanced features
  const [isVirtualized, setIsVirtualized] = useState(false);
  
  // Google Places modal state
  const [googlePlacesModal, setGooglePlacesModal] = useState({
    isOpen: false,
    restaurantId: null,
    currentData: {}
  });

  // Get column configuration with dynamic options
  const columns = useMemo(() => 
    getColumnsForResource(resourceType, columnOptions),
    [resourceType, columnOptions]
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
    handleClearFilters,
    resetSelection,
    handleCreateSave,
    handleCreateCancel,
    isCreatingNew
  } = useEnhancedAdminTable({
    resourceType,
    initialData,
    columns,
    pageSize,
    enableInlineEditing,
    enableBulkOperations
  });

  // Cache data whenever it changes
  useEffect(() => {
    if (data.length > 0) {
      adminCache.setResourceData(resourceType, data, { 
        searchTerm, 
        page: currentPage 
      });
    }
  }, [data, resourceType, searchTerm, currentPage]);

  // Auto-enable virtualization for large datasets
  useEffect(() => {
    if (data.length > 100) {
      setIsVirtualized(true);
    }
  }, [data.length]);
  
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
      
      // Invalidate cache for this resource
      adminCache.invalidateResource(resourceType);
      
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
  
  const handleDeleteClick = useCallback((itemId) => {
    // Invalidate cache when deleting
    adminCache.invalidateResource(resourceType);
    handleDelete(itemId);
  }, [handleDelete, resourceType]);
  
  // Handle bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selectedRows.size === 0) {
      toast.error('No rows selected for deletion');
      return;
    }
    
    try {
      const ids = Array.from(selectedRows);
      await enhancedAdminService.bulkDelete(resourceType, ids);
      
      // Invalidate cache
      adminCache.invalidateResource(resourceType);
      
      toast.success(`Successfully deleted ${ids.length} ${resourceType}`);
      resetSelection();
      handleRefresh();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error(`Bulk delete failed: ${error.message}`);
    }
  }, [resourceType, selectedRows, resetSelection, handleRefresh]);
  
  const handleCreateNew = useCallback(() => {
    handleCreate();
  }, [handleCreate]);

  const handleToggleVirtualization = useCallback(() => {
    setIsVirtualized(prev => !prev);
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
        resourceType={resourceType}
        data={data}
        searchTerm={searchTerm}
        onSearch={handleSearch}
        selectedRows={selectedRows}
        onBulkEdit={handleBulkEdit}
        onRefresh={handleRefresh}
        onCreate={handleCreateNew}
        onClearFilters={handleClearFilters}
        isFetching={isFetching}
        enableBulkOperations={enableBulkOperations}
        enableCreate={enableCreate}
        onBulkDelete={handleBulkDelete}
        onToggleVirtualization={handleToggleVirtualization}
        isVirtualized={isVirtualized}
      />
      
      {/* Bulk edit mode toolbar */}
      {bulkEditMode && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border-b">
          <span className="text-sm text-blue-800">
            Bulk editing {selectedRows.size} items
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleBulkSave}
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
      {isVirtualized ? (
        <div>
          {/* Create form for virtualized table */}
          {isCreating && (
            <div className="border-b">
              <table className="w-full">
                <tbody>
                  <CreateForm
                    resourceType={resourceType}
                    columns={columns}
                    onSave={handleCreateSave}
                    onCancel={handleCreateCancel}
                    isLoading={isCreatingNew}
                    cities={cities}
                    neighborhoods={neighborhoods}
                  />
                </tbody>
              </table>
            </div>
          )}
          
          <VirtualizedTable
            data={data}
            columns={columns}
            resourceType={resourceType}
            selectedRows={selectedRows}
            onRowSelect={handleRowSelect}
            onFieldEdit={handleFieldEdit}
            onDelete={handleDeleteClick}
            onOpenGooglePlaces={handleOpenGooglePlaces}
            cities={cities}
            neighborhoods={neighborhoods}
            enableSelection={enableSelection}
            enableInlineEditing={enableInlineEditing}
            isDeleting={isDeleting}
          />
        </div>
      ) : (
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
              {/* Create form row */}
              {isCreating && (
                <CreateForm
                  resourceType={resourceType}
                  columns={columns}
                  onSave={handleCreateSave}
                  onCancel={handleCreateCancel}
                  isLoading={isCreatingNew}
                  cities={cities}
                  neighborhoods={neighborhoods}
                />
              )}
              
              {data
                .filter(row => row && row.id)
                .map((row) => (
                <TableRow
                  key={row.id}
                  row={row}
                  columns={columns}
                  resourceType={resourceType}
                  selectedRows={selectedRows}
                  onRowSelect={handleRowSelect}
                  onFieldEdit={handleFieldEdit}
                  onDelete={handleDeleteClick}
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
      )}
      
      {/* Pagination */}
      {!isVirtualized && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
      
      {/* Google Places Modal */}
      <GooglePlacesModal
        isOpen={googlePlacesModal.isOpen}
        onClose={handleCloseGooglePlaces}
        restaurantId={googlePlacesModal.restaurantId}
        currentData={googlePlacesModal.currentData}
        onApply={handleApplyGooglePlaces}
        cities={cities}
        neighborhoods={neighborhoods}
      />
    </div>
  );
};

export default EnhancedAdminTable; 