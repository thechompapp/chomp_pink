/**
 * DishSearchService Tests
 * 
 * Tests for the DishSearchService class that handles search operations for dishes.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DishSearchService } from '@/services/dish/DishSearchService';
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

describe('DishSearchService', () => {
  let service;
  
  beforeEach(() => {
    // Create a new instance of the service for each test
    service = new DishSearchService();
    
    // Reset the mock API client
    vi.clearAllMocks();
  });
  
  describe('searchDishes', () => {
    it('should search dishes with provided parameters', async () => {
      // Mock search parameters
      const searchParams = {
        query: 'pasta',
        cuisine: 'Italian',
        minPrice: 10,
        maxPrice: 30,
        page: 1,
        limit: 20
      };
      
      // Mock the API response
      const mockResponse = {
        data: {
          dishes: [
            { id: '1', name: 'Spaghetti Carbonara', cuisine: 'Italian', price: 15.99 },
            { id: '2', name: 'Fettuccine Alfredo', cuisine: 'Italian', price: 14.99 }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1
          }
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.searchDishes(searchParams);
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/dishes/search',
        params: searchParams
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Dishes found successfully'
      });
    });
    
    it('should use default pagination when not provided', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          dishes: [
            { id: '1', name: 'Spaghetti Carbonara', cuisine: 'Italian', price: 15.99 }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1
          }
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method with minimal params
      const result = await service.searchDishes({ query: 'pasta' });
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/dishes/search',
        params: {
          query: 'pasta',
          page: 1,
          limit: 20
        }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Dishes found successfully'
      });
    });
    
    it('should handle empty search results', async () => {
      // Mock the API response with no results
      const mockResponse = {
        data: {
          dishes: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0
          }
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.searchDishes({ query: 'nonexistent' });
      
      // Assertions
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Dishes found successfully'
      });
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock the API error
      const mockError = new Error('Network error');
      apiClient.mockRejectedValueOnce(mockError);
      
      // Call the method
      const result = await service.searchDishes({ query: 'pasta' });
      
      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Failed to search dishes',
        data: {
          dishes: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0
          }
        }
      });
    });
  });
  
  describe('getDishSuggestions', () => {
    it('should get dish suggestions for a query', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          suggestions: [
            { id: '1', name: 'Spaghetti Carbonara' },
            { id: '2', name: 'Spaghetti Bolognese' },
            { id: '3', name: 'Spaghetti Aglio e Olio' }
          ]
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.getDishSuggestions('spag');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/dishes/suggestions',
        params: {
          query: 'spag',
          limit: 5
        }
      });
      
      expect(result).toEqual({
        success: true,
        suggestions: mockResponse.data.suggestions,
        message: 'Suggestions retrieved successfully'
      });
    });
    
    it('should return error for empty query', async () => {
      // Call the method with empty query
      const result = await service.getDishSuggestions('');
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Query is required',
        suggestions: []
      });
    });
  });
  
  describe('searchDishesByCuisine', () => {
    it('should search dishes by cuisine', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          dishes: [
            { id: '1', name: 'Pad Thai', cuisine: 'Thai' },
            { id: '2', name: 'Green Curry', cuisine: 'Thai' }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1
          }
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.searchDishesByCuisine('Thai');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/dishes/cuisine',
        params: {
          cuisine: 'Thai',
          page: 1,
          limit: 20
        }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Dishes found successfully'
      });
    });
    
    it('should return error for empty cuisine', async () => {
      // Call the method with empty cuisine
      const result = await service.searchDishesByCuisine('');
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Cuisine is required',
        data: {
          dishes: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
        }
      });
    });
  });
  
  describe('getSimilarDishes', () => {
    it('should get similar dishes for a dish ID', async () => {
      // Mock the API response
      const mockResponse = {
        data: [
          { id: '2', name: 'Spaghetti Bolognese', similarity: 0.85 },
          { id: '3', name: 'Fettuccine Alfredo', similarity: 0.72 }
        ]
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.getSimilarDishes('1');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/dishes/1/similar',
        params: { limit: 5 }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Similar dishes retrieved successfully'
      });
    });
    
    it('should return error for invalid dish ID', async () => {
      // Call the method with invalid ID
      const result = await service.getSimilarDishes(null);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid dish ID',
        data: []
      });
    });
  });
  
  describe('getTrendingDishes', () => {
    it('should get trending dishes with default parameters', async () => {
      // Mock the API response
      const mockResponse = {
        data: [
          { id: '1', name: 'Ramen', trendScore: 98 },
          { id: '2', name: 'Poke Bowl', trendScore: 95 }
        ]
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.getTrendingDishes();
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/dishes/trending',
        params: { limit: 10, timeframe: 'week' }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Trending dishes retrieved successfully'
      });
    });
    
    it('should get trending dishes with custom parameters', async () => {
      // Mock the API response
      const mockResponse = {
        data: [
          { id: '1', name: 'Ramen', trendScore: 98, cuisine: 'Japanese' }
        ]
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method with custom parameters
      const result = await service.getTrendingDishes({
        limit: 5,
        timeframe: 'day',
        cuisine: 'Japanese'
      });
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/dishes/trending',
        params: {
          limit: 5,
          timeframe: 'day',
          cuisine: 'Japanese'
        }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Trending dishes retrieved successfully'
      });
    });
  });
  
  describe('searchDishesByPriceRange', () => {
    it('should search dishes by price range', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          dishes: [
            { id: '1', name: 'Burger', price: 12.99 },
            { id: '2', name: 'Sandwich', price: 9.99 }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1
          }
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.searchDishesByPriceRange(8, 15);
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/dishes/price-range',
        params: {
          minPrice: 8,
          maxPrice: 15,
          page: 1,
          limit: 20
        }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Dishes found successfully'
      });
    });
    
    it('should return error for missing price parameters', async () => {
      // Call the method with missing maxPrice
      const result = await service.searchDishesByPriceRange(10);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Both minPrice and maxPrice are required',
        data: {
          dishes: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
        }
      });
    });
  });
  
  describe('searchDishesByDietaryRestrictions', () => {
    it('should search dishes by dietary restrictions', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          dishes: [
            { id: '1', name: 'Vegan Burger', dietaryRestrictions: ['vegan', 'gluten-free'] },
            { id: '2', name: 'Vegetable Curry', dietaryRestrictions: ['vegan'] }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1
          }
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.searchDishesByDietaryRestrictions(['vegan']);
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/dishes/dietary',
        params: {
          restrictions: 'vegan',
          page: 1,
          limit: 20
        }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Dishes found successfully'
      });
    });
    
    it('should return error for empty restrictions array', async () => {
      // Call the method with empty array
      const result = await service.searchDishesByDietaryRestrictions([]);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Dietary restrictions must be a non-empty array',
        data: {
          dishes: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
        }
      });
    });
  });
});
