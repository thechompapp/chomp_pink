/**
 * DataCleanupService
 * 
 * A service for managing data cleanup operations in the admin panel.
 * This service provides methods to analyze, apply, and reject data cleanup changes
 * for various resource types like restaurants, dishes, etc.
 * 
 * Features:
 * - Checking API availability to ensure backend support for cleanup operations
 * - Analyzing resources to identify potential data quality issues
 * - Applying approved changes to improve data quality
 * - Rejecting changes that should not be applied
 * - Formatting changes for consistent UI display
 * 
 * The service provides a standardized response format with:
 * - success: boolean indicating if the operation succeeded
 * - message: descriptive message about the operation result
 * - data: array or object containing the operation data (e.g., changes)
 * 
 * @module services/dataCleanupService
 */

import { apiClient } from '@/services/http';
import { logError, logDebug, logWarn, logInfo } from '@/utils/logger';
import { handleApiResponse, formatResponse, formatErrorResponse } from '@/utils/serviceHelpers';

// Constants for API endpoints (moved to a dedicated configuration object)
const DATA_CLEANUP_API = {
  health: '/admin/cleanup/health',
  analyze: (resourceType) => `/admin/cleanup/analyze/${resourceType}`,
  apply: (resourceType) => `/admin/cleanup/apply/${resourceType}`,
  reject: (resourceType) => `/admin/cleanup/reject/${resourceType}`
};

// Disable mock mode
const ENABLE_MOCK_MODE = false;

/**
 * Validates an array of changes
 * @param {Array|null} changes - Changes to validate
 * @param {string} context - Context for logging
 * @returns {Object} Validation result with valid, message, and isEmpty properties
 */
const validateChanges = (changes, context = 'validateChanges') => {
  if (!changes) {
    logError(`[${context}] changes is undefined or null`);
    return { valid: false, message: 'No changes provided', isEmpty: true };
  }
  
  if (!Array.isArray(changes)) {
    logError(`[${context}] changes is not an array:`, changes);
    return { valid: false, message: 'Invalid changes format: expected an array', isEmpty: true };
  }
  
  if (changes.length === 0) {
    logWarn(`[${context}] Empty array of changes provided`);
    return { valid: true, message: 'No changes to process', isEmpty: true };
  }
  
  return { valid: true, message: 'Valid changes', isEmpty: false };
};

/**
 * Validates a resource type parameter
 * @param {string|null} resourceType - Resource type to validate
 * @returns {Object} Validation result
 */
const validateResourceType = (resourceType) => {
  if (!resourceType || typeof resourceType !== 'string') {
    logError('[dataCleanupService] Invalid resourceType:', resourceType);
    return { valid: false, message: 'Invalid resource type' };
  }
  return { valid: true, message: 'Valid resource type' };
};

/**
 * DataCleanupService class for managing data cleanup operations
 * This service provides methods to analyze, apply, and reject data cleanup changes
 */
class DataCleanupService {
  /**
   * Checks if the cleanup API endpoints are available
   * @returns {Promise<boolean>} True if API is available, false otherwise
   */
  async checkApiAvailability() {
    try {
      logDebug(`[dataCleanupService] Checking if cleanup API endpoints are available`);
      
      try {
        const response = await apiClient.get(DATA_CLEANUP_API.health);
        
        if (response?.data?.available) {
          logDebug(`[dataCleanupService] Cleanup API endpoints are available`);
          return true;
        } else {
          logDebug(`[dataCleanupService] Cleanup API health check returned 'available: false' or missing 'available' field.`);
          return false;
        }
      } catch (error) {
        // If we get a 404, the endpoint doesn't exist
        if (error.response?.status === 404) {
          logWarn(`[dataCleanupService] Cleanup API health endpoint not found (404). Feature may not be implemented on backend.`);
          return false;
        }
        // For other errors, log and return false
        logError(`[dataCleanupService] Error checking API health: ${error.message}`, { error });
        return false;
      }
    } catch (error) {
      logError(`[dataCleanupService] Unexpected error in checkApiAvailability: ${error.message}`, { error });
      return false;
    }
  }

