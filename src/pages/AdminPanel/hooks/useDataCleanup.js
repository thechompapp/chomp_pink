/**
 * useDataCleanup Hook
 * 
 * Custom hook for managing data cleanup operations.
 * Extracted from AdminPanel.jsx to improve separation of concerns.
 */

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import DataCleanupManager from '../utils/adminDataCleanup';

/**
 * Custom hook for managing data cleanup operations
 * @param {Function} refreshData - Function to refresh data after cleanup
 * @returns {Object} Data cleanup state and functions
 */
const useDataCleanup = (refreshData) => {
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [cleanupResource, setCleanupResource] = useState(null);
  const [cleanupChanges, setCleanupChanges] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Open cleanup modal for a specific resource
  const openCleanupModal = useCallback((resource) => {
    setCleanupResource(resource);
    setCleanupChanges([]);
    setIsCleanupModalOpen(true);
  }, []);
  
  // Close cleanup modal
  const closeCleanupModal = useCallback(() => {
    setIsCleanupModalOpen(false);
    setCleanupResource(null);
    setCleanupChanges([]);
  }, []);
  
  // Analyze data for cleanup
  const analyzeData = useCallback(async (resourceType) => {
    if (!resourceType) return;
    
    try {
      setIsAnalyzing(true);
      const changes = await DataCleanupManager.analyzeData(resourceType);
      setCleanupChanges(changes);
      
      if (changes.length === 0) {
        toast.success(`No cleanup needed for ${resourceType}`);
      } else {
        toast.success(`Found ${changes.length} potential improvements for ${resourceType}`);
      }
      
      return changes;
    } catch (error) {
      console.error('Error analyzing data:', error);
      toast.error(`Error analyzing data: ${error.message || 'Unknown error'}`);
      return [];
    } finally {
      setIsAnalyzing(false);
    }
  }, []);
  
  // Approve changes
  const approveChanges = useCallback(async (changes, resourceType) => {
    if (!changes || changes.length === 0 || !resourceType) return;
    
    try {
      setIsProcessing(true);
      const result = await DataCleanupManager.approveChanges(changes, resourceType);
      
      toast.success(`Successfully applied ${changes.length} changes to ${resourceType}`);
      closeCleanupModal();
      
      // Refresh data if provided
      if (refreshData && typeof refreshData === 'function') {
        refreshData();
      }
      
      return result;
    } catch (error) {
      console.error('Error approving changes:', error);
      toast.error(`Error approving changes: ${error.message || 'Unknown error'}`);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [closeCleanupModal, refreshData]);
  
  // Reject changes
  const rejectChanges = useCallback(async (changes, resourceType) => {
    if (!changes || changes.length === 0 || !resourceType) return;
    
    try {
      setIsProcessing(true);
      const result = await DataCleanupManager.rejectChanges(changes, resourceType);
      
      toast.success(`Rejected ${changes.length} changes for ${resourceType}`);
      closeCleanupModal();
      
      return result;
    } catch (error) {
      console.error('Error rejecting changes:', error);
      toast.error(`Error rejecting changes: ${error.message || 'Unknown error'}`);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, [closeCleanupModal]);
  
  return {
    isCleanupModalOpen,
    cleanupResource,
    cleanupChanges,
    isAnalyzing,
    isProcessing,
    openCleanupModal,
    closeCleanupModal,
    analyzeData,
    approveChanges,
    rejectChanges
  };
};

export default useDataCleanup;
