/**
 * useListData Hook
 * 
 * Custom hook for fetching and managing list data.
 * Extracted from ListDetail.jsx to improve separation of concerns.
 */
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listService } from '@/services/listService.js';
import { logDebug, logError, logInfo } from '@/utils/logger';
import useApiErrorHandler from '@/hooks/useApiErrorHandler';

/**
 * Custom hook for fetching and managing list data
 * @param {string} listId - ID of the list to fetch
 * @returns {Object} List data state and functions
 */
const useListData = (listId) => {
  const handleApiError = useApiErrorHandler();
  
  // Ensure we're using real data (not mock data)
  useEffect(() => {
    // Remove any mock data flags to force DB connection
    localStorage.removeItem('use_mock_data');
    logInfo('[useListData] Forcing database data');
  }, []);

  // Fetch list data using React Query with enhanced error handling
  const { 
    data, 
    isLoading, 
    isError,
    error,
    refetch 
  } = useQuery({
    queryKey: ['listDetail', listId],
    queryFn: async () => {
      logDebug(`[useListData] Fetching details for list ID: ${listId}`);
      try {
        // First get the list details
        const listResult = await listService.getList(listId);
        if (!listResult || !listResult.data) {
          throw new Error('Invalid or empty list data received');
        }
        
        // Then get the list items
        const itemsResult = await listService.getListItems(listId);
        
        console.log(`[useListData] List result:`, listResult);
        console.log(`[useListData] Items result:`, itemsResult);
        console.log(`[useListData] Items result data:`, itemsResult?.data);
        console.log(`[useListData] Items result data is array:`, Array.isArray(itemsResult?.data));
        
        // Combine the results into the expected format
        const combinedResult = {
          list: listResult.data,
          items: itemsResult?.data || []
        };
        
        console.log(`[useListData] Combined result:`, combinedResult);
        console.log(`[useListData] Combined result items length:`, combinedResult.items.length);
        
        return combinedResult;
      } catch (err) {
        logError(`[useListData] Error in query function:`, err);
        // Rethrow to let React Query handle it
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: attempt => Math.min(attempt > 1 ? 2000 : 1000, 30 * 1000),
    onError: (err) => {
      logError(`[useListData] Error fetching list details:`, err);
      handleApiError(err, "fetch list details");
    }
  });

  // Destructure list data from query results
  const { list = {}, items = [] } = data || {};
  
  return {
    list,
    items,
    isLoading,
    isError,
    error,
    refetch
  };
};

export default useListData;
