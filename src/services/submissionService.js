/* src/services/submissionService.js */
import apiClient from './apiClient.js';
import { handleApiResponse } from '@/utils/serviceHelpers.js';
import { logError, logDebug } from '@/utils/logger.js';

export const submissionService = {
  /**
   * Gets all pending submissions that need review
   */
  getPendingSubmissions: async () => {
    return handleApiResponse(
      () => apiClient.get('/api/admin/submissions'),
      'SubmissionService GetPending'
    ).catch(error => {
      logError('[SubmissionService] Failed to fetch pending submissions:', error);
      throw error;
    });
  },

  /**
   * Gets all submissions for a specific user
   * @param {string|number} userId - The ID of the user. While present, the API endpoint relies on the authenticated session.
   * @param {object} params - Query parameters such as status, page, limit.
   */
  getUserSubmissions: async (userId, params = {}) => {
    if (!userId) {
      // This check can remain for frontend logic that might require userId explicitly before calling
      logError('[SubmissionService] User ID is required for getUserSubmissions, though API uses authenticated user.');
      throw new Error('User ID is required for client-side validation, API uses authenticated user.');
    }
    
    // The backend route /api/submissions/user uses req.user.id from the authenticated session
    logDebug(`[SubmissionService] Fetching submissions for authenticated user with params:`, params);
    
    return handleApiResponse(
      () => apiClient.get('/api/submissions/user', { params }), // Updated endpoint to match backend route
      'SubmissionService GetUserSubmissions'
    ).catch(error => {
      logError(`[SubmissionService] Failed to fetch submissions for authenticated user:`, error);
      throw error;
    });
  },
};

export default submissionService;