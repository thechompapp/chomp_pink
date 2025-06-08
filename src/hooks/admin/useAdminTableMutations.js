/**
 * Admin Table Mutations Hook
 * 
 * Handles CRUD operations with optimistic updates for admin tables.
 * Extracted from useEnhancedAdminTable for better separation of concerns.
 */

import { useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { enhancedAdminService } from '@/services/enhancedAdminService';
import { logInfo, logError } from '@/utils/logger';

/**
 * Hook for managing admin table CRUD operations
 */
export const useAdminTableMutations = ({
  resourceType,
  queryKey,
  queryClient,
  refetch,
  selectedRows,
  setSelectedRows
}) => {
  const updateTimeoutRef = useRef(null);

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
      logError(`[useAdminTableMutations] Update failed:`, error);
      toast.error(`Update failed: ${error.message}`);
    },
    onSuccess: (data, variables) => {
      logInfo(`[useAdminTableMutations] Successfully updated ${resourceType}:`, variables);
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
      logError(`[useAdminTableMutations] Delete failed:`, error);
      toast.error(`Delete failed: ${error.message}`);
    },
    onSuccess: (data, resourceId) => {
      logInfo(`[useAdminTableMutations] Successfully deleted ${resourceType}:`, resourceId);
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
      logError(`[useAdminTableMutations] Bulk update failed:`, error);
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
    },
    onError: (error) => {
      logError(`[useAdminTableMutations] Create failed:`, error);
      toast.error(`Create failed: ${error.message}`);
    }
  });

  // Field edit handler with debouncing
  const handleFieldEdit = useCallback((resourceId, fieldName, value) => {
    // Debounce rapid updates
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      updateMutation.mutate({ resourceId, fieldName, value });
    }, 500); // 500ms debounce
  }, [updateMutation]);

  // Delete handler with confirmation
  const handleDelete = useCallback((resourceId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteMutation.mutate(resourceId);
    }
  }, [deleteMutation]);

  // Bulk update handler
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

  // Create handlers
  const handleCreate = useCallback((data) => {
    createMutation.mutate(data);
  }, [createMutation]);

  // Cleanup function for timeouts
  const cleanup = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
  }, []);

  return {
    // Mutations
    updateMutation,
    deleteMutation,
    bulkUpdateMutation,
    createMutation,
    
    // Handlers
    handleFieldEdit,
    handleDelete,
    handleBulkUpdate,
    handleCreate,
    
    // Loading states
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    isBulkUpdating: bulkUpdateMutation.isLoading,
    isCreating: createMutation.isLoading,
    
    // Cleanup
    cleanup
  };
};

export default useAdminTableMutations; 