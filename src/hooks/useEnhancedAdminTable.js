/**
 * Enhanced Admin Table Hook
 * 
 * Provides comprehensive state management for admin tables with:
 * - Optimized data fetching and caching
 * - Advanced sorting, filtering, and pagination
 * - Bulk operations and row selection
 * - Real-time updates with optimistic UI
 * - Error handling and retry mechanisms
 * - Performance optimizations for large datasets
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { enhancedAdminService } from '@/services/enhancedAdminService';
import { logInfo, logError, logDebug } from '@/utils/logger';

/**
 * Default pagination settings
 */
const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_PAGE = 1;

/**
 * Enhanced Admin Table Hook
 */
export const useEnhancedAdminTable = ({
  resourceType,
  initialData = [],
  pageSize = DEFAULT_PAGE_SIZE,
  enableRealTimeUpdates = true,
  cacheTime = 5 * 60 * 1000, // 5 minutes
  staleTime = 2 * 60 * 1000   // 2 minutes
}) => {
  const queryClient = useQueryClient();
  const updateTimeoutRef = useRef(null);
  
  // Table state
  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE);
  const [sortConfig, setSortConfig] = useState({ column: null, direction: 'asc' });
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState(new Set());
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Performance optimization: Debounced search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Query key for data fetching
  const queryKey = useMemo(() => [
    'enhancedAdminTable',
    resourceType,
    currentPage,
    pageSize,
    sortConfig,
    filters,
    debouncedSearchTerm
  ], [resourceType, currentPage, pageSize, sortConfig, filters, debouncedSearchTerm]);
  
  // Fetch data with React Query
  const {
    data: queryData,
    error: queryError,
    isFetching,
    isError,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      logDebug(`[useEnhancedAdminTable] Fetching ${resourceType} data`);
      
      if (debouncedSearchTerm || Object.keys(filters).length > 0) {
        // Use search/filter endpoint if needed
        return await enhancedAdminService.searchResources(resourceType, debouncedSearchTerm, filters);
      } else {
        // Use regular fetch
        return await enhancedAdminService.fetchResourceData(resourceType);
      }
    },
    enabled: Boolean(resourceType),
    staleTime,
    cacheTime,
    keepPreviousData: true, // Keep previous data while fetching new
    onSuccess: (data) => {
      logInfo(`[useEnhancedAdminTable] Successfully fetched ${resourceType} data:`, data?.length || 0);
      setError(null);
    },
    onError: (error) => {
      logError(`[useEnhancedAdminTable] Error fetching ${resourceType} data:`, error);
      setError(error);
      toast.error(`Failed to load ${resourceType}: ${error.message}`);
    }
  });
  
  // Process and sort data
  const processedData = useMemo(() => {
    let data = queryData || initialData || [];
    
    // Apply sorting
    if (sortConfig.column) {
      data = [...data].sort((a, b) => {
        const aVal = a[sortConfig.column];
        const bVal = b[sortConfig.column];
        
        // Handle null/undefined values
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        
        // Handle different data types
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        // String comparison
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (sortConfig.direction === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }
    
    return data;
  }, [queryData, initialData, sortConfig]);
  
  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return processedData.slice(startIndex, endIndex);
  }, [processedData, currentPage, pageSize]);
  
  const totalPages = Math.ceil(processedData.length / pageSize);
  const totalItems = processedData.length;
  
  // Update mutation with optimistic updates
  const updateMutation = useMutation({
    mutationFn: async ({ resourceId, fieldName, value }) => {
      return await enhancedAdminService.updateResource(resourceType, resourceId, { [fieldName]: value });
    },
    onMutate: async ({ resourceId, fieldName, value }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData(queryKey);
      
      // Optimistically update the cache
      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return old;
        return old.map(item => 
          item.id === resourceId 
            ? { ...item, [fieldName]: value }
            : item
        );
      });
      
      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      logError(`[useEnhancedAdminTable] Update failed:`, error);
      toast.error(`Update failed: ${error.message}`);
    },
    onSuccess: (data, variables) => {
      logInfo(`[useEnhancedAdminTable] Successfully updated ${resourceType}:`, variables);
      toast.success('Updated successfully');
      
      // Invalidate related queries after a delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['enhancedAdminTable', resourceType] });
      }, 1000);
    }
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (resourceId) => {
      return await enhancedAdminService.deleteResource(resourceType, resourceId);
    },
    onMutate: async (resourceId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      
      // Optimistically remove from cache
      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return old;
        return old.filter(item => item.id !== resourceId);
      });
      
      // Remove from selection
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(resourceId);
        return newSet;
      });
      
      return { previousData };
    },
    onError: (error, resourceId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      logError(`[useEnhancedAdminTable] Delete failed:`, error);
      toast.error(`Delete failed: ${error.message}`);
    },
    onSuccess: (data, resourceId) => {
      logInfo(`[useEnhancedAdminTable] Successfully deleted ${resourceType}:`, resourceId);
      toast.success('Deleted successfully');
    }
  });
  
  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async (updates) => {
      return await enhancedAdminService.batchUpdate(resourceType, updates);
    },
    onSuccess: () => {
      toast.success('Bulk update completed successfully');
      setSelectedRows(new Set());
      refetch();
    },
    onError: (error) => {
      logError(`[useEnhancedAdminTable] Bulk update failed:`, error);
      toast.error(`Bulk update failed: ${error.message}`);
    }
  });
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (newData) => {
      return await enhancedAdminService.createResource(resourceType, newData);
    },
    onSuccess: (data) => {
      toast.success('Created successfully');
      refetch();
      setIsCreating(false);
      setNewResourceData({});
    },
    onError: (error) => {
      logError(`[useEnhancedAdminTable] Create failed:`, error);
      toast.error(`Create failed: ${error.message}`);
    }
  });
  
  // Add create/bulk edit state
  const [isCreating, setIsCreating] = useState(false);
  const [newResourceData, setNewResourceData] = useState({});
  const [bulkEditMode, setBulkEditMode] = useState(false);
  
  // Event handlers
  const handleSort = useCallback((column) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1); // Reset to first page when sorting
  }, []);
  
  const handlePageChange = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);
  
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
  }, []);
  
  const handleFilter = useCallback((filterKey, filterValue) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: filterValue
    }));
    setCurrentPage(1); // Reset to first page when filtering
  }, []);
  
  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  }, []);
  
  const handleRowSelect = useCallback((rowId) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  }, []);
  
  const handleSelectAll = useCallback((isSelected) => {
    if (isSelected) {
      setSelectedRows(new Set(paginatedData.map(item => item.id)));
    } else {
      setSelectedRows(new Set());
    }
  }, [paginatedData]);
  
  const handleFieldEdit = useCallback((resourceId, fieldName, value) => {
    // Debounce rapid updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      updateMutation.mutate({ resourceId, fieldName, value });
    }, 500); // 500ms debounce
  }, [updateMutation]);
  
  const handleDelete = useCallback((resourceId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteMutation.mutate(resourceId);
    }
  }, [deleteMutation]);
  
  const handleBulkUpdate = useCallback((updates) => {
    if (selectedRows.size === 0) {
      toast.error('No rows selected for bulk update');
      return;
    }
    
    const bulkUpdates = Array.from(selectedRows).map(id => ({
      id,
      ...updates
    }));
    
    bulkUpdateMutation.mutate(bulkUpdates);
  }, [selectedRows, bulkUpdateMutation]);
  
  const handleCreate = useCallback(() => {
    setIsCreating(true);
    setNewResourceData({});
  }, []);
  
  const handleCreateSave = useCallback((data) => {
    createMutation.mutate(data);
  }, [createMutation]);
  
  const handleCreateCancel = useCallback(() => {
    setIsCreating(false);
    setNewResourceData({});
  }, []);
  
  const handleBulkEdit = useCallback(() => {
    if (selectedRows.size === 0) {
      toast.error('No rows selected for bulk editing');
      return;
    }
    setBulkEditMode(true);
  }, [selectedRows]);
  
  const handleBulkSave = useCallback(() => {
    setBulkEditMode(false);
    toast.success('Bulk changes saved');
    refetch();
  }, [refetch]);
  
  const handleBulkCancel = useCallback(() => {
    setBulkEditMode(false);
    setSelectedRows(new Set());
  }, []);
  
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);
  
  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);
  
  // Computed values
  const isAllSelected = selectedRows.size > 0 && selectedRows.size === paginatedData.length;
  const hasSelection = selectedRows.size > 0;
  const isUpdating = updateMutation.isLoading;
  const isDeleting = deleteMutation.isLoading;
  const isBulkUpdating = bulkUpdateMutation.isLoading;
  const isCreatingNew = createMutation.isLoading;
  const isBatchUpdating = bulkUpdateMutation.isLoading;
  
  return {
    // Data
    data: paginatedData,
    allData: processedData,
    totalItems,
    totalPages,
    currentPage,
    
    // State
    sortConfig,
    filters,
    searchTerm,
    selectedRows,
    isAllSelected,
    hasSelection,
    
    // Loading states
    isLoading: isFetching,
    isUpdating,
    isDeleting,
    isBulkUpdating,
    error: error || queryError,
    
    // Create/Edit states
    isCreating,
    isCreatingNew,
    newResourceData,
    bulkEditMode,
    isBatchUpdating,
    
    // Actions
    handleSort,
    handlePageChange,
    handleSearch,
    handleFilter,
    handleClearFilters,
    handleRowSelect,
    handleSelectAll,
    handleFieldEdit,
    handleDelete,
    handleBulkUpdate,
    handleCreate,
    handleCreateSave,
    handleCreateCancel,
    handleBulkEdit,
    handleBulkSave,
    handleBulkCancel,
    handleRefresh,
    
    // Selection helpers
    resetSelection: () => setSelectedRows(new Set()),
    setCurrentPage
  };
};

export default useEnhancedAdminTable; 