  /**
   * Analyze data for a specific resource type to find potential cleanup changes
   * @param {string} resourceType - Type of resource to analyze (e.g., 'restaurants', 'dishes')
   * @returns {Promise<Object>} Formatted response with success, message, and data fields
   */
  async analyzeData(resourceType) {
    try {
      const resourceTypeValidation = validateResourceType(resourceType);
      if (!resourceTypeValidation.valid) {
        return formatResponse(false, [], resourceTypeValidation.message);
      }
      
      const isApiAvailable = await this.checkApiAvailability();
      if (!isApiAvailable) {
        logWarn(`[dataCleanupService] Data cleanup API is not available for resource: ${resourceType}`);
        
        // Return mock data only if mock mode is enabled
        if (ENABLE_MOCK_MODE) {
          const mockChanges = this.getMockChanges(resourceType);
          return formatResponse(true, mockChanges, `Using mock data for ${resourceType}`);
        }
        
        return formatResponse(true, [], 'API not available, no changes detected');
      }
      
      logDebug(`[dataCleanupService] Analyzing data for ${resourceType}`);
      
      try {
        const endpoint = DATA_CLEANUP_API.analyze(resourceType);
        const response = await apiClient.get(endpoint);
        
        logDebug(`[dataCleanupService] Received analysis for ${resourceType}:`, response?.data?.changes?.length || 0, "changes");
        
        // The backend should return { success: true, changes: [] }
        // Ensure 'changes' array exists and is returned.
        if (response?.data?.changes && Array.isArray(response.data.changes)) {
          const formattedChanges = this.formatChanges(response.data.changes, resourceType);
          return formatResponse(
            true,
            formattedChanges,
            `Found ${formattedChanges.length} potential changes for ${resourceType}`
          );
        } else {
          logWarn(`[dataCleanupService] API returned unexpected response structure for ${resourceType}. Expected 'changes' array.`, response);
          return formatResponse(false, [], `API returned unexpected response format for ${resourceType}`);
        }
      } catch (error) {
        // If the endpoint doesn't exist (404), log a warning and return empty array
        if (error.response?.status === 404) {
          logWarn(`[dataCleanupService] Cleanup analyze endpoint not found for ${resourceType}. Feature may not be implemented.`);
          return formatResponse(true, [], `Cleanup analysis not implemented for ${resourceType}`);
        }
        // For other errors, format error response
        return formatErrorResponse(error, error.response?.status || 500, { resourceType });
      }
    } catch (error) {
      logError(`[dataCleanupService] Error analyzing data for ${resourceType}: ${error.message}`, { error, resourceType });
      return formatErrorResponse(error, 500, { resourceType });
    }
  }

