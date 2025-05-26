/**
 * DishCrudService Tests
 * 
 * Tests for the DishCrudService class that handles CRUD operations for dishes.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DishCrudService } from '@/services/dish/DishCrudService';
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

describe('DishCrudService', () => {
  let service;
  
  beforeEach(() => {
    // Create a new instance of the service for each test
    service = new DishCrudService();
    
    // Reset the mock API client
    vi.clearAllMocks();
  });
  
  describe('getDishDetails', () => {
    it('should fetch dish details by ID', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          id: '1',
          name: 'Test Dish',
          description: 'A delicious test dish',
          price: 12.99,
          restaurantId: '5'
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.getDishDetails('1');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/dishes/1'
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Dish details retrieved successfully'
      });
    });
    
    it('should return error for invalid dish ID', async () => {
      // Call the method with invalid ID
      const result = await service.getDishDetails(null);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid dish ID',
        data: null
      });
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock the API error
      const mockError = new Error('Network error');
      apiClient.mockRejectedValueOnce(mockError);
      
      // Call the method
      const result = await service.getDishDetails('1');
      
      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Failed to retrieve dish details',
        data: null
      });
    });
  });
  
  describe('getDishesByIds', () => {
    it('should fetch multiple dishes by IDs', async () => {
      // Mock the API response
      const mockResponse = {
        data: [
          { id: '1', name: 'Dish 1', price: 9.99 },
          { id: '2', name: 'Dish 2', price: 14.99 }
        ]
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.getDishesByIds(['1', '2']);
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/dishes/batch',
        params: { ids: '1,2' }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Dishes retrieved successfully'
      });
    });
    
    it('should return error for invalid dish IDs', async () => {
      // Call the method with invalid IDs
      const result = await service.getDishesByIds([]);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid dish IDs',
        data: []
      });
    });
  });
  
  describe('getDishesByRestaurantId', () => {
    it('should fetch dishes by restaurant ID', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          dishes: [
            { id: '1', name: 'Dish 1', restaurantId: '5' },
            { id: '2', name: 'Dish 2', restaurantId: '5' }
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
      const result = await service.getDishesByRestaurantId('5');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/dishes',
        params: {
          restaurantId: '5',
          page: 1,
          limit: 20
        }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Dishes retrieved successfully'
      });
    });
    
    it('should return error for invalid restaurant ID', async () => {
      // Call the method with invalid ID
      const result = await service.getDishesByRestaurantId(null);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid restaurant ID',
        data: {
          dishes: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
        }
      });
    });
  });
  
  describe('createDish', () => {
    it('should create a new dish', async () => {
      // Mock dish data
      const dishData = {
        name: 'New Dish',
        description: 'A delicious new dish',
        price: 15.99,
        restaurantId: '5'
      };
      
      // Mock the API response
      const mockResponse = {
        data: {
          id: '3',
          ...dishData,
          createdAt: '2023-01-01T00:00:00Z'
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.createDish(dishData);
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'post',
        url: '/dishes',
        data: dishData
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Dish created successfully'
      });
    });
    
    it('should validate required fields', async () => {
      // Call the method with missing name
      const result = await service.createDish({ restaurantId: '5' });
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Dish name is required',
        data: null
      });
    });
    
    it('should validate restaurant ID', async () => {
      // Call the method with missing restaurant ID
      const result = await service.createDish({ name: 'Test Dish' });
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Valid restaurant ID is required',
        data: null
      });
    });
  });
  
  describe('updateDish', () => {
    it('should update an existing dish', async () => {
      // Mock update data
      const dishId = '1';
      const updateData = {
        name: 'Updated Dish',
        price: 17.99
      };
      
      // Mock the API response
      const mockResponse = {
        data: {
          id: dishId,
          name: 'Updated Dish',
          description: 'A delicious test dish',
          price: 17.99,
          restaurantId: '5',
          updatedAt: '2023-01-02T00:00:00Z'
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.updateDish(dishId, updateData);
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'put',
        url: '/dishes/1',
        data: updateData
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Dish updated successfully'
      });
    });
    
    it('should return error for invalid dish ID', async () => {
      // Call the method with invalid ID
      const result = await service.updateDish(null, { name: 'Test' });
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid dish ID',
        data: null
      });
    });
  });
  
  describe('deleteDish', () => {
    it('should delete a dish', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          success: true
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.deleteDish('1');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'delete',
        url: '/dishes/1'
      });
      
      expect(result).toEqual({
        success: true,
        message: 'Dish deleted successfully'
      });
    });
    
    it('should return error for invalid dish ID', async () => {
      // Call the method with invalid ID
      const result = await service.deleteDish(null);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid dish ID'
      });
    });
  });
  
  describe('getFeaturedDishes', () => {
    it('should fetch featured dishes with default parameters', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          dishes: [
            { id: '1', name: 'Featured Dish 1', featured: true },
            { id: '2', name: 'Featured Dish 2', featured: true }
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
      const result = await service.getFeaturedDishes();
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/dishes/featured',
        params: { limit: 10, page: 1 }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Featured dishes retrieved successfully'
      });
    });
    
    it('should fetch featured dishes with custom parameters', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          dishes: [
            { id: '1', name: 'Featured Dish 1', featured: true }
          ],
          pagination: {
            page: 2,
            limit: 5,
            total: 6,
            totalPages: 2
          }
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method with custom parameters
      const result = await service.getFeaturedDishes({ limit: 5, page: 2 });
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/dishes/featured',
        params: { limit: 5, page: 2 }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Featured dishes retrieved successfully'
      });
    });
  });
});
