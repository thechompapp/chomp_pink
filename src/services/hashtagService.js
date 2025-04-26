/* src/services/hashtagService.js */
/**
 * Service for fetching hashtag-related data.
 */
// Corrected: Using apiClient function correctly
import apiClient from '@/services/apiClient';
// Corrected: Use standard logger import pattern
import * as logger from '@/utils/logger.js';
// Removed useApiErrorHandler hook import as service functions should ideally just throw errors
// import useApiErrorHandler from '@/hooks/useApiErrorHandler';

const hashtagService = {
  /**
   * Fetches the top hashtags by usage count.
   * @param {number} [limit=15] - Number of hashtags to fetch.
   * @returns {Promise<Array<{name: string, usage_count: number}>>} Array of top hashtags.
   */
  getTopHashtags: async (limit = 15) => {
    // const { handleError } = useApiErrorHandler(); // Error handling should be done by caller or apiClient
    const safeLimit = Math.max(1, parseInt(limit, 10) || 15);
    // Endpoint should likely NOT include /api/ prefix as apiClient handles it
    const endpoint = `/hashtags/top`;
    const context = `HashtagService GetTopHashtags (limit: ${safeLimit})`;
    const queryParams = new URLSearchParams({ limit: safeLimit.toString() });

    try {
      // Corrected: Call apiClient function
      const response = await apiClient(
          endpoint,
          context,
          { method: 'GET', params: queryParams }
      );

      logger.logDebug(`[${context}] Response from apiClient:`, response);

      // Check outer success (apiClient wrapper) and inner success (backend response)
      // Assuming backend returns { success: true, data: [...] }
      if (response.success && response.data?.success && Array.isArray(response.data?.data)) {
        // Return the actual data array from the backend response
        // Ensure mapping handles potential missing fields gracefully
        return response.data.data.map(item => ({
            name: String(item?.name || ''), // Ensure name is string
            usage_count: Number(item?.usage_count) || 0, // Ensure count is number
        }));
      } else {
        const errorMsg = response.data?.message || 'Failed to retrieve valid top hashtags data';
        logger.logError(`[${context}] Invalid response structure or backend error: ${errorMsg}`);
        throw new Error(errorMsg);
      }
    } catch (error) {
      // Log the error caught from apiClient
      logger.logError(`[${context}] Error fetching:`, error);
      // Re-throw a user-friendly message
      throw new Error(error.message || 'Failed to fetch top hashtags.');
    }
  },
};

// Export the service object directly
export { hashtagService };
// Remove default export if using named export for consistency
// export default hashtagService;