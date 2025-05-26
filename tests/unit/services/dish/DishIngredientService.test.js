/**
 * DishIngredientService Tests
 * 
 * Tests for the DishIngredientService class that handles ingredient operations for dishes.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DishIngredientService } from '@/services/dish/DishIngredientService';
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

describe('DishIngredientService', () => {
  let service;
  
  beforeEach(() => {
    // Create a new instance of the service for each test
    service = new DishIngredientService();
    
    // Reset the mock API client
    vi.clearAllMocks();
  });
  
  describe('getDishIngredients', () => {
    it('should fetch ingredients for a dish', async () => {
      // Mock the API response
      const mockResponse = {
        data: [
          { id: '1', name: 'Tomato', quantity: '2', unit: 'pcs' },
          { id: '2', name: 'Onion', quantity: '1', unit: 'pcs' }
        ]
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.getDishIngredients('1');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/dishes/1/ingredients'
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Ingredients retrieved successfully'
      });
    });
    
    it('should return error for invalid dish ID', async () => {
      // Call the method with invalid ID
      const result = await service.getDishIngredients(null);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid dish ID',
        data: []
      });
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock the API error
      const mockError = new Error('Network error');
      apiClient.mockRejectedValueOnce(mockError);
      
      // Call the method
      const result = await service.getDishIngredients('1');
      
      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Failed to retrieve dish ingredients',
        data: []
      });
    });
  });
  
  describe('updateDishIngredients', () => {
    it('should update ingredients for a dish', async () => {
      // Mock ingredients data
      const ingredients = [
        { id: '1', name: 'Tomato', quantity: '3', unit: 'pcs' },
        { id: '2', name: 'Garlic', quantity: '2', unit: 'cloves' }
      ];
      
      // Mock the API response
      const mockResponse = {
        data: ingredients
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.updateDishIngredients('1', ingredients);
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'put',
        url: '/dishes/1/ingredients',
        data: { ingredients }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Ingredients updated successfully'
      });
    });
    
    it('should validate ingredients is an array', async () => {
      // Call the method with invalid ingredients
      const result = await service.updateDishIngredients('1', 'not an array');
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Ingredients must be an array',
        data: null
      });
    });
    
    it('should return error for invalid dish ID', async () => {
      // Call the method with invalid ID
      const result = await service.updateDishIngredients(null, []);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid dish ID',
        data: null
      });
    });
  });
  
  describe('getDishAllergens', () => {
    it('should fetch allergens for a dish', async () => {
      // Mock the API response
      const mockResponse = {
        data: [
          { id: '1', name: 'Gluten', severity: 'high' },
          { id: '2', name: 'Dairy', severity: 'medium' }
        ]
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.getDishAllergens('1');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/dishes/1/allergens'
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Allergens retrieved successfully'
      });
    });
    
    it('should return error for invalid dish ID', async () => {
      // Call the method with invalid ID
      const result = await service.getDishAllergens(null);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid dish ID',
        data: []
      });
    });
  });
  
  describe('updateDishAllergens', () => {
    it('should update allergens for a dish', async () => {
      // Mock allergens data
      const allergens = [
        { id: '1', name: 'Gluten', severity: 'high' },
        { id: '2', name: 'Nuts', severity: 'high' }
      ];
      
      // Mock the API response
      const mockResponse = {
        data: allergens
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.updateDishAllergens('1', allergens);
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'put',
        url: '/dishes/1/allergens',
        data: { allergens }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Allergens updated successfully'
      });
    });
    
    it('should validate allergens is an array', async () => {
      // Call the method with invalid allergens
      const result = await service.updateDishAllergens('1', 'not an array');
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Allergens must be an array',
        data: null
      });
    });
  });
  
  describe('getDishNutrition', () => {
    it('should fetch nutrition information for a dish', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          calories: 450,
          protein: 20,
          carbs: 55,
          fat: 15,
          fiber: 5,
          sugar: 10
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.getDishNutrition('1');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/dishes/1/nutrition'
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Nutrition information retrieved successfully'
      });
    });
    
    it('should return error for invalid dish ID', async () => {
      // Call the method with invalid ID
      const result = await service.getDishNutrition(null);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid dish ID',
        data: null
      });
    });
  });
  
  describe('updateDishNutrition', () => {
    it('should update nutrition information for a dish', async () => {
      // Mock nutrition data
      const nutritionData = {
        calories: 450,
        protein: 20,
        carbs: 55,
        fat: 15,
        fiber: 5,
        sugar: 10
      };
      
      // Mock the API response
      const mockResponse = {
        data: nutritionData
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.updateDishNutrition('1', nutritionData);
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'put',
        url: '/dishes/1/nutrition',
        data: nutritionData
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Nutrition information updated successfully'
      });
    });
    
    it('should validate nutrition data is an object', async () => {
      // Call the method with invalid nutrition data
      const result = await service.updateDishNutrition('1', 'not an object');
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid nutrition data',
        data: null
      });
    });
  });
  
  describe('getDishesByIngredient', () => {
    it('should fetch dishes by ingredient', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          dishes: [
            { id: '1', name: 'Tomato Pasta', ingredients: ['Tomato', 'Pasta'] },
            { id: '2', name: 'Tomato Soup', ingredients: ['Tomato', 'Onion'] }
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
      const result = await service.getDishesByIngredient('Tomato');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/dishes/by-ingredient',
        params: {
          ingredient: 'Tomato',
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
    
    it('should return error for empty ingredient name', async () => {
      // Call the method with empty ingredient name
      const result = await service.getDishesByIngredient('');
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Ingredient name is required',
        data: {
          dishes: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
        }
      });
    });
  });
  
  describe('getDishesByExcludedAllergens', () => {
    it('should fetch dishes without specific allergens', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          dishes: [
            { id: '1', name: 'Gluten-Free Pasta', allergens: [] },
            { id: '2', name: 'Dairy-Free Ice Cream', allergens: ['Nuts'] }
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
      const result = await service.getDishesByExcludedAllergens(['Gluten', 'Dairy']);
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/dishes/without-allergens',
        params: {
          allergens: 'Gluten,Dairy',
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
    
    it('should return error for empty allergens array', async () => {
      // Call the method with empty allergens array
      const result = await service.getDishesByExcludedAllergens([]);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Allergens must be a non-empty array',
        data: {
          dishes: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
        }
      });
    });
  });
});
