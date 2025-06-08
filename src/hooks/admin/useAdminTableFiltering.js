/**
 * Admin Table Filtering Hook
 * 
 * Handles filtering, sorting, pagination, and search functionality for admin tables.
 * Extracted from useEnhancedAdminTable for better separation of concerns.
 */

import { useState, useCallback } from 'react';

/**
 * Default pagination settings
 */
const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_PAGE = 1;

/**
 * Hook for managing admin table filtering, sorting, and pagination
 */
export const useAdminTableFiltering = ({
  pageSize = DEFAULT_PAGE_SIZE
}) => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ column: null, direction: 'asc' });
  
  // Filtering state
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Sorting handler
  const handleSort = useCallback((column) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1); // Reset to first page when sorting
  }, []);

  // Pagination handler
  const handlePageChange = useCallback((page, totalPages) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, []);

  // Search handler
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  // Filter handler
  const handleFilter = useCallback((filterKey, filterValue) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: filterValue
    }));
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  // Clear filters handler
  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  // Refresh handler (resets to first page)
  const handleRefresh = useCallback((refetchFn) => {
    setCurrentPage(1);
    refetchFn();
  }, []);

  return {
    // State
    currentPage,
    sortConfig,
    filters,
    searchTerm,
    pageSize,
    
    // State setters (for direct access when needed)
    setCurrentPage,
    setSortConfig,
    setFilters,
    setSearchTerm,
    
    // Handlers
    handleSort,
    handlePageChange,
    handleSearch,
    handleFilter,
    handleClearFilters,
    handleRefresh
  };
};

export default useAdminTableFiltering; 