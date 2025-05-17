import apiClient from '@/services/apiClient';
import { logError, logDebug, logWarn } from '@/utils/logger';
import { handleApiResponse } from '@/utils/serviceHelpers';

// Constants for API endpoints (can be moved to a config file if needed)
const API_ENDPOINTS = {
  health: '/admin/cleanup/health',
  analyze: (resourceType) => `/admin/cleanup/analyze/${resourceType}`,
  apply: (resourceType) => `/admin/cleanup/apply/${resourceType}`,
  reject: (resourceType) => `/admin/cleanup/reject/${resourceType}`
};

// Disable mock mode
const ENABLE_MOCK_MODE = false;

class DataCleanupService {
  async checkApiAvailability() {
    try {
      logDebug(`[dataCleanupService] Checking if cleanup API endpoints are available`);
      
      // First check if the health endpoint exists
      try {
        const response = await apiClient.get(
          API_ENDPOINTS.health,
          { description: 'Check Cleanup API Health' }
        );
        
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

  async analyzeData(resourceType) {
    try {
      const isApiAvailable = await this.checkApiAvailability();
      if (!isApiAvailable) {
        logWarn(`[dataCleanupService] Data cleanup API is not available for resource: ${resourceType}`);
        // Return a mock response with no changes when API is not available
        return [];
      }
      
      logDebug(`[dataCleanupService] Analyzing data for ${resourceType}`);
      
      try {
        const endpoint = API_ENDPOINTS.analyze(resourceType);
        const response = await apiClient.get(
          endpoint,
          { description: `Analyze ${resourceType} Data` }
        );
        
        logDebug(`[dataCleanupService] Received analysis for ${resourceType}:`, response?.data?.changes?.length || 0, "changes");
        
        // The backend should return { success: true, changes: [] }
        // Ensure 'changes' array exists and is returned.
        if (response?.data?.changes && Array.isArray(response.data.changes)) {
          return this.formatChanges(response.data.changes, resourceType);
        } else {
          logWarn(`[dataCleanupService] API returned unexpected response structure for ${resourceType}. Expected 'changes' array.`, response);
          return []; // Return empty array on unexpected structure
        }
      } catch (error) {
        // If the endpoint doesn't exist (404), log a warning and return empty array
        if (error.response?.status === 404) {
          logWarn(`[dataCleanupService] Cleanup analyze endpoint not found for ${resourceType}. Feature may not be implemented.`);
          return [];
        }
        // For other errors, rethrow
        throw error;
      }
    } catch (error) {
      logError(`[dataCleanupService] Error analyzing data for ${resourceType}: ${error.message}`, { error, resourceType });
      // Return empty array instead of throwing to prevent UI errors
      return [];
    }
  }

  async applyChanges(resourceType, approvedChanges, options = {}) {
    // approvedChanges should be an array of full change objects from the modal
    try {
      console.log('[dataCleanupService] applyChanges called with:', {
        resourceType,
        approvedChangesLength: approvedChanges?.length,
        firstChangeId: approvedChanges?.[0]?.changeId,
        options
      });
      
      // Validate input
      if (!approvedChanges) {
        logError('[dataCleanupService] approvedChanges is undefined or null');
        return { success: false, message: 'No changes provided to apply', data: [] };
      }
      
      if (!Array.isArray(approvedChanges)) {
        logError('[dataCleanupService] approvedChanges is not an array:', approvedChanges);
        return { success: false, message: 'Invalid changes format: expected an array', data: [] };
      }
      
      if (approvedChanges.length === 0) {
        logWarn('[dataCleanupService] Empty array of changes provided');
        return { success: true, message: 'No changes to apply', data: [] };
      }
      
      // Validate resourceType
      if (!resourceType || typeof resourceType !== 'string') {
        logError('[dataCleanupService] Invalid resourceType:', resourceType);
        return { success: false, message: 'Invalid resource type', data: [] };
      }
      
      const isApiAvailable = await this.checkApiAvailability();
      console.log('[dataCleanupService] API availability check result:', isApiAvailable);
      
      if (!isApiAvailable) {
        logWarn(`[dataCleanupService] Cannot apply changes - API is not available for resource: ${resourceType}`);
        return { success: false, message: 'Data cleanup API is not available', data: [] };
      }
      
      logDebug(`[dataCleanupService] Applying ${approvedChanges.length} changes for ${resourceType}`, { approvedChanges, options });
      
      // Verify each change has the minimum required properties
      const invalidChanges = approvedChanges.filter(change => 
        !change || !change.changeId || !change.resourceId || !change.field
      );
      
      if (invalidChanges.length > 0) {
        logError('[dataCleanupService] Some changes are missing required properties:', invalidChanges);
        return { 
          success: false, 
          message: `${invalidChanges.length} changes are missing required properties`,
          data: []
        };
      }
      
      try {
        const endpoint = API_ENDPOINTS.apply(resourceType);
        // Extract changeIds from the change objects
        const changeIds = approvedChanges.map(change => change.changeId);
        const payload = { changeIds };
        
        // Log what we're sending to help with debugging
        console.log(`[dataCleanupService] Sending payload to ${endpoint}:`, JSON.stringify(payload));
        console.log('[dataCleanupService] Change IDs being sent:', changeIds);
        
        const response = await apiClient.post(
          endpoint,
          payload,
          { description: `Apply ${resourceType} Changes` }
        );
        
        // Parse the response
        const result = response?.data || { success: false, message: 'No response from server', data: [] };
        
        console.log(`[dataCleanupService] Server response for applying ${approvedChanges.length} changes:`, result);
        
        // Check if any non-display changes were actually applied
        const nonDisplayChanges = approvedChanges.filter(change => !change.displayOnly);
        const displayOnlyChanges = approvedChanges.filter(change => change.displayOnly);
        
        console.log(`[dataCleanupService] Changes breakdown:`, {
          total: approvedChanges.length,
          nonDisplayChanges: nonDisplayChanges.length,
          displayOnlyChanges: displayOnlyChanges.length
        });
        
        // For display-only changes, consider the operation successful even if backend changes weren't applied
        if (nonDisplayChanges.length === 0 && displayOnlyChanges.length > 0) {
          console.log('[dataCleanupService] All changes were display-only, marking as successful');
          return { 
            success: true,
            message: `Successfully applied ${displayOnlyChanges.length} display-only changes`,
            data: result.data || []
          };
        }
        
        return { 
          success: result.success,
          message: result.message || `Processed ${approvedChanges.length} changes`,
          data: result.data || []
        };
      } catch (error) {
        console.error('[dataCleanupService] Error during API call:', error);
        console.error('[dataCleanupService] Error response:', error.response?.data);
        
        if (error.response?.status === 404) {
          logWarn(`[dataCleanupService] Cleanup apply endpoint not found for ${resourceType}. Full error:`, error);
          return { 
            success: false, 
            message: 'Data cleanup feature is not implemented on the server',
            error: error.toString(),
            data: []
          };
        }
        throw error;
      }
    } catch (error) {
      logError(`[dataCleanupService] Error applying changes for ${resourceType}: ${error.message}`, { error, resourceType });
      // Return a consistent error response
      return { 
        success: false, 
        message: error.response?.data?.message || `Failed to apply changes: ${error.message}`,
        error: error.toString(),
        data: []
      };
    }
  }

  async rejectChanges(resourceType, rejectedChanges) {
    // rejectedChanges should be an array of full change objects from the modal
    try {
      // Validate input
      if (!rejectedChanges) {
        logError('[dataCleanupService] rejectedChanges is undefined or null');
        return { success: false, message: 'No changes provided to reject', data: [] };
      }
      
      if (!Array.isArray(rejectedChanges)) {
        logError('[dataCleanupService] rejectedChanges is not an array:', rejectedChanges);
        return { success: false, message: 'Invalid changes format: expected an array', data: [] };
      }
      
      if (rejectedChanges.length === 0) {
        logWarn('[dataCleanupService] Empty array of changes provided for rejection');
        return { success: true, message: 'No changes to reject', data: [] };
      }
    
      const isApiAvailable = await this.checkApiAvailability();
      if (!isApiAvailable) {
        logWarn(`[dataCleanupService] Cannot reject changes - API is not available for resource: ${resourceType}`);
        return { success: false, message: 'Data cleanup API is not available', data: [] };
      }
      
      logDebug(`[dataCleanupService] Rejecting ${rejectedChanges.length} changes for ${resourceType}`);
      
      try {
        const endpoint = API_ENDPOINTS.reject(resourceType);
        // Extract changeIds from the change objects
        const changeIds = rejectedChanges.map(change => change.changeId);
        const payload = { changeIds };
        
        // Log what we're sending to help with debugging
        logDebug(`[dataCleanupService] Sending payload to ${endpoint}:`, JSON.stringify(payload));
        
        const response = await apiClient.post(
          endpoint,
          payload,
          { description: `Reject ${resourceType} Changes` }
        );
        
        // Parse the response
        const result = response?.data || { success: false, message: 'No response from server', data: [] };
        
        logDebug(`[dataCleanupService] Server response for rejecting ${rejectedChanges.length} changes:`, result);
        
        return { 
          success: result.success,
          message: result.message || `Processed ${rejectedChanges.length} rejections`,
          data: result.data || []
        };
      } catch (error) {
        if (error.response?.status === 404) {
          logWarn(`[dataCleanupService] Cleanup reject endpoint not found for ${resourceType}.`);
          return { 
            success: false, 
            message: 'Data cleanup feature is not implemented on the server',
            data: []
          };
        }
        throw error;
      }
    } catch (error) {
      logError(`[dataCleanupService] Error rejecting changes for ${resourceType}: ${error.message}`, { error, resourceType });
      // Return a consistent error response
      return { 
        success: false, 
        message: error.response?.data?.message || `Failed to reject changes: ${error.message}`,
        error: error.toString(),
        data: []
      };
    }
  }

  // Helper function to format changes for the UI, ensuring consistent structure
  // and generating necessary fields if missing (though backend should provide them now)
  formatChanges(changes, resourceType = 'Unknown') {
    if (!changes || !Array.isArray(changes)) {
      logError('[dataCleanupService] Invalid changes data passed to formatChanges:', { changes });
      return [];
    }
    
    logDebug(`[dataCleanupService] Formatting ${changes.length} changes for UI, resource: ${resourceType}`);
    
    return changes.map((change, index) => {
      if (!change || typeof change !== 'object') {
        logWarn(`[dataCleanupService] Invalid change item at index ${index}:`, change);
        return {
          changeId: `invalid-item-${index}`,
          resourceId: 'unknown',
          resourceType: resourceType,
          title: 'Invalid Change Data',
          category: 'Error',
          field: 'unknown',
          type: 'error',
          currentValue: JSON.stringify(change),
          proposedValue: 'Error in data',
          impact: 'High',
          confidence: 0
        };
      }

      // Backend should provide a unique changeId. If not, generate one (less ideal).
      const changeId = change.changeId || `${resourceType}-${change.resourceId || `idx-${index}`}-${change.field || 'field'}-${change.type || 'type'}`;
      
      const title = change.title || 
        `${(change.type?.charAt(0).toUpperCase() + change.type?.slice(1)) || 'Update'} ${change.field || 'field'}`;
      
      const category = change.category || 
        (change.type === 'trim' || change.type === 'titleCase' || change.type === 'toLowerCase' ? 'Text Formatting' : 
         change.type === 'truncate' ? 'Content Length' :
         change.type === 'prefixHttp' ? 'URL Formatting' :
         change.type === 'formatUSPhone' ? 'Contact Information' :
         'General');
      
      // Ensure currentValue and proposedValue are strings for display
      const currentValueStr = typeof change.currentValue === 'string' 
        ? change.currentValue 
        : (change.currentValue === null || typeof change.currentValue === 'undefined') ? 'N/A' : String(change.currentValue);
      
      const proposedValueStr = typeof change.proposedValue === 'string'
        ? change.proposedValue
        : (change.proposedValue === null || typeof change.proposedValue === 'undefined') ? 'N/A' : String(change.proposedValue);
      
      return {
        changeId: changeId, // Unique ID for the change suggestion itself
        resourceId: change.resourceId, // ID of the resource (e.g., restaurant_id)
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
    });
  }

  // Helper method to generate mock changes for demo purposes
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