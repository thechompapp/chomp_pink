/**
 * Dish Review Service
 * 
 * Handles operations related to dish reviews and ratings.
 */
import BaseService from '../utils/BaseService';
import { logDebug, logError, logWarn } from '@/utils/logger';
import { validateId } from '@/utils/serviceHelpers';

/**
 * Dish Review Service class
 */
class DishReviewService extends BaseService {
  /**
   * Constructor
   */
  constructor() {
    super('/dishes');
  }
  
  /**
   * Get reviews for a dish
   * @param {string|number} dishId - Dish ID
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.sortBy - Sort field (date, rating)
   * @param {string} options.sortOrder - Sort order (asc, desc)
   * @returns {Promise<Object>} Response with reviews
   */
  async getDishReviews(dishId, { page = 1, limit = 10, sortBy = 'date', sortOrder = 'desc' } = {}) {
    if (!validateId(dishId)) {
      return {
        success: false,
        message: 'Invalid dish ID',
        data: {
          reviews: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        }
      };
    }
    
    logDebug(`[DishReviewService] Getting reviews for dish ID: ${dishId}`);
    
    try {
      const result = await this.get(`/${dishId}/reviews`, {
        params: {
          page,
          limit,
          sortBy,
          sortOrder
        }
      });
      
      if (!result.success || !result.data || !Array.isArray(result.data.reviews)) {
        logWarn(`[DishReviewService] No reviews found for dish ID: ${dishId}`);
        return {
          success: false,
          message: 'No reviews found for this dish',
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
      logError(`[DishReviewService] Error getting dish reviews:`, error);
      return {
        success: false,
        message: 'Failed to retrieve dish reviews',
        data: {
          reviews: [],
          pagination: { page, limit, total: 0, totalPages: 0 }
        }
      };
    }
  }
  
  /**
   * Add a review for a dish
   * @param {string|number} dishId - Dish ID
   * @param {Object} reviewData - Review data
   * @param {number} reviewData.rating - Rating (1-5)
   * @param {string} reviewData.comment - Review comment
   * @param {Array<string>} reviewData.tags - Review tags
   * @returns {Promise<Object>} Response with created review
   */
  async addDishReview(dishId, reviewData) {
    if (!validateId(dishId)) {
      return {
        success: false,
        message: 'Invalid dish ID',
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
    
    if (reviewData.rating === undefined || reviewData.rating < 1 || reviewData.rating > 5) {
      return {
        success: false,
        message: 'Rating must be between 1 and 5',
        data: null
      };
    }
    
    logDebug(`[DishReviewService] Adding review for dish ID: ${dishId}`);
    
    try {
      const result = await this.post(`/${dishId}/reviews`, reviewData);
      
      if (!result.success || !result.data) {
        return {
          success: false,
          message: 'Failed to add review',
          data: null
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Review added successfully'
      };
    } catch (error) {
      logError(`[DishReviewService] Error adding dish review:`, error);
      return {
        success: false,
        message: 'Failed to add review',
        data: null
      };
    }
  }
  
  /**
   * Update a dish review
   * @param {string|number} dishId - Dish ID
   * @param {string|number} reviewId - Review ID
   * @param {Object} updateData - Review update data
   * @returns {Promise<Object>} Response with updated review
   */
  async updateDishReview(dishId, reviewId, updateData) {
    if (!validateId(dishId)) {
      return {
        success: false,
        message: 'Invalid dish ID',
        data: null
      };
    }
    
    if (!validateId(reviewId)) {
      return {
        success: false,
        message: 'Invalid review ID',
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
    
    if (updateData.rating !== undefined && (updateData.rating < 1 || updateData.rating > 5)) {
      return {
        success: false,
        message: 'Rating must be between 1 and 5',
        data: null
      };
    }
    
    logDebug(`[DishReviewService] Updating review ${reviewId} for dish ID: ${dishId}`);
    
    try {
      const result = await this.put(`/${dishId}/reviews/${reviewId}`, updateData);
      
      if (!result.success || !result.data) {
        return {
          success: false,
          message: 'Failed to update review',
          data: null
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Review updated successfully'
      };
    } catch (error) {
      logError(`[DishReviewService] Error updating dish review:`, error);
      return {
        success: false,
        message: 'Failed to update review',
        data: null
      };
    }
  }
  
  /**
   * Delete a dish review
   * @param {string|number} dishId - Dish ID
   * @param {string|number} reviewId - Review ID
   * @returns {Promise<Object>} Response with deletion status
   */
  async deleteDishReview(dishId, reviewId) {
    if (!validateId(dishId)) {
      return {
        success: false,
        message: 'Invalid dish ID'
      };
    }
    
    if (!validateId(reviewId)) {
      return {
        success: false,
        message: 'Invalid review ID'
      };
    }
    
    logDebug(`[DishReviewService] Deleting review ${reviewId} for dish ID: ${dishId}`);
    
    try {
      await this.delete(`/${dishId}/reviews/${reviewId}`);
      
      return {
        success: true,
        message: 'Review deleted successfully'
      };
    } catch (error) {
      logError(`[DishReviewService] Error deleting dish review:`, error);
      return {
        success: false,
        message: 'Failed to delete review'
      };
    }
  }
  
  /**
   * Get dish rating summary
   * @param {string|number} dishId - Dish ID
   * @returns {Promise<Object>} Response with rating summary
   */
  async getDishRatingSummary(dishId) {
    if (!validateId(dishId)) {
      return {
        success: false,
        message: 'Invalid dish ID',
        data: null
      };
    }
    
    logDebug(`[DishReviewService] Getting rating summary for dish ID: ${dishId}`);
    
    try {
      const result = await this.get(`/${dishId}/rating-summary`);
      
      if (!result.success || !result.data) {
        return {
          success: false,
          message: 'Failed to get rating summary',
          data: null
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Rating summary retrieved successfully'
      };
    } catch (error) {
      logError(`[DishReviewService] Error getting dish rating summary:`, error);
      return {
        success: false,
        message: 'Failed to get rating summary',
        data: null
      };
    }
  }
  
  /**
   * Get top-rated dishes
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of dishes
   * @param {number} options.minRating - Minimum rating threshold
   * @param {number} options.minReviews - Minimum number of reviews
   * @returns {Promise<Object>} Response with top-rated dishes
   */
  async getTopRatedDishes({ limit = 10, minRating = 4, minReviews = 5 } = {}) {
    logDebug(`[DishReviewService] Getting top-rated dishes`);
    
    try {
      const result = await this.get('/top-rated', {
        params: {
          limit,
          minRating,
          minReviews
        }
      });
      
      if (!result.success || !result.data || !Array.isArray(result.data)) {
        logWarn(`[DishReviewService] No top-rated dishes found`);
        return {
          success: false,
          message: 'No top-rated dishes found',
          data: []
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Top-rated dishes retrieved successfully'
      };
    } catch (error) {
      logError(`[DishReviewService] Error getting top-rated dishes:`, error);
      return {
        success: false,
        message: 'Failed to get top-rated dishes',
        data: []
      };
    }
  }
  
  /**
   * React to a dish review (like, dislike, etc.)
   * @param {string|number} dishId - Dish ID
   * @param {string|number} reviewId - Review ID
   * @param {string} reactionType - Reaction type (like, dislike, helpful, etc.)
   * @returns {Promise<Object>} Response with reaction status
   */
  async reactToDishReview(dishId, reviewId, reactionType) {
    if (!validateId(dishId)) {
      return {
        success: false,
        message: 'Invalid dish ID'
      };
    }
    
    if (!validateId(reviewId)) {
      return {
        success: false,
        message: 'Invalid review ID'
      };
    }
    
    if (!reactionType || typeof reactionType !== 'string') {
      return {
        success: false,
        message: 'Invalid reaction type'
      };
    }
    
    logDebug(`[DishReviewService] Adding ${reactionType} reaction to review ${reviewId} for dish ID: ${dishId}`);
    
    try {
      const result = await this.post(`/${dishId}/reviews/${reviewId}/reactions`, {
        type: reactionType
      });
      
      if (!result.success) {
        return {
          success: false,
          message: 'Failed to add reaction'
        };
      }
      
      return {
        success: true,
        data: result.data,
        message: 'Reaction added successfully'
      };
    } catch (error) {
      logError(`[DishReviewService] Error adding reaction to dish review:`, error);
      return {
        success: false,
        message: 'Failed to add reaction'
      };
    }
  }
  
  /**
   * Remove a reaction from a dish review
   * @param {string|number} dishId - Dish ID
   * @param {string|number} reviewId - Review ID
   * @param {string} reactionType - Reaction type (like, dislike, helpful, etc.)
   * @returns {Promise<Object>} Response with reaction status
   */
  async removeReactionFromDishReview(dishId, reviewId, reactionType) {
    if (!validateId(dishId)) {
      return {
        success: false,
        message: 'Invalid dish ID'
      };
    }
    
    if (!validateId(reviewId)) {
      return {
        success: false,
        message: 'Invalid review ID'
      };
    }
    
    if (!reactionType || typeof reactionType !== 'string') {
      return {
        success: false,
        message: 'Invalid reaction type'
      };
    }
    
    logDebug(`[DishReviewService] Removing ${reactionType} reaction from review ${reviewId} for dish ID: ${dishId}`);
    
    try {
      await this.delete(`/${dishId}/reviews/${reviewId}/reactions/${reactionType}`);
      
      return {
        success: true,
        message: 'Reaction removed successfully'
      };
    } catch (error) {
      logError(`[DishReviewService] Error removing reaction from dish review:`, error);
      return {
        success: false,
        message: 'Failed to remove reaction'
      };
    }
  }
}

// Create and export a singleton instance
export const dishReviewService = new DishReviewService();

export default DishReviewService;
