// src/hooks/useAdminTable.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { enhancedAdminService } from '@/services/enhancedAdminService';
import { logInfo, logWarn, logError } from '@/utils/logger';

/**
 * Enhanced Admin Table Hook
 * Provides comprehensive table functionality for admin data management
 */
export const useAdminTable = (resourceType, initialData = [], options = {}) => {
  const {
    pageSize = 20,
    enableSorting = true,
    enableFiltering = true,
    enableSelection = true,
    enableSearch = true,
    autoRefresh = false,
    refreshInterval = 30000
  } = options;

  // Core state
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Sorting state
  const [sortBy, setSortBy] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Filtering state
  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection state
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Edit state
  const [editingCell, setEditingCell] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({});

  // Define searchable fields for each resource type
  const searchableFields = {
    restaurants: ['name', 'cuisine', 'address'],
    dishes: ['name', 'description'],
    users: ['username', 'email', 'full_name'],
    cities: ['name', 'state', 'country'],
    neighborhoods: ['name'],
    hashtags: ['name', 'category'],
    restaurant_chains: ['name', 'description'],
    submissions: ['restaurant_name', 'dish_name']
  };

  // Load data with current parameters
  const loadData = useCallback(async () => {
    if (!resourceType) return;
    
    setLoading(true);
    setError(null);
    
    try {
      logInfo(`[useAdminTable] Loading ${resourceType} data`);
      
      const params = {
        page: currentPage,
        limit: pageSize,
        ...(sortBy && { sort: sortBy, order: sortDirection }),
        ...(searchQuery && { search: searchQuery }),
        ...filters
      };
      
      const response = await enhancedAdminService.searchResources(resourceType, searchQuery, {
        page: currentPage,
        limit: pageSize,
        sort: sortBy,
        order: sortDirection,
        ...filters
      });
      
      // Handle different response formats
      if (response.data && response.pagination) {
        setData(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotalCount(response.pagination.totalCount);
      } else if (Array.isArray(response)) {
        setData(response);
        setTotalPages(Math.ceil(response.length / pageSize));
        setTotalCount(response.length);
      } else {
        setData(response.data || response);
        setTotalPages(1);
        setTotalCount((response.data || response).length);
      }
      
      logInfo(`[useAdminTable] Successfully loaded ${resourceType} data`);
      
    } catch (err) {
      logError(`[useAdminTable] Error loading ${resourceType} data:`, err);
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [resourceType, currentPage, pageSize, sortBy, sortDirection, searchQuery, filters]);

  // Load data when dependencies change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(loadData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadData]);

  // Filtered and sorted data
  const processedData = useMemo(() => {
    let result = [...data];
    
    // Apply client-side search if enabled
    if (searchQuery && enableSearch) {
      const fields = searchableFields[resourceType] || ['name'];
      result = result.filter(item => 
        fields.some(field => 
          item[field]?.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    
    // Apply client-side sorting if enabled and not handled by server
    if (sortBy && enableSorting) {
      result.sort((a, b) => {
        const aVal = a[sortBy] || '';
        const bVal = b[sortBy] || '';
        
        // Handle different data types
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = aVal.toString().toLowerCase();
        const bStr = bVal.toString().toLowerCase();
        
        if (sortDirection === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }
    
    return result;
  }, [data, searchQuery, sortBy, sortDirection, resourceType, enableSearch, enableSorting]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return processedData.slice(startIndex, startIndex + pageSize);
  }, [processedData, currentPage, pageSize]);

  // Handlers
  const handleSort = useCallback((column) => {
    if (!enableSorting) return;
    
    if (sortBy === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  }, [sortBy, enableSorting]);

  const handleFilter = useCallback((filterKey, filterValue) => {
    if (!enableFiltering) return;
    
    setFilters(prev => ({
      ...prev,
      [filterKey]: filterValue
    }));
    setCurrentPage(1);
  }, [enableFiltering]);

  const handleSearch = useCallback((query) => {
    if (!enableSearch) return;
    
    setSearchQuery(query);
    setCurrentPage(1);
  }, [enableSearch]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleRowSelect = useCallback((rowId, isSelected) => {
    if (!enableSelection) return;
    
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(rowId);
      } else {
        newSet.delete(rowId);
      }
      return newSet;
    });
  }, [enableSelection]);

  const handleSelectAll = useCallback((isSelected) => {
    if (!enableSelection) return;
    
    if (isSelected) {
      const allIds = paginatedData.map(item => item.id);
      setSelectedRows(new Set(allIds));
      setSelectAll(true);
    } else {
      setSelectedRows(new Set());
      setSelectAll(false);
    }
  }, [enableSelection, paginatedData]);

  const handleCellEdit = useCallback((rowId, columnKey, value) => {
    setEditingCell({ rowId, columnKey });
    setPendingChanges(prev => ({
      ...prev,
      [`${rowId}-${columnKey}`]: value
    }));
  }, []);

  const handleCellSave = useCallback(async (rowId, columnKey, value) => {
    try {
      setLoading(true);
      
      await enhancedAdminService.updateResource(resourceType, rowId, {
        [columnKey]: value
      });
      
      // Update local data
      setData(prev => prev.map(item => 
        item.id === rowId ? { ...item, [columnKey]: value } : item
      ));
      
      // Clear pending changes
      setPendingChanges(prev => {
        const next = { ...prev };
        delete next[`${rowId}-${columnKey}`];
        return next;
      });
      
      setEditingCell(null);
      
    } catch (err) {
      logError(`[useAdminTable] Error saving cell edit:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [resourceType]);

  const handleCellCancel = useCallback((rowId, columnKey) => {
    setPendingChanges(prev => {
      const next = { ...prev };
      delete next[`${rowId}-${columnKey}`];
      return next;
    });
    setEditingCell(null);
  }, []);

  const handleRefresh = useCallback(() => {
    loadData();
  }, [loadData]);

  const handleDelete = useCallback(async (rowIds) => {
    try {
      setLoading(true);
      
      if (Array.isArray(rowIds)) {
        await enhancedAdminService.bulkDelete(resourceType, rowIds);
      } else {
        await enhancedAdminService.deleteResource(resourceType, rowIds);
      }
      
      // Refresh data
      await loadData();
      
      // Clear selection
      setSelectedRows(new Set());
      setSelectAll(false);
      
    } catch (err) {
      logError(`[useAdminTable] Error deleting rows:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [resourceType, loadData]);

  // Return table state and handlers
  return {
    // Data
    data: paginatedData,
    allData: processedData,
    rawData: data,
    
    // State
    loading,
    error,
    
    // Pagination
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    
    // Sorting
    sortBy,
    sortDirection,
    
    // Filtering & Search
    filters,
    searchQuery,
    
    // Selection
    selectedRows,
    selectAll,
    
    // Editing
    editingCell,
    pendingChanges,
    
    // Handlers
    handleSort,
    handleFilter,
    handleSearch,
    handlePageChange,
    handleRowSelect,
    handleSelectAll,
    handleCellEdit,
    handleCellSave,
    handleCellCancel,
    handleRefresh,
    handleDelete,
    
    // Utils
    setData,
    setError,
    clearSelection: () => {
      setSelectedRows(new Set());
      setSelectAll(false);
    },
    clearFilters: () => {
      setFilters({});
      setSearchQuery('');
      setCurrentPage(1);
    }
  };
};

export default useAdminTable;
