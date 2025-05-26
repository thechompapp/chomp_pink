/**
 * Unified Restaurant Service Tests
 * 
 * Tests for the unified restaurant service that provides backward compatibility
 * while using the new modular services internally.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { restaurantService } from '@/services/restaurant';
import { restaurantCrudService } from '@/services/restaurant/RestaurantCrudService';
import { restaurantSearchService } from '@/services/restaurant/RestaurantSearchService';
import { restaurantReviewService } from '@/services/restaurant/RestaurantReviewService';

// Mock the individual services
vi.mock('@/services/restaurant/RestaurantCrudService', () => ({
  restaurantCrudService: {
    getRestaurantDetails: vi.fn(),
    getRestaurantById: vi.fn(),
    getRestaurantsByIds: vi.fn(),
    createRestaurant: vi.fn(),
    updateRestaurant: vi.fn(),
    deleteRestaurant: vi.fn(),
    getFeaturedRestaurants: vi.fn(),
    getPopularRestaurants: vi.fn()
  }
}));

vi.mock('@/services/restaurant/RestaurantSearchService', () => ({
  restaurantSearchService: {
    searchRestaurants: vi.fn(),
    getRestaurantSuggestions: vi.fn(),
    searchRestaurantsByLocation: vi.fn(),
    searchRestaurantsByCuisine: vi.fn(),
    getSimilarRestaurants: vi.fn(),
    getTrendingRestaurants: vi.fn()
  }
}));

vi.mock('@/services/restaurant/RestaurantReviewService', () => ({
  restaurantReviewService: {
    getRestaurantReviews: vi.fn(),
    addRestaurantReview: vi.fn(),
    updateRestaurantReview: vi.fn(),
    deleteRestaurantReview: vi.fn(),
    getRestaurantRatingSummary: vi.fn(),
    voteOnReview: vi.fn(),
    reportReview: vi.fn()
  }
}));

// Mock the logger
vi.mock('@/utils/logger', () => ({
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logInfo: vi.fn()
}));

describe('Unified Restaurant Service', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
  });
  
  describe('CRUD operations', () => {
    it('should delegate getRestaurantDetails to restaurantCrudService', async () => {
      // Mock response
      const mockResponse = { 
        success: true, 
        data: { id: '1', name: 'Test Restaurant' } 
      };
      restaurantCrudService.getRestaurantDetails.mockResolvedValueOnce(mockResponse);
      
      // Call the unified service
      const result = await restaurantService.getRestaurantDetails('1');
      
      // Assertions
      expect(restaurantCrudService.getRestaurantDetails).toHaveBeenCalledWith('1');
      expect(result).toBe(mockResponse);
    });
    
    it('should delegate getRestaurantById to restaurantCrudService', async () => {
      // Mock response
      const mockResponse = { 
        success: true, 
        data: { id: '1', name: 'Test Restaurant' } 
      };
      restaurantCrudService.getRestaurantById.mockResolvedValueOnce(mockResponse);
      
      // Call the unified service
      const result = await restaurantService.getRestaurantById('1');
      
      // Assertions
      expect(restaurantCrudService.getRestaurantById).toHaveBeenCalledWith('1');
      expect(result).toBe(mockResponse);
    });
    
    it('should delegate createRestaurant to restaurantCrudService', async () => {
      // Mock response
      const mockResponse = { 
        success: true, 
        data: { id: '1', name: 'New Restaurant' } 
      };
      restaurantCrudService.createRestaurant.mockResolvedValueOnce(mockResponse);
      
      // Restaurant data
      const restaurantData = { name: 'New Restaurant', cuisine: 'Italian' };
      
      // Call the unified service
      const result = await restaurantService.createRestaurant(restaurantData);
      
      // Assertions
      expect(restaurantCrudService.createRestaurant).toHaveBeenCalledWith(restaurantData);
      expect(result).toBe(mockResponse);
    });
    
    it('should delegate getFeaturedRestaurants to restaurantCrudService', async () => {
      // Mock response
      const mockResponse = { 
        success: true, 
        data: { restaurants: [{ id: '1', name: 'Featured Restaurant' }] } 
      };
      restaurantCrudService.getFeaturedRestaurants.mockResolvedValueOnce(mockResponse);
      
      // Call the unified service
      const options = { limit: 5, page: 1 };
      const result = await restaurantService.getFeaturedRestaurants(options);
      
      // Assertions
      expect(restaurantCrudService.getFeaturedRestaurants).toHaveBeenCalledWith(options);
      expect(result).toBe(mockResponse);
    });
  });
  
  describe('Search operations', () => {
    it('should delegate searchRestaurants to restaurantSearchService', async () => {
      // Mock response
      const mockResponse = { 
        success: true, 
        data: { restaurants: [{ id: '1', name: 'Matching Restaurant' }] } 
      };
      restaurantSearchService.searchRestaurants.mockResolvedValueOnce(mockResponse);
      
      // Search params
      const params = { query: 'pizza', cuisine: 'Italian' };
      
      // Call the unified service
      const result = await restaurantService.searchRestaurants(params);
      
      // Assertions
      expect(restaurantSearchService.searchRestaurants).toHaveBeenCalledWith(params);
      expect(result).toBe(mockResponse);
    });
    
    it('should delegate getRestaurantSuggestions to restaurantSearchService', async () => {
      // Mock response
      const mockResponse = { 
        success: true, 
        suggestions: [{ id: '1', name: 'Pizza Place' }] 
      };
      restaurantSearchService.getRestaurantSuggestions.mockResolvedValueOnce(mockResponse);
      
      // Call the unified service
      const result = await restaurantService.getRestaurantSuggestions('pizza', { limit: 5 });
      
      // Assertions
      expect(restaurantSearchService.getRestaurantSuggestions).toHaveBeenCalledWith('pizza', { limit: 5 });
      expect(result).toBe(mockResponse);
    });
    
    it('should delegate getSimilarRestaurants to restaurantSearchService', async () => {
      // Mock response
      const mockResponse = { 
        success: true, 
        data: [{ id: '2', name: 'Similar Restaurant' }] 
      };
      restaurantSearchService.getSimilarRestaurants.mockResolvedValueOnce(mockResponse);
      
      // Call the unified service
      const result = await restaurantService.getSimilarRestaurants('1', { limit: 3 });
      
      // Assertions
      expect(restaurantSearchService.getSimilarRestaurants).toHaveBeenCalledWith('1', { limit: 3 });
      expect(result).toBe(mockResponse);
    });
  });
  
  describe('Review operations', () => {
    it('should delegate getRestaurantReviews to restaurantReviewService', async () => {
      // Mock response
      const mockResponse = { 
        success: true, 
        data: { reviews: [{ id: '1', rating: 5, text: 'Great place!' }] } 
      };
      restaurantReviewService.getRestaurantReviews.mockResolvedValueOnce(mockResponse);
      
      // Call the unified service
      const options = { page: 1, limit: 10, sortBy: 'date' };
      const result = await restaurantService.getRestaurantReviews('1', options);
      
      // Assertions
      expect(restaurantReviewService.getRestaurantReviews).toHaveBeenCalledWith('1', options);
      expect(result).toBe(mockResponse);
    });
    
    it('should delegate addRestaurantReview to restaurantReviewService', async () => {
      // Mock response
      const mockResponse = { 
        success: true, 
        data: { id: '1', rating: 4, text: 'Good food!' } 
      };
      restaurantReviewService.addRestaurantReview.mockResolvedValueOnce(mockResponse);
      
      // Review data
      const reviewData = { rating: 4, text: 'Good food!' };
      
      // Call the unified service
      const result = await restaurantService.addRestaurantReview('1', reviewData);
      
      // Assertions
      expect(restaurantReviewService.addRestaurantReview).toHaveBeenCalledWith('1', reviewData);
      expect(result).toBe(mockResponse);
    });
    
    it('should delegate getRestaurantRatingSummary to restaurantReviewService', async () => {
      // Mock response
      const mockResponse = { 
        success: true, 
        data: { 
          averageRating: 4.5, 
          totalReviews: 10,
          ratingDistribution: { 5: 7, 4: 2, 3: 1, 2: 0, 1: 0 }
        } 
      };
      restaurantReviewService.getRestaurantRatingSummary.mockResolvedValueOnce(mockResponse);
      
      // Call the unified service
      const result = await restaurantService.getRestaurantRatingSummary('1');
      
      // Assertions
      expect(restaurantReviewService.getRestaurantRatingSummary).toHaveBeenCalledWith('1');
      expect(result).toBe(mockResponse);
    });
  });
});