  /**
   * Process and apply approved changes to the data
   * @param {string} resourceType - Type of resource being changed
   * @param {Array} approvedChanges - Array of approved change objects
   * @param {Object} options - Additional options for processing
   * @returns {Promise<Object>} Result of the operation
   */
  async applyChanges(resourceType, approvedChanges, options = {}) {
    const context = `dataCleanupService.applyChanges(${resourceType})`;
    try {
      logDebug(`[${context}] Called with:`, {
        resourceTypeProvided: Boolean(resourceType),
        approvedChangesLength: approvedChanges?.length,
        firstChangeId: approvedChanges?.[0]?.changeId,
        options
      });
      
      // Validate resource type
      const resourceTypeValidation = validateResourceType(resourceType);
      if (!resourceTypeValidation.valid) {
        return formatResponse(false, [], resourceTypeValidation.message);
      }
      
      // Validate changes
      const changesValidation = validateChanges(approvedChanges, context);
      if (!changesValidation.valid) {
        return formatResponse(false, [], changesValidation.message);
      }
      
      if (changesValidation.isEmpty) {
        return formatResponse(true, [], 'No changes to apply');
      }
      
      const isApiAvailable = await this.checkApiAvailability();
      logDebug(`[${context}] API availability check result:`, isApiAvailable);
      
      if (!isApiAvailable) {
        logWarn(`[${context}] Cannot apply changes - API is not available for resource: ${resourceType}`);
        return formatResponse(false, [], 'Data cleanup API is not available');
      }
      
      logDebug(`[${context}] Applying ${approvedChanges.length} changes for ${resourceType}`, options);
      
      // Verify each change has the minimum required properties
      const invalidChanges = approvedChanges.filter(change => 
        !change || !change.changeId || !change.resourceId || !change.field
      );
      
      if (invalidChanges.length > 0) {
        logError(`[${context}] Some changes are missing required properties:`, invalidChanges);
        return formatResponse(
          false,
          [],
          `${invalidChanges.length} changes are missing required properties`
        );
      }
      
      try {
        const endpoint = DATA_CLEANUP_API.apply(resourceType);
        // Extract changeIds from the change objects
        const changeIds = approvedChanges.map(change => change.changeId);
        const payload = { changeIds };
        
        // Log what we're sending to help with debugging
        logDebug(`[${context}] Sending payload to ${endpoint}:`, JSON.stringify(payload));
        logDebug(`[${context}] Change IDs being sent:`, changeIds);
        
        const response = await apiClient.post(
          endpoint,
          payload,
          { description: `Apply ${resourceType} Changes` }
        );
        
        // Parse the response
        const result = response?.data || { success: false, message: 'No response from server', data: [] };
        
        logDebug(`[${context}] Server response for applying ${approvedChanges.length} changes:`, result);
        
        // Check if any non-display changes were actually applied
        const nonDisplayChanges = approvedChanges.filter(change => !change.displayOnly);
        const displayOnlyChanges = approvedChanges.filter(change => change.displayOnly);
        
        logDebug(`[${context}] Changes breakdown:`, {
          total: approvedChanges.length,
          nonDisplayChanges: nonDisplayChanges.length,
          displayOnlyChanges: displayOnlyChanges.length
        });
        
        // For display-only changes, consider the operation successful even if backend changes weren't applied
        if (nonDisplayChanges.length === 0 && displayOnlyChanges.length > 0) {
          logDebug(`[${context}] All changes were display-only, marking as successful`);
          return formatResponse(
            true,
            result.data || [],
            `Successfully applied ${displayOnlyChanges.length} display-only changes`
          );
        }
        
        return formatResponse(
          result.success,
          result.data || [],
          result.message || `Processed ${approvedChanges.length} changes`
        );
      } catch (error) {
        logError(`[${context}] Error during API call:`, error);
        logError(`[${context}] Error response:`, error.response?.data);
        
        if (error.response?.status === 404) {
          logWarn(`[${context}] Cleanup apply endpoint not found for ${resourceType}.`);
          return formatResponse(
            false,
            [],
            'Data cleanup feature is not implemented on the server'
          );
        }
        throw error;
      }
    } catch (error) {
      logError(`[${context}] Error applying changes: ${error.message}`, { error, resourceType });
      return formatErrorResponse(
        error,
        error.response?.status || 500,
        { resourceType, changeCount: approvedChanges?.length }
      );
    }
  }

