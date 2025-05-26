/**
 * DishReviewService Tests
 * 
 * Tests for the DishReviewService class that handles review operations for dishes.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DishReviewService } from '@/services/dish/DishReviewService';
import { apiClient } from '@/services/apiClient';

// Mock the API client
vi.mock('@/services/apiClient', () => ({
  apiClient: vi.fn()
}));

// Mock the logger
vi.mock('@/utils/logger', () => ({
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logInfo: vi.fn()
}));

describe('DishReviewService', () => {
  let service;
  
  beforeEach(() => {
    // Create a new instance of the service for each test
    service = new DishReviewService();
    
    // Reset the mock API client
    vi.clearAllMocks();
  });
  
  describe('getDishReviews', () => {
    it('should fetch reviews for a dish', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          reviews: [
            { id: '1', rating: 5, comment: 'Great dish!', userId: 'user1' },
            { id: '2', rating: 4, comment: 'Very good', userId: 'user2' }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            totalPages: 1
          }
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.getDishReviews('1');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/dishes/1/reviews',
        params: {
          page: 1,
          limit: 10,
          sortBy: 'date',
          sortOrder: 'desc'
        }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Reviews retrieved successfully'
      });
    });
    
    it('should return error for invalid dish ID', async () => {
      // Call the method with invalid ID
      const result = await service.getDishReviews(null);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid dish ID',
        data: {
          reviews: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
        }
      });
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock the API error
      const mockError = new Error('Network error');
      apiClient.mockRejectedValueOnce(mockError);
      
      // Call the method
      const result = await service.getDishReviews('1');
      
      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Failed to retrieve dish reviews',
        data: {
          reviews: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
        }
      });
    });
  });
  
  describe('addDishReview', () => {
    it('should add a review for a dish', async () => {
      // Mock review data
      const reviewData = {
        rating: 5,
        comment: 'Excellent dish!',
        tags: ['spicy', 'flavorful']
      };
      
      // Mock the API response
      const mockResponse = {
        data: {
          id: '3',
          ...reviewData,
          userId: 'currentUser',
          createdAt: '2023-01-01T00:00:00Z'
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.addDishReview('1', reviewData);
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'post',
        url: '/dishes/1/reviews',
        data: reviewData
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Review added successfully'
      });
    });
    
    it('should validate rating is between 1 and 5', async () => {
      // Call the method with invalid rating
      const result = await service.addDishReview('1', { rating: 6, comment: 'Too good!' });
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Rating must be between 1 and 5',
        data: null
      });
    });
    
    it('should return error for invalid dish ID', async () => {
      // Call the method with invalid ID
      const result = await service.addDishReview(null, { rating: 5, comment: 'Great!' });
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid dish ID',
        data: null
      });
    });
  });
  
  describe('updateDishReview', () => {
    it('should update a dish review', async () => {
      // Mock update data
      const updateData = {
        rating: 4,
        comment: 'Updated comment'
      };
      
      // Mock the API response
      const mockResponse = {
        data: {
          id: '1',
          ...updateData,
          userId: 'user1',
          updatedAt: '2023-01-02T00:00:00Z'
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.updateDishReview('1', '1', updateData);
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'put',
        url: '/dishes/1/reviews/1',
        data: updateData
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Review updated successfully'
      });
    });
    
    it('should validate rating is between 1 and 5', async () => {
      // Call the method with invalid rating
      const result = await service.updateDishReview('1', '1', { rating: 0 });
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Rating must be between 1 and 5',
        data: null
      });
    });
    
    it('should return error for invalid dish ID or review ID', async () => {
      // Call the method with invalid dish ID
      const result1 = await service.updateDishReview(null, '1', { comment: 'Updated' });
      
      // Call the method with invalid review ID
      const result2 = await service.updateDishReview('1', null, { comment: 'Updated' });
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result1).toEqual({
        success: false,
        message: 'Invalid dish ID',
        data: null
      });
      expect(result2).toEqual({
        success: false,
        message: 'Invalid review ID',
        data: null
      });
    });
  });
  
  describe('deleteDishReview', () => {
    it('should delete a dish review', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          success: true
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.deleteDishReview('1', '1');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'delete',
        url: '/dishes/1/reviews/1'
      });
      
      expect(result).toEqual({
        success: true,
        message: 'Review deleted successfully'
      });
    });
    
    it('should return error for invalid dish ID or review ID', async () => {
      // Call the method with invalid dish ID
      const result1 = await service.deleteDishReview(null, '1');
      
      // Call the method with invalid review ID
      const result2 = await service.deleteDishReview('1', null);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result1).toEqual({
        success: false,
        message: 'Invalid dish ID'
      });
      expect(result2).toEqual({
        success: false,
        message: 'Invalid review ID'
      });
    });
  });
  
  describe('getDishRatingSummary', () => {
    it('should fetch rating summary for a dish', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          averageRating: 4.5,
          totalReviews: 10,
          ratingDistribution: {
            '1': 0,
            '2': 0,
            '3': 1,
            '4': 3,
            '5': 6
          }
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.getDishRatingSummary('1');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/dishes/1/rating-summary'
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Rating summary retrieved successfully'
      });
    });
    
    it('should return error for invalid dish ID', async () => {
      // Call the method with invalid ID
      const result = await service.getDishRatingSummary(null);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid dish ID',
        data: null
      });
    });
  });
  
  describe('getTopRatedDishes', () => {
    it('should fetch top-rated dishes with default parameters', async () => {
      // Mock the API response
      const mockResponse = {
        data: [
          { id: '1', name: 'Dish 1', averageRating: 4.9, totalReviews: 20 },
          { id: '2', name: 'Dish 2', averageRating: 4.8, totalReviews: 15 }
        ]
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.getTopRatedDishes();
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/dishes/top-rated',
        params: {
          limit: 10,
          minRating: 4,
          minReviews: 5
        }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Top-rated dishes retrieved successfully'
      });
    });
    
    it('should fetch top-rated dishes with custom parameters', async () => {
      // Mock the API response
      const mockResponse = {
        data: [
          { id: '1', name: 'Dish 1', averageRating: 4.9, totalReviews: 20 }
        ]
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method with custom parameters
      const result = await service.getTopRatedDishes({
        limit: 5,
        minRating: 4.5,
        minReviews: 10
      });
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/dishes/top-rated',
        params: {
          limit: 5,
          minRating: 4.5,
          minReviews: 10
        }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Top-rated dishes retrieved successfully'
      });
    });
  });
  
  describe('reactToDishReview', () => {
    it('should add a reaction to a dish review', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          reviewId: '1',
          reactionType: 'like',
          userId: 'currentUser'
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.reactToDishReview('1', '1', 'like');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'post',
        url: '/dishes/1/reviews/1/reactions',
        data: {
          type: 'like'
        }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Reaction added successfully'
      });
    });
    
    it('should return error for invalid parameters', async () => {
      // Call the method with invalid dish ID
      const result1 = await service.reactToDishReview(null, '1', 'like');
      
      // Call the method with invalid review ID
      const result2 = await service.reactToDishReview('1', null, 'like');
      
      // Call the method with invalid reaction type
      const result3 = await service.reactToDishReview('1', '1', null);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result1).toEqual({
        success: false,
        message: 'Invalid dish ID'
      });
      expect(result2).toEqual({
        success: false,
        message: 'Invalid review ID'
      });
      expect(result3).toEqual({
        success: false,
        message: 'Invalid reaction type'
      });
    });
  });
  
  describe('removeReactionFromDishReview', () => {
    it('should remove a reaction from a dish review', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          success: true
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.removeReactionFromDishReview('1', '1', 'like');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'delete',
        url: '/dishes/1/reviews/1/reactions/like'
      });
      
      expect(result).toEqual({
        success: true,
        message: 'Reaction removed successfully'
      });
    });
    
    it('should return error for invalid parameters', async () => {
      // Call the method with invalid dish ID
      const result1 = await service.removeReactionFromDishReview(null, '1', 'like');
      
      // Call the method with invalid review ID
      const result2 = await service.removeReactionFromDishReview('1', null, 'like');
      
      // Call the method with invalid reaction type
      const result3 = await service.removeReactionFromDishReview('1', '1', null);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result1).toEqual({
        success: false,
        message: 'Invalid dish ID'
      });
      expect(result2).toEqual({
        success: false,
        message: 'Invalid review ID'
      });
      expect(result3).toEqual({
        success: false,
        message: 'Invalid reaction type'
      });
    });
  });
});
