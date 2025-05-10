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
    const safeLimit = Math.max(1, parseInt(limit, 10) || 15);
    const endpoint = `/hashtags/top`;
    const context = `HashtagService GetTopHashtags (limit: ${safeLimit})`;
    const queryParams = createQueryParams({ limit: safeLimit });

    return handleApiResponse(
      () => apiClient.get(endpoint, { params: queryParams }),
      context,
      (data) => {
        if (!Array.isArray(data)) {
          throw new Error('Unexpected response structure for hashtags');
        }
        
        return data.map(item => ({
          name: item.name || '',
          usage_count: parseInt(item.usage_count, 10) || 0,
          id: parseInt(item.id, 10) || null
        }));
      }
    );
  },
};

// Export the service object directly
export { hashtagService };
// Remove default export if using named export for consistency
// export default hashtagService;