/**
 * Admin Data Cleanup Manager
 * 
 * Utility functions for cleaning up admin data.
 * Extracted from AdminPanel.jsx to improve separation of concerns.
 */

import { dataCleanupService } from '@/services/dataCleanupService';

/**
 * Data cleanup utilities for admin panel
 */
const DataCleanupManager = {
  /**
   * Analyze data for cleanup and get changes
   * @param {string} resourceType - Type of resource to analyze
   * @returns {Promise<Array>} List of changes
   */
  analyzeData: async (resourceType) => {
    console.log(`[AdminPanel] Calling dataCleanupService.analyzeData(${resourceType})`);
    
    try {
      const response = await dataCleanupService.analyzeData(resourceType);
      
      if (!response.success) {
        console.error(`[AdminPanel] Error analyzing data: ${response.message}`);
        throw new Error(response.message || 'Error analyzing data');
      }
      
      const changes = response.data || [];
      console.log(`[AdminPanel] Received ${changes.length} cleanup changes for ${resourceType}:`, changes);
      return changes;
    } catch (error) {
      console.error('[AdminPanel] Error analyzing data:', error);
      throw error;
    }
  },
  
  /**
   * Process and approve changes
   * @param {Array} changes - Changes to approve
   * @param {string} resourceType - Type of resource being changed
   * @returns {Promise<Object>} Processing result
   */
  approveChanges: async (changes, resourceType) => {
    console.log(`[AdminPanel] Approving ${changes.length} changes for ${resourceType}`);
    
    try {
      const result = await dataCleanupService.applyChanges(resourceType, changes);
      
      if (!result.success) {
        console.error(`[AdminPanel] Error approving changes: ${result.message}`);
        throw new Error(result.message || 'Error approving changes');
      }
      
      console.log('[AdminPanel] Changes approved successfully:', result);
      return result;
    } catch (error) {
      console.error('[AdminPanel] Error approving changes:', error);
      throw error;
    }
  },
  
  /**
   * Process and reject changes
   * @param {Array} changes - Changes to reject
   * @param {string} resourceType - Type of resource being changed
   * @returns {Promise<Object>} Processing result
   */
  rejectChanges: async (changes, resourceType) => {
    console.log(`[AdminPanel] Rejecting ${changes.length} changes for ${resourceType}`);
    
    try {
      const result = await dataCleanupService.rejectChanges(resourceType, changes);
      
      if (!result.success) {
        console.error(`[AdminPanel] Error rejecting changes: ${result.message}`);
        throw new Error(result.message || 'Error rejecting changes');
      }
      
      console.log('[AdminPanel] Changes rejected successfully:', result);
      return result;
    } catch (error) {
      console.error('[AdminPanel] Error rejecting changes:', error);
      throw error;
    }
  }
};

export default DataCleanupManager;
