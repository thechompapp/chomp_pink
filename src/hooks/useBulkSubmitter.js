/**
 * useBulkSubmitter Hook
 * 
 * Manages the submission of bulk add items to the backend API.
 * Handles batch submission, progress tracking, and error handling.
 */
import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { restaurantService } from '@/services/restaurantService';
import { 
  formatItemForSubmission,
  batchProcess,
  retryWithBackoff,
  BULK_ADD_CONFIG
} from '@/utils/bulkAddUtils';
import { logDebug, logError, logInfo } from '@/utils/logger';

/**
 * Hook for submitting bulk add items to the backend
 * @returns {Object} - State and functions for bulk submission
 */
const useBulkSubmitter = () => {
  // State for items and submission
  const [items, setItems] = useState([]);
  const [submittedItems, setSubmittedItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  
  // Progress tracking
  const [progress, setProgress] = useState(0);
  const totalItems = useRef(0);
  const submittedCount = useRef(0);
  
  // Query client for cache invalidation
  const queryClient = useQueryClient();
  
  /**
   * Check if an item already exists in the database
   * @param {Object} item - Item to check
   * @returns {Promise<Object|null>} - Existing item or null
   */
  const checkExistingItem = useCallback(async (item) => {
    try {
      // For restaurants, check by name and address
      if (item.type === 'restaurant') {
        const searchParams = {
          name: item.name,
          address: item.address,
          exact: true
        };
        
        const results = await retryWithBackoff(() => 
          restaurantService.searchRestaurants(searchParams)
        );
        
        if (results && Array.isArray(results) && results.length > 0) {
          return results[0];
        }
      }
      
      return null;
    } catch (error) {
      logError(`[useBulkSubmitter] Error checking existing item:`, error);
      return null;
    }
  }, []);
  
  /**
   * Submit a single item to the backend
   * @param {Object} item - Item to submit
   * @returns {Promise<Object>} - Submission result
   */
  const submitItem = useCallback(async (item) => {
    if (!item || item.status !== 'ready') {
      return item;
    }
    
    try {
      // Update item status
      const updatedItem = {
        ...item,
        status: 'submitting',
        message: 'Submitting to backend...'
      };
      
      // Check if item already exists
      const existingItem = await checkExistingItem(item);
      
      if (existingItem) {
        return {
          ...updatedItem,
          status: 'warning',
          message: `Item already exists with ID: ${existingItem.id}`,
          existingItem
        };
      }
      
      // Format item for submission
      const formattedItem = formatItemForSubmission(item);
      
      // Submit item based on type
      let result;
      
      if (item.type === 'restaurant') {
        // Use the admin service for bulk operations
        result = await retryWithBackoff(() => 
          adminService.addRestaurant(formattedItem)
        );
      } else {
        // Handle other types (e.g., dishes) in the future
        throw new Error(`Unsupported item type: ${item.type}`);
      }
      
      // Update progress
      submittedCount.current += 1;
      setProgress(Math.round((submittedCount.current / totalItems.current) * 100));
      
      // Return updated item with submission result
      return {
        ...updatedItem,
        status: 'submitted',
        message: 'Successfully submitted',
        submissionResult: result,
        id: result?.id || null
      };
    } catch (error) {
      logError(`[useBulkSubmitter] Error submitting item ${item.name}:`, error);
      
      // Return item with error
      return {
        ...item,
        status: 'error',
        message: `Submission error: ${error.message || 'Unknown error'}`
      };
    }
  }, [checkExistingItem]);
  
  /**
   * Submit multiple items to the backend
   * @param {Array} itemsToSubmit - Items to submit
   * @returns {Promise<Object>} - Submission results
   */
  const submitItems = useCallback(async (itemsToSubmit) => {
    if (!itemsToSubmit || !Array.isArray(itemsToSubmit) || itemsToSubmit.length === 0) {
      setSubmissionError('No items to submit');
      return {
        success: false,
        message: 'No items to submit',
        added: 0,
        total: 0
      };
    }
    
    try {
      setIsSubmitting(true);
      setSubmissionError(null);
      setSubmissionResult(null);
      setProgress(0);
      
      // Filter items that are ready for submission
      const readyItems = itemsToSubmit.filter(item => 
        item.status === 'ready' && item._processed
      );
      
      if (readyItems.length === 0) {
        setSubmissionError('No items ready for submission');
        return {
          success: false,
          message: 'No items ready for submission',
          added: 0,
          total: itemsToSubmit.length
        };
      }
      
      // Set items and initialize counters
      setItems(itemsToSubmit);
      totalItems.current = readyItems.length;
      submittedCount.current = 0;
      
      logInfo(`[useBulkSubmitter] Submitting ${readyItems.length} items`);
      
      // Process items in batches
      const submittedResults = await batchProcess(
        readyItems,
        submitItem,
        BULK_ADD_CONFIG.batchSize,
        (batchResults) => {
          // Update submitted items as each batch completes
          setSubmittedItems(prev => [...prev, ...batchResults]);
        }
      );
      
      // Count successful submissions
      const successCount = submittedResults.filter(
        item => item.status === 'submitted'
      ).length;
      
      // Create submission result
      const result = {
        success: true,
        message: `Successfully added ${successCount} of ${readyItems.length} items`,
        added: successCount,
        total: readyItems.length,
        items: submittedResults
      };
      
      // Update state with final results
      setSubmittedItems(submittedResults);
      setSubmissionResult(result);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries(['restaurants']);
      
      logInfo(`[useBulkSubmitter] Submission complete: ${successCount} of ${readyItems.length} items added successfully`);
      
      return result;
    } catch (error) {
      logError('[useBulkSubmitter] Error submitting items:', error);
      
      const errorResult = {
        success: false,
        message: `Error submitting items: ${error.message || 'Unknown error'}`,
        added: submittedCount.current,
        total: totalItems.current
      };
      
      setSubmissionError(error.message || 'Error submitting items');
      setSubmissionResult(errorResult);
      
      return errorResult;
    } finally {
      setIsSubmitting(false);
      setProgress(100); // Ensure progress is complete
    }
  }, [submitItem, queryClient]);
  
  /**
   * Reset the submitter state
   */
  const resetSubmitter = useCallback(() => {
    setItems([]);
    setSubmittedItems([]);
    setIsSubmitting(false);
    setSubmissionError(null);
    setSubmissionResult(null);
    setProgress(0);
    totalItems.current = 0;
    submittedCount.current = 0;
  }, []);
  
  return {
    // State
    items,
    submittedItems,
    isSubmitting,
    submissionError,
    submissionResult,
    progress,
    
    // Functions
    submitItems,
    resetSubmitter
  };
};

export default useBulkSubmitter;
