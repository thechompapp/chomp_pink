import apiClient from '@/services/apiClient';
import { logError, logDebug } from '@/utils/logger';
import { handleApiResponse } from '@/utils/serviceHelpers';

class DataCleanupService {
  async analyzeData(resourceType) {
    try {
      logDebug(`[dataCleanupService] Analyzing data for ${resourceType}`);
      console.log(`[dataCleanupService] Calling API endpoint for analyzing ${resourceType}`);
      
      // The apiClient already has a base URL of /api, so we just need /admin/cleanup/analyze/resourceType
      return handleApiResponse(
        () => apiClient.get(`/admin/cleanup/analyze/${resourceType}`),
        `DataCleanupService AnalyzeData ${resourceType}`
      );
    } catch (error) {
      logError('[dataCleanupService] Error analyzing data:', error);
      console.error('[dataCleanupService] Error details:', error.response?.data || error.message);
      throw error;
    }
  }

  async applyChanges(resourceType, changeIds) {
    try {
      logDebug(`[dataCleanupService] Applying changes for ${resourceType}:`, changeIds);
      console.log(`[dataCleanupService] Calling API endpoint for applying changes to ${resourceType}`);
      
      return handleApiResponse(
        () => apiClient.post(`/admin/cleanup/apply/${resourceType}`, { changeIds }),
        `DataCleanupService ApplyChanges ${resourceType}`
      );
    } catch (error) {
      logError('[dataCleanupService] Error applying changes:', error);
      console.error('[dataCleanupService] Error details:', error.response?.data || error.message);
      throw error;
    }
  }

  async rejectChanges(resourceType, changeIds) {
    try {
      logDebug(`[dataCleanupService] Rejecting changes for ${resourceType}:`, changeIds);
      console.log(`[dataCleanupService] Calling API endpoint for rejecting changes to ${resourceType}`);
      
      return handleApiResponse(
        () => apiClient.post(`/admin/cleanup/reject/${resourceType}`, { changeIds }),
        `DataCleanupService RejectChanges ${resourceType}`
      );
    } catch (error) {
      logError('[dataCleanupService] Error rejecting changes:', error);
      console.error('[dataCleanupService] Error details:', error.response?.data || error.message);
      throw error;
    }
  }

  // Helper function to format changes for the UI
  formatChanges(changes) {
    if (!changes || !Array.isArray(changes)) {
      console.error('[dataCleanupService] Invalid changes data:', changes);
      return [];
    }
    
    console.log('[dataCleanupService] Formatting changes:', changes);
    
    return changes.map(change => {
      // Create a formatted title based on the type and field if title not provided
      const title = change.title || 
        `${change.type?.charAt(0).toUpperCase() + change.type?.slice(1) || 'Update'} ${change.field || 'field'}`;
      
      // Use type as category if category not provided
      const category = change.category || 
        (change.type === 'trim' || change.type === 'capitalize' ? 'Text Formatting' : 
         change.type === 'truncate' ? 'Content Length' :
         change.type === 'format' ? 'Formatting' : 'Other');
      
      // Convert any non-string values to strings for display
      const currentValue = typeof change.currentValue === 'string' 
        ? change.currentValue 
        : JSON.stringify(change.currentValue);
      
      const proposedValue = typeof change.proposedValue === 'string'
        ? change.proposedValue
        : JSON.stringify(change.proposedValue);
      
      return {
        id: change.id,
        title: title,
        category: category,
        currentValue: currentValue,
        proposedValue: proposedValue,
        impact: change.impact || 'Data quality improvement',
        confidence: change.confidence || 0.7
      };
    });
  }
}

export const dataCleanupService = new DataCleanupService(); 