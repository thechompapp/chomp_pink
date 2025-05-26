/**
 * RestaurantCrudService Tests
 * 
 * Tests for the RestaurantCrudService class that handles CRUD operations for restaurants.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RestaurantCrudService } from '@/services/restaurant/RestaurantCrudService';
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

describe('RestaurantCrudService', () => {
  let service;
  
  beforeEach(() => {
    // Create a new instance of the service for each test
    service = new RestaurantCrudService();
    
    // Reset the mock API client
    vi.clearAllMocks();
  });
  
  describe('getRestaurantDetails', () => {
    it('should fetch restaurant details by ID', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          id: '1',
          name: 'Test Restaurant',
          cuisine: 'Italian',
          address: '123 Main St',
          rating: 4.5
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.getRestaurantDetails('1');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/restaurants/1'
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Restaurant details retrieved successfully'
      });
    });
    
    it('should return error for invalid restaurant ID', async () => {
      // Call the method with invalid ID
      const result = await service.getRestaurantDetails(null);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid restaurant ID',
        data: null
      });
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock the API error
      const mockError = new Error('Network error');
      apiClient.mockRejectedValueOnce(mockError);
      
      // Call the method
      const result = await service.getRestaurantDetails('1');
      
      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Failed to retrieve restaurant details',
        data: null
      });
    });
  });
  
  describe('getRestaurantById', () => {
    it('should be an alias for getRestaurantDetails', async () => {
      // Mock the getRestaurantDetails method
      const spy = vi.spyOn(service, 'getRestaurantDetails');
      
      // Set up a mock response
      const mockResponse = {
        success: true,
        data: { id: '1', name: 'Test Restaurant' },
        message: 'Restaurant details retrieved successfully'
      };
      
      spy.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.getRestaurantById('1');
      
      // Assertions
      expect(spy).toHaveBeenCalledWith('1');
      expect(result).toBe(mockResponse);
      
      // Restore the original method
      spy.mockRestore();
    });
  });
  
  describe('getRestaurantsByIds', () => {
    it('should fetch multiple restaurants by IDs', async () => {
      // Mock the API response
      const mockResponse = {
        data: [
          { id: '1', name: 'Restaurant 1' },
          { id: '2', name: 'Restaurant 2' }
        ]
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.getRestaurantsByIds(['1', '2']);
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/restaurants/batch',
        params: { ids: '1,2' }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Restaurants retrieved successfully'
      });
    });
    
    it('should return error for invalid restaurant IDs', async () => {
      // Call the method with invalid IDs
      const result = await service.getRestaurantsByIds([]);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid restaurant IDs',
        data: []
      });
    });
    
    it('should filter out invalid IDs', async () => {
      // Mock the API response
      const mockResponse = {
        data: [
          { id: '1', name: 'Restaurant 1' }
        ]
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method with a mix of valid and invalid IDs
      const result = await service.getRestaurantsByIds(['1', null, undefined, '']);
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/restaurants/batch',
        params: { ids: '1' }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Restaurants retrieved successfully'
      });
    });
  });
  
  describe('createRestaurant', () => {
    it('should create a new restaurant', async () => {
      // Mock restaurant data
      const restaurantData = {
        name: 'New Restaurant',
        cuisine: 'Italian',
        address: '123 Main St',
        phone: '555-1234'
      };
      
      // Mock the API response
      const mockResponse = {
        data: {
          id: '3',
          ...restaurantData,
          createdAt: '2023-01-01T00:00:00Z'
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.createRestaurant(restaurantData);
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'post',
        url: '/restaurants',
        data: restaurantData
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Restaurant created successfully'
      });
    });
    
    it('should validate required fields', async () => {
      // Call the method with missing name
      const result = await service.createRestaurant({ cuisine: 'Italian' });
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Restaurant name is required',
        data: null
      });
    });
  });
  
  describe('updateRestaurant', () => {
    it('should update an existing restaurant', async () => {
      // Mock update data
      const restaurantId = '1';
      const updateData = {
        name: 'Updated Restaurant',
        cuisine: 'French'
      };
      
      // Mock the API response
      const mockResponse = {
        data: {
          id: restaurantId,
          ...updateData,
          updatedAt: '2023-01-02T00:00:00Z'
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.updateRestaurant(restaurantId, updateData);
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'put',
        url: '/restaurants/1',
        data: updateData
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Restaurant updated successfully'
      });
    });
    
    it('should return error for invalid restaurant ID', async () => {
      // Call the method with invalid ID
      const result = await service.updateRestaurant(null, { name: 'Test' });
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid restaurant ID',
        data: null
      });
    });
  });
  
  describe('deleteRestaurant', () => {
    it('should delete a restaurant', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          success: true
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.deleteRestaurant('1');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'delete',
        url: '/restaurants/1'
      });
      
      expect(result).toEqual({
        success: true,
        message: 'Restaurant deleted successfully'
      });
    });
    
    it('should return error for invalid restaurant ID', async () => {
      // Call the method with invalid ID
      const result = await service.deleteRestaurant(null);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid restaurant ID'
      });
    });
  });
  
  describe('getFeaturedRestaurants', () => {
    it('should fetch featured restaurants with default parameters', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          restaurants: [
            { id: '1', name: 'Featured Restaurant 1', featured: true },
            { id: '2', name: 'Featured Restaurant 2', featured: true }
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
      const result = await service.getFeaturedRestaurants();
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/restaurants/featured',
        params: { limit: 10, page: 1 }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Featured restaurants retrieved successfully'
      });
    });
    
    it('should fetch featured restaurants with custom parameters', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          restaurants: [
            { id: '1', name: 'Featured Restaurant 1', featured: true }
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
      const result = await service.getFeaturedRestaurants({ limit: 5, page: 2 });
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/restaurants/featured',
        params: { limit: 5, page: 2 }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Featured restaurants retrieved successfully'
      });
    });
  });
});
