/**
 * Enhanced Admin Table Hook - Refactored
 * 
 * Main orchestrator that combines specialized hooks for a complete admin table solution.
 * This refactored version improves maintainability and testability by separating concerns.
 */

import { useState, useEffect } from 'react';
import useAdminTableData from './useAdminTableData';
import useAdminTableMutations from './useAdminTableMutations';
import useAdminTableSelection from './useAdminTableSelection';
import useAdminTableFiltering from './useAdminTableFiltering';

/**
 * Enhanced Admin Table Hook - Refactored for better separation of concerns
 */
export const useAdminTable = ({
  resourceType,
  initialData = [],
  pageSize = 20,
  enableRealTimeUpdates = true,
  cacheTime = 5 * 60 * 1000, // 5 minutes
  staleTime = 2 * 60 * 1000   // 2 minutes
}) => {
  // Create/Edit UI state
  const [isCreating, setIsCreating] = useState(false);
  const [newResourceData, setNewResourceData] = useState({});

  // 1. Filtering, sorting, and pagination logic
  const filtering = useAdminTableFiltering({ pageSize });

  // 2. Data fetching and processing
  const dataHook = useAdminTableData({
    resourceType,
    initialData,
    currentPage: filtering.currentPage,
    pageSize: filtering.pageSize,
    sortConfig: filtering.sortConfig,
    filters: filtering.filters,
    searchTerm: filtering.searchTerm,
    cacheTime,
    staleTime
  });

  // 3. Row selection management
  const selection = useAdminTableSelection({
    paginatedData: dataHook.paginatedData
  });

  // 4. CRUD operations and mutations
  const mutations = useAdminTableMutations({
    resourceType,
    queryKey: dataHook.queryKey,
    queryClient: dataHook.queryClient,
    refetch: dataHook.refetch,
    selectedRows: selection.selectedRows,
    setSelectedRows: selection.setSelectedRows
  });

  // Enhanced handlers that work with the refactored structure
  const handlePageChange = (page) => {
    filtering.handlePageChange(page, dataHook.totalPages);
  };

  const handleRefresh = () => {
    filtering.handleRefresh(dataHook.refetch);
  };

  const handleBulkSave = () => {
    selection.handleBulkSave(dataHook.refetch);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setNewResourceData({});
  };

  const handleCreateSave = (data) => {
    mutations.handleCreate(data);
    setIsCreating(false);
    setNewResourceData({});
  };

  const handleCreateCancel = () => {
    setIsCreating(false);
    setNewResourceData({});
  };

  // Cleanup mutations on unmount
  useEffect(() => {
    return mutations.cleanup;
  }, [mutations.cleanup]);

  // Return the complete API surface
  return {
    // Data
    data: dataHook.paginatedData,
    allData: dataHook.processedData,
    totalItems: dataHook.totalItems,
    totalPages: dataHook.totalPages,
    currentPage: filtering.currentPage,
    
    // State
    sortConfig: filtering.sortConfig,
    filters: filtering.filters,
    searchTerm: filtering.searchTerm,
    selectedRows: selection.selectedRows,
    isAllSelected: selection.isAllSelected,
    hasSelection: selection.hasSelection,
    
    // Loading states
    isLoading: dataHook.isFetching,
    isUpdating: mutations.isUpdating,
    isDeleting: mutations.isDeleting,
    isBulkUpdating: mutations.isBulkUpdating,
    error: dataHook.error,
    
    // Create/Edit states
    isCreating,
    isCreatingNew: mutations.isCreating,
    newResourceData,
    bulkEditMode: selection.bulkEditMode,
    isBatchUpdating: mutations.isBulkUpdating,
    
    // Filtering and pagination actions
    handleSort: filtering.handleSort,
    handlePageChange,
    handleSearch: filtering.handleSearch,
    handleFilter: filtering.handleFilter,
    handleClearFilters: filtering.handleClearFilters,
    
    // Selection actions
    handleRowSelect: selection.handleRowSelect,
    handleSelectAll: selection.handleSelectAll,
    resetSelection: selection.resetSelection,
    
    // CRUD actions
    handleFieldEdit: mutations.handleFieldEdit,
    handleDelete: mutations.handleDelete,
    handleBulkUpdate: mutations.handleBulkUpdate,
    
    // Create actions
    handleCreate,
    handleCreateSave,
    handleCreateCancel,
    
    // Bulk edit actions
    handleBulkEdit: selection.handleBulkEdit,
    handleBulkSave,
    handleBulkCancel: selection.handleBulkCancel,
    
    // Utility actions
    handleRefresh,
    setCurrentPage: filtering.setCurrentPage
  };
};

// Keep the original export name for backward compatibility
export const useEnhancedAdminTable = useAdminTable;

export default useAdminTable; 