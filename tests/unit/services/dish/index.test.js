/**
 * Unified Dish Service Tests
 * 
 * Tests for the unified dish service to ensure it maintains backward compatibility
 * while using the new modular services internally.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { dishService } from '@/services/dish';
import { dishCrudService } from '@/services/dish/DishCrudService';
import { dishSearchService } from '@/services/dish/DishSearchService';
import { dishReviewService } from '@/services/dish/DishReviewService';

// Mock the individual services
vi.mock('@/services/dish/DishCrudService', () => ({
  dishCrudService: {
    getDishDetails: vi.fn(),
    getDishesByIds: vi.fn(),
    getDishesByRestaurantId: vi.fn(),
    createDish: vi.fn(),
    updateDish: vi.fn(),
    deleteDish: vi.fn(),
    getFeaturedDishes: vi.fn(),
    getPopularDishes: vi.fn()
  }
}));

vi.mock('@/services/dish/DishSearchService', () => ({
  dishSearchService: {
    searchDishes: vi.fn(),
    getDishSuggestions: vi.fn(),
    searchDishesByCuisine: vi.fn(),
    getSimilarDishes: vi.fn(),
    getTrendingDishes: vi.fn(),
    searchDishesByPriceRange: vi.fn(),
    searchDishesByDietaryRestrictions: vi.fn()
  }
}));

vi.mock('@/services/dish/DishReviewService', () => ({
  dishReviewService: {
    getDishReviews: vi.fn(),
    addDishReview: vi.fn(),
    updateDishReview: vi.fn(),
    deleteDishReview: vi.fn(),
    getDishRatingSummary: vi.fn(),
    getTopRatedDishes: vi.fn(),
    reactToDishReview: vi.fn(),
    removeReactionFromDishReview: vi.fn()
  }
}));

// Mock the logger
vi.mock('@/utils/logger', () => ({
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
  logInfo: vi.fn()
}));

describe('Unified Dish Service', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });
  
  describe('CRUD Operations', () => {
    it('should delegate getDishDetails to dishCrudService', async () => {
      // Mock the return value
      const mockReturn = { success: true, data: { id: '1', name: 'Test Dish' } };
      dishCrudService.getDishDetails.mockResolvedValueOnce(mockReturn);
      
      // Call the method
      const result = await dishService.getDishDetails('1');
      
      // Assertions
      expect(dishCrudService.getDishDetails).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockReturn);
    });
    
    it('should delegate getDishesByIds to dishCrudService', async () => {
      // Mock the return value
      const mockReturn = { success: true, data: [{ id: '1' }, { id: '2' }] };
      dishCrudService.getDishesByIds.mockResolvedValueOnce(mockReturn);
      
      // Call the method
      const result = await dishService.getDishesByIds(['1', '2']);
      
      // Assertions
      expect(dishCrudService.getDishesByIds).toHaveBeenCalledWith(['1', '2']);
      expect(result).toEqual(mockReturn);
    });
    
    it('should delegate getDishesByRestaurantId to dishCrudService', async () => {
      // Mock the return value
      const mockReturn = { success: true, data: { dishes: [{ id: '1' }] } };
      dishCrudService.getDishesByRestaurantId.mockResolvedValueOnce(mockReturn);
      
      // Call the method
      const result = await dishService.getDishesByRestaurantId('5');
      
      // Assertions
      expect(dishCrudService.getDishesByRestaurantId).toHaveBeenCalledWith('5');
      expect(result).toEqual(mockReturn);
    });
    
    it('should delegate createDish to dishCrudService', async () => {
      // Mock dish data and return value
      const dishData = { name: 'New Dish', restaurantId: '5' };
      const mockReturn = { success: true, data: { id: '3', ...dishData } };
      dishCrudService.createDish.mockResolvedValueOnce(mockReturn);
      
      // Call the method
      const result = await dishService.createDish(dishData);
      
      // Assertions
      expect(dishCrudService.createDish).toHaveBeenCalledWith(dishData);
      expect(result).toEqual(mockReturn);
    });
    
    it('should delegate updateDish to dishCrudService', async () => {
      // Mock update data and return value
      const updateData = { name: 'Updated Dish' };
      const mockReturn = { success: true, data: { id: '1', ...updateData } };
      dishCrudService.updateDish.mockResolvedValueOnce(mockReturn);
      
      // Call the method
      const result = await dishService.updateDish('1', updateData);
      
      // Assertions
      expect(dishCrudService.updateDish).toHaveBeenCalledWith('1', updateData);
      expect(result).toEqual(mockReturn);
    });
    
    it('should delegate deleteDish to dishCrudService', async () => {
      // Mock return value
      const mockReturn = { success: true, message: 'Dish deleted successfully' };
      dishCrudService.deleteDish.mockResolvedValueOnce(mockReturn);
      
      // Call the method
      const result = await dishService.deleteDish('1');
      
      // Assertions
      expect(dishCrudService.deleteDish).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockReturn);
    });
    
    it('should delegate getFeaturedDishes to dishCrudService', async () => {
      // Mock options and return value
      const options = { limit: 5, page: 2 };
      const mockReturn = { success: true, data: { dishes: [{ id: '1' }] } };
      dishCrudService.getFeaturedDishes.mockResolvedValueOnce(mockReturn);
      
      // Call the method
      const result = await dishService.getFeaturedDishes(options);
      
      // Assertions
      expect(dishCrudService.getFeaturedDishes).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockReturn);
    });
    
    it('should delegate getPopularDishes to dishCrudService', async () => {
      // Mock options and return value
      const options = { limit: 5, timeframe: 'day' };
      const mockReturn = { success: true, data: { dishes: [{ id: '1' }] } };
      dishCrudService.getPopularDishes.mockResolvedValueOnce(mockReturn);
      
      // Call the method
      const result = await dishService.getPopularDishes(options);
      
      // Assertions
      expect(dishCrudService.getPopularDishes).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockReturn);
    });
  });
  
  describe('Review Operations', () => {
    it('should delegate getDishReviews to dishReviewService', async () => {
      // Mock options and return value
      const options = { page: 2, limit: 5, sortBy: 'rating' };
      const mockReturn = { success: true, data: { reviews: [{ id: '1' }] } };
      dishReviewService.getDishReviews.mockResolvedValueOnce(mockReturn);
      
      // Call the method
      const result = await dishService.getDishReviews('1', options);
      
      // Assertions
      expect(dishReviewService.getDishReviews).toHaveBeenCalledWith('1', options);
      expect(result).toEqual(mockReturn);
    });
    
    it('should delegate addDishReview to dishReviewService', async () => {
      // Mock review data and return value
      const reviewData = { rating: 5, comment: 'Excellent!' };
      const mockReturn = { success: true, data: { id: '1', ...reviewData } };
      dishReviewService.addDishReview.mockResolvedValueOnce(mockReturn);
      
      // Call the method
      const result = await dishService.addDishReview('1', reviewData);
      
      // Assertions
      expect(dishReviewService.addDishReview).toHaveBeenCalledWith('1', reviewData);
      expect(result).toEqual(mockReturn);
    });
    
    it('should delegate updateDishReview to dishReviewService', async () => {
      // Mock update data and return value
      const updateData = { rating: 4, comment: 'Updated comment' };
      const mockReturn = { success: true, data: { id: '1', ...updateData } };
      dishReviewService.updateDishReview.mockResolvedValueOnce(mockReturn);
      
      // Call the method
      const result = await dishService.updateDishReview('1', '1', updateData);
      
      // Assertions
      expect(dishReviewService.updateDishReview).toHaveBeenCalledWith('1', '1', updateData);
      expect(result).toEqual(mockReturn);
    });
    
    it('should delegate deleteDishReview to dishReviewService', async () => {
      // Mock return value
      const mockReturn = { success: true, message: 'Review deleted successfully' };
      dishReviewService.deleteDishReview.mockResolvedValueOnce(mockReturn);
      
      // Call the method
      const result = await dishService.deleteDishReview('1', '1');
      
      // Assertions
      expect(dishReviewService.deleteDishReview).toHaveBeenCalledWith('1', '1');
      expect(result).toEqual(mockReturn);
    });
    
    it('should delegate getDishRatingSummary to dishReviewService', async () => {
      // Mock return value
      const mockReturn = { success: true, data: { averageRating: 4.5, totalReviews: 10 } };
      dishReviewService.getDishRatingSummary.mockResolvedValueOnce(mockReturn);
      
      // Call the method
      const result = await dishService.getDishRatingSummary('1');
      
      // Assertions
      expect(dishReviewService.getDishRatingSummary).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockReturn);
    });
    
    it('should delegate getTopRatedDishes to dishReviewService', async () => {
      // Mock options and return value
      const options = { limit: 5, minRating: 4.5 };
      const mockReturn = { success: true, data: [{ id: '1', averageRating: 4.9 }] };
      dishReviewService.getTopRatedDishes.mockResolvedValueOnce(mockReturn);
      
      // Call the method
      const result = await dishService.getTopRatedDishes(options);
      
      // Assertions
      expect(dishReviewService.getTopRatedDishes).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockReturn);
    });
    
    it('should delegate reactToDishReview to dishReviewService', async () => {
      // Mock return value
      const mockReturn = { success: true, data: { reviewId: '1', reactionType: 'like' } };
      dishReviewService.reactToDishReview.mockResolvedValueOnce(mockReturn);
      
      // Call the method
      const result = await dishService.reactToDishReview('1', '1', 'like');
      
      // Assertions
      expect(dishReviewService.reactToDishReview).toHaveBeenCalledWith('1', '1', 'like');
      expect(result).toEqual(mockReturn);
    });
    
    it('should delegate removeReactionFromDishReview to dishReviewService', async () => {
      // Mock return value
      const mockReturn = { success: true, message: 'Reaction removed successfully' };
      dishReviewService.removeReactionFromDishReview.mockResolvedValueOnce(mockReturn);
      
      // Call the method
      const result = await dishService.removeReactionFromDishReview('1', '1', 'like');
      
      // Assertions
      expect(dishReviewService.removeReactionFromDishReview).toHaveBeenCalledWith('1', '1', 'like');
      expect(result).toEqual(mockReturn);
    });
  });
  
  describe('Search Operations', () => {
    it('should delegate searchDishes to dishSearchService', async () => {
      // Mock search params and return value
      const params = { query: 'pasta', cuisine: 'Italian' };
      const mockReturn = { success: true, data: { dishes: [{ id: '1' }] } };
      dishSearchService.searchDishes.mockResolvedValueOnce(mockReturn);
      
      // Call the method
      const result = await dishService.searchDishes(params);
      
      // Assertions
      expect(dishSearchService.searchDishes).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockReturn);
    });
    
    it('should delegate getDishSuggestions to dishSearchService', async () => {
      // Mock query, options and return value
      const query = 'pasta';
      const options = { limit: 3 };
      const mockReturn = { success: true, suggestions: [{ id: '1' }] };
      dishSearchService.getDishSuggestions.mockResolvedValueOnce(mockReturn);
      
      // Call the method
      const result = await dishService.getDishSuggestions(query, options);
      
      // Assertions
      expect(dishSearchService.getDishSuggestions).toHaveBeenCalledWith(query, options);
      expect(result).toEqual(mockReturn);
    });
    
    it('should delegate searchDishesByCuisine to dishSearchService', async () => {
      // Mock cuisine, options and return value
      const cuisine = 'Italian';
      const options = { page: 2, limit: 10 };
      const mockReturn = { success: true, data: { dishes: [{ id: '1' }] } };
      dishSearchService.searchDishesByCuisine.mockResolvedValueOnce(mockReturn);
      
      // Call the method
      const result = await dishService.searchDishesByCuisine(cuisine, options);
      
      // Assertions
      expect(dishSearchService.searchDishesByCuisine).toHaveBeenCalledWith(cuisine, options);
      expect(result).toEqual(mockReturn);
    });
    
    it('should delegate getSimilarDishes to dishSearchService', async () => {
      // Mock dish ID, options and return value
      const dishId = '1';
      const options = { limit: 3 };
      const mockReturn = { success: true, data: [{ id: '2' }] };
      dishSearchService.getSimilarDishes.mockResolvedValueOnce(mockReturn);
      
      // Call the method
      const result = await dishService.getSimilarDishes(dishId, options);
      
      // Assertions
      expect(dishSearchService.getSimilarDishes).toHaveBeenCalledWith(dishId, options);
      expect(result).toEqual(mockReturn);
    });
    
    it('should delegate getTrendingDishes to dishSearchService', async () => {
      // Mock options and return value
      const options = { limit: 5, timeframe: 'day', cuisine: 'Italian' };
      const mockReturn = { success: true, data: [{ id: '1' }] };
      dishSearchService.getTrendingDishes.mockResolvedValueOnce(mockReturn);
      
      // Call the method
      const result = await dishService.getTrendingDishes(options);
      
      // Assertions
      expect(dishSearchService.getTrendingDishes).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockReturn);
    });
    
    it('should delegate searchDishesByPriceRange to dishSearchService', async () => {
      // Mock price range, options and return value
      const minPrice = 10;
      const maxPrice = 20;
      const options = { page: 1, limit: 20 };
      const mockReturn = { success: true, data: { dishes: [{ id: '1' }] } };
      dishSearchService.searchDishesByPriceRange.mockResolvedValueOnce(mockReturn);
      
      // Call the method
      const result = await dishService.searchDishesByPriceRange(minPrice, maxPrice, options);
      
      // Assertions
      expect(dishSearchService.searchDishesByPriceRange).toHaveBeenCalledWith(minPrice, maxPrice, options);
      expect(result).toEqual(mockReturn);
    });
    
    it('should delegate searchDishesByDietaryRestrictions to dishSearchService', async () => {
      // Mock restrictions, options and return value
      const restrictions = ['vegan', 'gluten-free'];
      const options = { page: 1, limit: 20 };
      const mockReturn = { success: true, data: { dishes: [{ id: '1' }] } };
      dishSearchService.searchDishesByDietaryRestrictions.mockResolvedValueOnce(mockReturn);
      
      // Call the method
      const result = await dishService.searchDishesByDietaryRestrictions(restrictions, options);
      
      // Assertions
      expect(dishSearchService.searchDishesByDietaryRestrictions).toHaveBeenCalledWith(restrictions, options);
      expect(result).toEqual(mockReturn);
    });
  });
});
