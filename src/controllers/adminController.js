import { adminService } from '../services/adminService.js';
import { handleApiResponse } from '../utils/serviceHelpers.js';

export const adminController = {
  // Data cleanup endpoints
  async analyzeData(req, res) {
    try {
      const { resourceType } = req.params;
      console.log('[adminController] Analyzing data for:', resourceType);
      
      const changes = await adminService.analyzeData(resourceType);
      return handleApiResponse(res, { changes });
    } catch (error) {
      console.error('[adminController] Error analyzing data:', error);
      return handleApiResponse(res, { error: error.message }, 500);
    }
  },

  async applyChanges(req, res) {
    try {
      const { resourceType } = req.params;
      const { changeIds } = req.body;
      console.log('[adminController] Applying changes for:', resourceType, changeIds);
      
      const result = await adminService.applyChanges(resourceType, changeIds);
      return handleApiResponse(res, { result });
    } catch (error) {
      console.error('[adminController] Error applying changes:', error);
      return handleApiResponse(res, { error: error.message }, 500);
    }
  },

  async rejectChanges(req, res) {
    try {
      const { resourceType } = req.params;
      const { changeIds } = req.body;
      console.log('[adminController] Rejecting changes for:', resourceType, changeIds);
      
      const result = await adminService.rejectChanges(resourceType, changeIds);
      return handleApiResponse(res, { result });
    } catch (error) {
      console.error('[adminController] Error rejecting changes:', error);
      return handleApiResponse(res, { error: error.message }, 500);
    }
  }
}; 