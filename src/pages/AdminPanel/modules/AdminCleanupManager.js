/**
 * Admin Cleanup Manager
 * 
 * Handles data cleanup operations for the Admin Panel.
 * Extracted from AdminPanel.jsx to improve separation of concerns.
 * 
 * Responsibilities:
 * - Data analysis for cleanup
 * - Change processing and validation
 * - Cleanup operation coordination
 * - Results handling and feedback
 */

import { toast } from 'react-hot-toast';
import { dataCleanupService } from '@/services/dataCleanupService';
import { logInfo, logWarn, logError } from '@/utils/logger';

/**
 * Data cleanup operations manager
 */
export const DataCleanupManager = {
  /**
   * Analyze data for cleanup and get changes
   * @param {string} resourceType - Type of resource to analyze
   * @returns {Promise<Array>} List of changes
   */
  analyzeData: async (resourceType) => {
    logInfo(`[AdminCleanupManager] Analyzing data for cleanup: ${resourceType}`);
    
    try {
      const response = await dataCleanupService.analyzeData(resourceType);
      
      if (!response.success) {
        const errorMessage = response.message || 'Error analyzing data';
        logError(`[AdminCleanupManager] Analysis failed: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      const changes = response.data || [];
      logInfo(`[AdminCleanupManager] Found ${changes.length} cleanup changes for ${resourceType}`);
      
      return changes;
    } catch (error) {
      logError('[AdminCleanupManager] Error analyzing data:', error);
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
    logInfo(`[AdminCleanupManager] Approving ${changes.length} changes for ${resourceType}`);
    
    try {
      const result = await dataCleanupService.applyChanges(resourceType, changes);
      
      if (!result.success) {
        const errorMessage = result.message || 'Error approving changes';
        logError(`[AdminCleanupManager] Approval failed: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      logInfo('[AdminCleanupManager] Changes approved successfully:', result);
      return result;
    } catch (error) {
      logError('[AdminCleanupManager] Error approving changes:', error);
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
    logInfo(`[AdminCleanupManager] Rejecting ${changes.length} changes for ${resourceType}`);
    
    try {
      const result = await dataCleanupService.rejectChanges(resourceType, changes);
      
      if (!result.success) {
        const errorMessage = result.message || 'Error rejecting changes';
        logError(`[AdminCleanupManager] Rejection failed: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      logInfo('[AdminCleanupManager] Changes rejected successfully:', result);
      return result;
    } catch (error) {
      logError('[AdminCleanupManager] Error rejecting changes:', error);
      throw error;
    }
  }
};

/**
 * Change validation utilities
 */
export const ChangeValidator = {
  /**
   * Validate a single change object
   * @param {Object} change - Change object to validate
   * @returns {boolean} Whether change is valid
   */
  validateChange: (change) => {
    if (!change || typeof change !== 'object') {
      return false;
    }
    
    // Must have an ID
    if (!change.id) {
      return false;
    }
    
    // Must have a type
    if (!change.type || typeof change.type !== 'string') {
      return false;
    }
    
    return true;
  },

  /**
   * Validate array of changes
   * @param {Array} changes - Array of changes to validate
   * @returns {Object} Validation result
   */
  validateChanges: (changes) => {
    if (!Array.isArray(changes)) {
      return { isValid: false, errors: ['Changes must be an array'] };
    }
    
    const errors = [];
    const validChanges = [];
    
    changes.forEach((change, index) => {
      if (ChangeValidator.validateChange(change)) {
        validChanges.push(change);
      } else {
        errors.push(`Invalid change at index ${index}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors,
      validChanges,
      validCount: validChanges.length,
      invalidCount: changes.length - validChanges.length
    };
  },

  /**
   * Get change statistics
   * @param {Array} changes - Array of changes
   * @returns {Object} Change statistics
   */
  getChangeStats: (changes) => {
    if (!Array.isArray(changes)) {
      return { total: 0, byType: {} };
    }
    
    const stats = {
      total: changes.length,
      byType: {},
      byStatus: {}
    };
    
    changes.forEach(change => {
      // Count by type
      const type = change.type || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      
      // Count by status
      const status = change.status || 'pending';
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    });
    
    return stats;
  }
};

/**
 * Cleanup workflow coordinator
 */
export const CleanupWorkflow = {
  /**
   * Start cleanup analysis workflow
   * @param {string} resourceType - Resource type to analyze
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Workflow result
   */
  startAnalysis: async (resourceType, onProgress = () => {}) => {
    logInfo(`[AdminCleanupManager] Starting cleanup analysis workflow for ${resourceType}`);
    
    try {
      onProgress({ phase: 'analyzing', progress: 0 });
      
      const changes = await DataCleanupManager.analyzeData(resourceType);
      
      onProgress({ phase: 'validating', progress: 50 });
      
      const validation = ChangeValidator.validateChanges(changes);
      
      onProgress({ phase: 'complete', progress: 100 });
      
      const result = {
        success: true,
        changes: validation.validChanges,
        stats: ChangeValidator.getChangeStats(validation.validChanges),
        validation
      };
      
      logInfo('[AdminCleanupManager] Analysis workflow completed:', result);
      return result;
      
    } catch (error) {
      logError('[AdminCleanupManager] Analysis workflow failed:', error);
      throw error;
    }
  },

  /**
   * Process changes workflow
   * @param {Array} changes - Changes to process
   * @param {string} action - Action to take ('approve' or 'reject')
   * @param {string} resourceType - Resource type
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Processing result
   */
  processChanges: async (changes, action, resourceType, onProgress = () => {}) => {
    logInfo(`[AdminCleanupManager] Processing ${changes.length} changes with action: ${action}`);
    
    try {
      onProgress({ phase: 'validating', progress: 0 });
      
      const validation = ChangeValidator.validateChanges(changes);
      if (!validation.isValid) {
        throw new Error(`Invalid changes: ${validation.errors.join(', ')}`);
      }
      
      onProgress({ phase: 'processing', progress: 25 });
      
      let result;
      if (action === 'approve') {
        result = await DataCleanupManager.approveChanges(validation.validChanges, resourceType);
      } else if (action === 'reject') {
        result = await DataCleanupManager.rejectChanges(validation.validChanges, resourceType);
      } else {
        throw new Error(`Unknown action: ${action}`);
      }
      
      onProgress({ phase: 'complete', progress: 100 });
      
      logInfo('[AdminCleanupManager] Processing workflow completed:', result);
      return result;
      
    } catch (error) {
      logError('[AdminCleanupManager] Processing workflow failed:', error);
      throw error;
    }
  }
};

/**
 * User feedback manager for cleanup operations
 */
export const CleanupFeedback = {
  /**
   * Show analysis results feedback
   * @param {Object} analysisResult - Analysis result
   * @param {string} resourceType - Resource type
   */
  showAnalysisResults: (analysisResult, resourceType) => {
    const { changes, stats } = analysisResult;
    
    if (changes.length === 0) {
      toast.success(`No cleanup issues found for ${resourceType}`);
    } else {
      const message = `Found ${stats.total} cleanup issues for ${resourceType}`;
      logInfo(`[AdminCleanupManager] ${message}`, stats);
      
      // Show breakdown by type if available
      if (Object.keys(stats.byType).length > 1) {
        const breakdown = Object.entries(stats.byType)
          .map(([type, count]) => `${type}: ${count}`)
          .join(', ');
        logInfo(`[AdminCleanupManager] Issue breakdown: ${breakdown}`);
      }
    }
  },

  /**
   * Show processing results feedback
   * @param {Object} processingResult - Processing result
   * @param {string} action - Action taken
   * @param {number} changeCount - Number of changes processed
   */
  showProcessingResults: (processingResult, action, changeCount) => {
    const actionPast = action === 'approve' ? 'approved' : 'rejected';
    const message = `Successfully ${actionPast} ${changeCount} changes`;
    
    toast.success(message);
    logInfo(`[AdminCleanupManager] ${message}`, processingResult);
  },

  /**
   * Show error feedback
   * @param {Error} error - Error object
   * @param {string} operation - Operation that failed
   */
  showError: (error, operation) => {
    const message = `Failed to ${operation}: ${error.message || 'Unknown error'}`;
    toast.error(message);
    logError(`[AdminCleanupManager] ${message}`, error);
  }
};

/**
 * Cleanup state manager
 */
export const CleanupState = {
  /**
   * Create initial cleanup state
   * @returns {Object} Initial state
   */
  createInitialState: () => ({
    isAnalyzing: false,
    isProcessing: false,
    changes: [],
    selectedChanges: [],
    isModalOpen: false,
    currentOperation: null,
    progress: { phase: null, progress: 0 }
  }),

  /**
   * Create cleanup state updater
   * @param {Function} setState - State setter function
   * @returns {Object} State update functions
   */
  createUpdater: (setState) => ({
    setAnalyzing: (isAnalyzing) => setState(prev => ({ ...prev, isAnalyzing })),
    setProcessing: (isProcessing) => setState(prev => ({ ...prev, isProcessing })),
    setChanges: (changes) => setState(prev => ({ ...prev, changes })),
    setSelectedChanges: (selectedChanges) => setState(prev => ({ ...prev, selectedChanges })),
    setModalOpen: (isModalOpen) => setState(prev => ({ ...prev, isModalOpen })),
    setOperation: (currentOperation) => setState(prev => ({ ...prev, currentOperation })),
    setProgress: (progress) => setState(prev => ({ ...prev, progress })),
    reset: () => setState(CleanupState.createInitialState())
  })
};

export default {
  DataCleanupManager,
  ChangeValidator,
  CleanupWorkflow,
  CleanupFeedback,
  CleanupState
}; 