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
      () => apiClient.get('/api/submissions/pending'),
      'SubmissionService GetPending'
    ).catch(error => {
      logError('[SubmissionService] Failed to fetch pending submissions:', error);
      throw error;
    });
  },

  /**
   * Gets all submissions for a specific user
   * @param {string|number} userId - The ID of the user
   */
  getUserSubmissions: async (userId) => {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const encodedUserId = encodeURIComponent(String(userId));
    logDebug(`[SubmissionService] Fetching submissions for user ${userId}`);
    
    return handleApiResponse(
      () => apiClient.get(`/api/submissions/user/${encodedUserId}`),
      'SubmissionService GetUserSubmissions'
    ).catch(error => {
      logError(`[SubmissionService] Failed to fetch submissions for user ${userId}:`, error);
      throw error;
    });
  },
};

export default submissionService;