  /**
   * Process and reject changes that should not be applied
   * @param {string} resourceType - Type of resource
   * @param {Array} rejectedChanges - Array of change objects to reject
   * @returns {Promise<Object>} Result of the operation
   */
  async rejectChanges(resourceType, rejectedChanges) {
    const context = `dataCleanupService.rejectChanges(${resourceType})`;
    try {
      // Validate resource type
      const resourceTypeValidation = validateResourceType(resourceType);
      if (!resourceTypeValidation.valid) {
        return formatResponse(false, [], resourceTypeValidation.message);
      }
      
      // Validate changes
      const changesValidation = validateChanges(rejectedChanges, context);
      if (!changesValidation.valid) {
        return formatResponse(false, [], changesValidation.message);
      }
      
      if (changesValidation.isEmpty) {
        return formatResponse(true, [], 'No changes to reject');
      }
    
      const isApiAvailable = await this.checkApiAvailability();
      if (!isApiAvailable) {
        logWarn(`[${context}] Cannot reject changes - API is not available for resource: ${resourceType}`);
        return formatResponse(false, [], 'Data cleanup API is not available');
      }
      
      logDebug(`[${context}] Rejecting ${rejectedChanges.length} changes for ${resourceType}`);
      
      try {
        const endpoint = DATA_CLEANUP_API.reject(resourceType);
        // Extract changeIds from the change objects
        const changeIds = rejectedChanges.map(change => change.changeId);
        const payload = { changeIds };
        
        // Log what we're sending to help with debugging
        logDebug(`[${context}] Sending payload to ${endpoint}:`, JSON.stringify(payload));
        
        const response = await apiClient.post(
          endpoint,
          payload,
          { description: `Reject ${resourceType} Changes` }
        );
        
        // Parse the response
        const result = response?.data || { success: false, message: 'No response from server', data: [] };
        
        logDebug(`[${context}] Server response for rejecting ${rejectedChanges.length} changes:`, result);
        
        return formatResponse(
          result.success,
          result.data || [],
          result.message || `Processed ${rejectedChanges.length} rejections`
        );
      } catch (error) {
        if (error.response?.status === 404) {
          logWarn(`[${context}] Cleanup reject endpoint not found for ${resourceType}.`);
          return formatResponse(
            false,
            [],
            'Data cleanup feature is not implemented on the server'
          );
        }
        throw error;
      }
    } catch (error) {
      logError(`[${context}] Error rejecting changes: ${error.message}`, { error, resourceType });
      return formatErrorResponse(
        error,
        error.response?.status || 500,
        { resourceType, changeCount: rejectedChanges?.length }
      );
    }
  }

  /**
   * Helper function to format changes for the UI, ensuring consistent structure
   * @param {Array} changes - Raw changes from API
   * @param {string} resourceType - Type of resource
   * @returns {Array} Formatted changes for UI display
   */
  formatChanges(changes, resourceType = 'Unknown') {
    const context = 'dataCleanupService.formatChanges';
    
    if (!changes || !Array.isArray(changes)) {
      logError(`[${context}] Invalid changes data passed:`, { changes });
      return [];
    }
    
    logDebug(`[${context}] Formatting ${changes.length} changes for UI, resource: ${resourceType}`);
    
    return changes.map((change, index) => {
      if (!change || typeof change !== 'object') {
        logWarn(`[${context}] Invalid change item at index ${index}:`, change);
        return this.createErrorPlaceholderChange(index, resourceType, change);
      }

      return this.formatSingleChange(change, index, resourceType);
    });
  }
  
  /**
   * Creates a placeholder change object for invalid change data
   * @param {number} index - Index in the array
   * @param {string} resourceType - Resource type
   * @param {any} originalChange - The original invalid change
   * @returns {Object} Formatted error placeholder
   */
  createErrorPlaceholderChange(index, resourceType, originalChange) {
    return {
      changeId: `invalid-item-${index}`,
      resourceId: 'unknown',
      resourceType: resourceType,
      title: 'Invalid Change Data',
      category: 'Error',
      field: 'unknown',
      type: 'error',
      currentValue: JSON.stringify(originalChange),
      proposedValue: 'Error in data',
      impact: 'High',
      confidence: 0
    };
  }
  
