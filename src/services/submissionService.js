/* src/services/submissionService.js */
import apiClient from './apiClient.js';
import useApiErrorHandler from '@/hooks/useApiErrorHandler';

export const submissionService = {
  getPendingSubmissions: async () => {
    const { handleError } = useApiErrorHandler();
    try {
      const response = await apiClient('/api/submissions/pending', 'SubmissionService GetPending');
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch pending submissions');
    } catch (error) {
      handleError(error, 'Failed to fetch pending submissions.');
      throw error;
    }
  },

  getUserSubmissions: async (userId) => {
    const { handleError } = useApiErrorHandler();
    if (!userId) {
      throw new Error('User ID is required');
    }
    try {
      const response = await apiClient(`/api/submissions/user/${encodeURIComponent(String(userId))}`, 'SubmissionService GetUserSubmissions');
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch user submissions');
    } catch (error) {
      handleError(error, 'Failed to fetch user submissions.');
      throw error;
    }
  },
};

export default submissionService;