/* src/services/submissionService.js */
import apiClient from './apiClient.js';
import { handleApiResponse } from '@/utils/serviceHelpers.js';
import { logError, logDebug } from '@/utils/logger.js';

export const submissionService = {
  /**
   * Gets all pending submissions that need review
   * @returns {Promise<Object>} Submissions data or error object
   */
  getPendingSubmissions: async () => {
    const result = await handleApiResponse(
      () => apiClient.get('/admin/submissions'),
      'submissionService.getSubmissions'
    );
    
    if (!result.success) {
      logError('[SubmissionService] Failed to fetch pending submissions:', result.error);
      return { success: false, error: result.error, data: [] };
    }
    
    return result;
  },

  /**
   * Gets all submissions for a specific user
   * @param {string|number} userId - The ID of the user. While present, the API endpoint relies on the authenticated session.
   * @param {object} params - Query parameters such as status, page, limit.
   * @returns {Promise<Object>} Submissions data or error object
   */
  getUserSubmissions: async (userId, params = {}) => {
    if (!userId) {
      // This check can remain for frontend logic that might require userId explicitly before calling
      logError('[SubmissionService] User ID is required for getUserSubmissions, though API uses authenticated user.');
      return { 
        success: false, 
        error: 'User ID is required for client-side validation, API uses authenticated user.',
        data: [] 
      };
    }
    
    // The backend route /api/submissions/ uses req.user.id from the authenticated session
    logDebug(`[SubmissionService] Fetching submissions for authenticated user with params:`, params);
    
    const result = await handleApiResponse(
      () => apiClient.get('/submissions', { params }), // Fixed endpoint to match backend route
      'SubmissionService.getUserSubmissions'
    );
    
    if (!result.success) {
      logError(`[SubmissionService] Failed to fetch submissions for authenticated user:`, result.error);
      return { success: false, error: result.error, data: [] };
    }
    
    return result;
  },
};

export default submissionService;