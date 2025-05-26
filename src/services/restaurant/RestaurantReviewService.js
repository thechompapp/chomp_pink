/**
 * Restaurant Review Service
 * 
 * Handles operations related to restaurant reviews, ratings, and feedback.
 */
import BaseService from '../utils/BaseService';
import { logDebug, logError, logWarn } from '@/utils/logger';
import { validateId } from '@/utils/serviceHelpers';
import { logEngagement } from '@/utils/logEngagement';

/**
 * Restaurant Review Service class
 */
class RestaurantReviewService extends BaseService {
  /**
   * Constructor
   */
  constructor() {
    super('/restaurants');
  }
  
  /**
   * Get reviews for a restaurant
   * @param {string|number} restaurantId - Restaurant ID
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.sortBy - Sort field (date, rating)
   * @param {string} options.sortOrder - Sort order (asc, desc)
   * @returns {Promise<Object>} Response with reviews
   */
  async getRestaurantReviews(restaurantId, { page = 1, limit = 10, sortBy = 'date', sortOrder = 'desc' } = {}) {
    if (!validateId(restaurantId)) {
      return {
        success: false,
        message: 'Invalid restaurant ID',
        data: {
          reviews: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        }
      };
    }
    
    logDebug(`[RestaurantReviewService] Getting reviews for restaurant ID: ${restaurantId}`);
    
    try {
      const result = await this.get(`/${restaurantId}/reviews`, {
        params: { page, limit, sortBy, sortOrder }
      });
      
      if (!result.success || !result.data || !Array.isArray(result.data.reviews)) {
        logWarn(`[RestaurantReviewService] No reviews found for restaurant ID: ${restaurantId}`);
        return {
          success: false,
          message: 'No reviews found',
          data: {
            reviews: [],
            pagination: { page, limit, total: 0, totalPages: 0 }
          }
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Reviews retrieved successfully'
      };
    } catch (error) {
      logError(`[RestaurantReviewService] Error getting restaurant reviews:`, error);
      return {
        success: false,
        message: 'Failed to retrieve reviews',
        data: {
          reviews: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        }
      };
    }
  }
  
  /**
   * Add a review for a restaurant
   * @param {string|number} restaurantId - Restaurant ID
   * @param {Object} reviewData - Review data
   * @param {number} reviewData.rating - Rating (1-5)
   * @param {string} reviewData.text - Review text
   * @param {Array<string>} reviewData.tags - Review tags
   * @returns {Promise<Object>} Response with created review
   */
  async addRestaurantReview(restaurantId, reviewData) {
    if (!validateId(restaurantId)) {
      return {
        success: false,
        message: 'Invalid restaurant ID',
        data: null
      };
    }
    
    if (!reviewData || typeof reviewData !== 'object') {
      return {
        success: false,
        message: 'Invalid review data',
        data: null
      };
    }
    
    // Validate required fields
    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      return {
        success: false,
        message: 'Rating is required and must be between 1 and 5',
        data: null
      };
    }
    
    logDebug(`[RestaurantReviewService] Adding review for restaurant ID: ${restaurantId}`);
    
    try {
      const result = await this.post(`/${restaurantId}/reviews`, reviewData);
      
      // Log engagement if successful
      if (result.success) {
        logEngagement('add_restaurant_review', { 
          restaurantId, 
          rating: reviewData.rating 
        });
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Review added successfully'
      };
    } catch (error) {
      logError(`[RestaurantReviewService] Error adding restaurant review:`, error);
      return {
        success: false,
        message: 'Failed to add review',
        data: null
      };
    }
  }
  
  /**
   * Update a restaurant review
   * @param {string|number} restaurantId - Restaurant ID
   * @param {string|number} reviewId - Review ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Response with updated review
   */
  async updateRestaurantReview(restaurantId, reviewId, updateData) {
    if (!validateId(restaurantId) || !validateId(reviewId)) {
      return {
        success: false,
        message: 'Invalid restaurant ID or review ID',
        data: null
      };
    }
    
    if (!updateData || typeof updateData !== 'object') {
      return {
        success: false,
        message: 'Invalid update data',
        data: null
      };
    }
    
    logDebug(`[RestaurantReviewService] Updating review ${reviewId} for restaurant ${restaurantId}`);
    
    try {
      const result = await this.put(`/${restaurantId}/reviews/${reviewId}`, updateData);
      
      return {
        success: true,
        data: result.data,
        message: 'Review updated successfully'
      };
    } catch (error) {
      logError(`[RestaurantReviewService] Error updating restaurant review:`, error);
      return {
        success: false,
        message: 'Failed to update review',
        data: null
      };
    }
  }
  
