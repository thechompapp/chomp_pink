/**
 * Admin Table Data Hook
 * 
 * Handles data fetching, caching, and search functionality for admin tables.
 * Extracted from useEnhancedAdminTable for better separation of concerns.
 */

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { enhancedAdminService } from '@/services/enhancedAdminService';
import { logInfo, logError, logDebug } from '@/utils/logger';

/**
 * Hook for managing admin table data fetching and processing
 */
export const useAdminTableData = ({
  resourceType,
  initialData = [],
  currentPage,
  pageSize,
  sortConfig,
  filters,
  searchTerm,
  cacheTime = 5 * 60 * 1000, // 5 minutes
  staleTime = 2 * 60 * 1000   // 2 minutes
}) => {
  const queryClient = useQueryClient();
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

  // Main data query with enhanced error handling
  const { 
    data: queryData, 
    isLoading, 
    error: queryError, 
    refetch,
    isFetching 
  } = useQuery({
    queryKey,
    queryFn: async () => {
      logDebug(`[useAdminTableData] Fetching ${resourceType} data`);
      
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
    retry: (failureCount, error) => {
      // Don't retry timeout errors more than once
      if (error?.code === 'ECONNABORTED' && failureCount >= 1) {
        return false;
      }
      // Don't retry offline errors
      if (error?.isOffline) {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onSuccess: (data) => {
      logInfo(`[useAdminTableData] Successfully fetched ${resourceType} data:`, data?.length || 0);
      setError(null);
    },
    onError: (error) => {
      logError(`[useAdminTableData] Error fetching ${resourceType} data:`, error);
      setError(error);
      
      // More user-friendly error messages
      let errorMessage = `Failed to load ${resourceType}`;
      if (error?.code === 'ECONNABORTED') {
        errorMessage = `Loading ${resourceType} is taking longer than expected. Please try refreshing.`;
      } else if (error?.isOffline) {
        errorMessage = `Cannot load ${resourceType} - please check your internet connection.`;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  });

  // Process and sort data
  const processedData = useMemo(() => {
    let data = queryData || initialData || [];
    
    // Filter out null/undefined items to prevent errors
    data = data.filter(item => item && typeof item === 'object' && item.id != null);
    
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

  return {
    // Raw data
    queryData,
    processedData,
    paginatedData,
    
    // Pagination info
    totalPages,
    totalItems,
    
    // Loading states
    isLoading,
    isFetching,
    
    // Error states
    error: error || queryError,
    
    // Query functions
    refetch,
    queryKey,
    queryClient,
    
    // Search state
    debouncedSearchTerm
  };
};

export default useAdminTableData; 