  /**
   * Format a single change object for UI display
   * @param {Object} change - Raw change from API
   * @param {number} index - Index in the array
   * @param {string} resourceType - Resource type
   * @returns {Object} Formatted change
   */
  formatSingleChange(change, index, resourceType) {
    // Backend should provide a unique changeId. If not, generate one.
    const changeId = change.changeId || 
      `${resourceType}-${change.resourceId || `idx-${index}`}-${change.field || 'field'}-${change.type || 'type'}`;
    
    const title = change.title || 
      `${(change.type?.charAt(0).toUpperCase() + change.type?.slice(1)) || 'Update'} ${change.field || 'field'}`;
    
    const category = this.determineChangeCategory(change);
    
    // Ensure currentValue and proposedValue are strings for display
    const currentValueStr = this.formatValueForDisplay(change.currentValue);
    const proposedValueStr = this.formatValueForDisplay(change.proposedValue);
    
    return {
      changeId: changeId,
      resourceId: change.resourceId,
      resourceType: change.resourceType || resourceType,
      title: title,
      category: category,
      field: change.field || 'unknown',
      type: change.type || 'unknown',
      currentValue: currentValueStr,
      proposedValue: proposedValueStr,
      impact: change.impact || 'Data quality improvement',
      confidence: typeof change.confidence === 'number' ? change.confidence : 0.7
    };
  }
  
  /**
   * Determines the category of a change based on its type
   * @param {Object} change - Change object
   * @returns {string} Category label
   */
  determineChangeCategory(change) {
    if (change.category) return change.category;
    
    if (change.type === 'trim' || change.type === 'titleCase' || change.type === 'toLowerCase') {
      return 'Text Formatting';
    } else if (change.type === 'truncate') {
      return 'Content Length';
    } else if (change.type === 'prefixHttp') {
      return 'URL Formatting';
    } else if (change.type === 'formatUSPhone') {
      return 'Contact Information';
    } else {
      return 'General';
    }
  }
  
  /**
   * Formats a value for display in the UI
   * @param {any} value - Value to format
   * @returns {string} Formatted string value
   */
  formatValueForDisplay(value) {
    if (typeof value === 'string') {
      return value;
    } else if (value === null || typeof value === 'undefined') {
      return 'N/A';
    } else {
      return String(value);
    }
  }

  /**
   * Helper method to generate mock changes for demo purposes
   * @param {string} resourceType - Type of resource
   * @returns {Array} Array of mock changes
   */
  getMockChanges(resourceType) {
    const mockChanges = [];
    if (resourceType === 'restaurants') {
      mockChanges.push(
        {
          changeId: `mock-1-${resourceType}`,
          resourceId: 1,
          resourceType: resourceType,
          title: 'Format phone number',
          category: 'Contact Information',
          type: 'formatPhone',
          field: 'phone',
          currentValue: '5558675309',
          proposedValue: '(555) 867-5309',
          impact: 'Ensures consistent phone number format',
          confidence: 0.95
        },
        {
          changeId: `mock-2-${resourceType}`,
          resourceId: 2,
          resourceType: resourceType,
          title: 'Add missing website',
          category: 'Missing Data',
          type: 'addWebsite',
          field: 'website',
          currentValue: '',
          proposedValue: 'https://example.com',
          impact: 'Adds essential business information',
          confidence: 0.8
        }
      );
    } else if (resourceType === 'dishes') {
      mockChanges.push(
        {
          changeId: `mock-1-${resourceType}`,
          resourceId: 1,
          resourceType: resourceType,
          title: 'Convert dish name to Title Case',
          category: 'Text Formatting',
          type: 'titleCase',
          field: 'name',
          currentValue: 'spicy chicken sandwich',
          proposedValue: 'Spicy Chicken Sandwich',
          impact: 'Improves readability and consistency',
          confidence: 0.9
        }
      );
    } else {
      // Generic mock changes for any resource type
      mockChanges.push(
        {
          changeId: `mock-1-${resourceType}`,
          resourceId: 1,
          resourceType: resourceType,
          title: `Clean up ${resourceType} data`,
          category: 'Text Formatting',
          type: 'cleanup',
          field: 'name',
          currentValue: 'test item with issues',
          proposedValue: 'Test Item with Issues',
          impact: 'Improves data consistency',
          confidence: 0.85
        }
      );
    }
    
    logDebug(`[dataCleanupService] Generated ${mockChanges.length} mock changes for ${resourceType}`);
    return mockChanges;
  }
}

export const dataCleanupService = new DataCleanupService();