  /**
   * Delete a restaurant review
   * @param {string|number} restaurantId - Restaurant ID
   * @param {string|number} reviewId - Review ID
   * @returns {Promise<Object>} Response with deletion status
   */
  async deleteRestaurantReview(restaurantId, reviewId) {
    if (!validateId(restaurantId) || !validateId(reviewId)) {
      return {
        success: false,
        message: 'Invalid restaurant ID or review ID'
      };
    }
    
    logDebug(`[RestaurantReviewService] Deleting review ${reviewId} for restaurant ${restaurantId}`);
    
    try {
      await this.delete(`/${restaurantId}/reviews/${reviewId}`);
      
      return {
        success: true,
        message: 'Review deleted successfully'
      };
    } catch (error) {
      logError(`[RestaurantReviewService] Error deleting restaurant review:`, error);
      return {
        success: false,
        message: 'Failed to delete review'
      };
    }
  }
  
  /**
   * Get restaurant rating summary
   * @param {string|number} restaurantId - Restaurant ID
   * @returns {Promise<Object>} Response with rating summary
   */
  async getRestaurantRatingSummary(restaurantId) {
    if (!validateId(restaurantId)) {
      return {
        success: false,
        message: 'Invalid restaurant ID',
        data: null
      };
    }
    
    logDebug(`[RestaurantReviewService] Getting rating summary for restaurant ID: ${restaurantId}`);
    
    try {
      const result = await this.get(`/${restaurantId}/ratings`);
      
      if (!result.success || !result.data) {
        logWarn(`[RestaurantReviewService] No rating summary found for restaurant ID: ${restaurantId}`);
        return {
          success: false,
          message: 'No rating summary found',
          data: null
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Rating summary retrieved successfully'
      };
    } catch (error) {
      logError(`[RestaurantReviewService] Error getting restaurant rating summary:`, error);
      return {
        success: false,
        message: 'Failed to retrieve rating summary',
        data: null
      };
    }
  }
  
  /**
   * Vote on a review (helpful, not helpful)
   * @param {string|number} restaurantId - Restaurant ID
   * @param {string|number} reviewId - Review ID
   * @param {string} voteType - Vote type (helpful, not_helpful)
   * @returns {Promise<Object>} Response with vote status
   */
  async voteOnReview(restaurantId, reviewId, voteType) {
    if (!validateId(restaurantId) || !validateId(reviewId)) {
      return {
        success: false,
        message: 'Invalid restaurant ID or review ID'
      };
    }
    
    if (!voteType || !['helpful', 'not_helpful'].includes(voteType)) {
      return {
        success: false,
        message: 'Invalid vote type. Must be "helpful" or "not_helpful"'
      };
    }
    
    logDebug(`[RestaurantReviewService] Voting ${voteType} on review ${reviewId} for restaurant ${restaurantId}`);
    
    try {
      const result = await this.post(`/${restaurantId}/reviews/${reviewId}/vote`, { voteType });
      
      // Log engagement if successful
      if (result.success) {
        logEngagement('vote_on_review', { 
          restaurantId, 
          reviewId,
          voteType 
        });
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Vote recorded successfully'
      };
    } catch (error) {
      logError(`[RestaurantReviewService] Error voting on review:`, error);
      return {
        success: false,
        message: 'Failed to record vote'
      };
    }
  }
  
  /**
   * Report a review for inappropriate content
   * @param {string|number} restaurantId - Restaurant ID
   * @param {string|number} reviewId - Review ID
   * @param {Object} reportData - Report data
   * @param {string} reportData.reason - Reason for report
   * @param {string} reportData.details - Additional details
   * @returns {Promise<Object>} Response with report status
   */
  async reportReview(restaurantId, reviewId, reportData) {
    if (!validateId(restaurantId) || !validateId(reviewId)) {
      return {
        success: false,
        message: 'Invalid restaurant ID or review ID'
      };
    }
    
    if (!reportData || !reportData.reason) {
      return {
        success: false,
        message: 'Report reason is required'
      };
    }
    
    logDebug(`[RestaurantReviewService] Reporting review ${reviewId} for restaurant ${restaurantId}`);
    
    try {
      const result = await this.post(`/${restaurantId}/reviews/${reviewId}/report`, reportData);
      
      return {
        success: true,
        data: result.data,
        message: 'Review reported successfully'
      };
    } catch (error) {
      logError(`[RestaurantReviewService] Error reporting review:`, error);
      return {
        success: false,
        message: 'Failed to report review'
      };
    }
  }
}

// Create and export a singleton instance
export const restaurantReviewService = new RestaurantReviewService();

export default RestaurantReviewService;
