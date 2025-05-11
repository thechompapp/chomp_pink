/* src/services/hashtagService.js */
/**
 * Service for fetching hashtag-related data.
 */
import apiClient from '@/services/apiClient';
import * as logger from '@/utils/logger.js';
import { handleApiResponse, createQueryParams } from '@/utils/serviceHelpers.js';
// Removed useApiErrorHandler hook import as service functions should ideally just throw errors
// import useApiErrorHandler from '@/hooks/useApiErrorHandler';

const hashtagService = {
  /**
   * Fetches the top hashtags by usage count.
   * @param {number} [limit=15] - Number of hashtags to fetch.
   * @returns {Promise<Array<{name: string, usage_count: number}>>} Array of top hashtags.
   */
  getTopHashtags: async (limit = 15) => {
    try {
      // Ensure we have a valid limit value
      const safeLimit = Math.max(1, parseInt(limit, 10) || 15);
      const endpoint = `/hashtags/top`;
      const context = `HashtagService GetTopHashtags (limit: ${safeLimit})`;
      
      // Use our standardized query parameter format
      const queryParams = { limit: safeLimit };
      
      // Use our standardized API response handler
      const result = await handleApiResponse(
        () => apiClient.get(`${endpoint}?${createQueryParams(queryParams)}`),
        context
      );
      
      // Ensure we have an array response, providing a fallback
      if (!Array.isArray(result)) {
        logger.logWarn('[HashtagService] Unexpected response format, expected an array');
        return [];
      }
      
      // Map and normalize the response data format
      return result.map(item => ({
        name: item.name || '',
        usage_count: parseInt(item.usage_count, 10) || 0,
        id: parseInt(item.id, 10) || null
      }));
    } catch (error) {
      // Log the error but return an empty array instead of throwing
      // This provides a more resilient UI experience
      logger.logError('[HashtagService] Error fetching top hashtags:', error);
      return [];
    }
  },
};

// Export the service object directly
export { hashtagService };
// Remove default export if using named export for consistency
// export default hashtagService;