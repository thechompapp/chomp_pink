/**
 * ListSearchService Tests
 * 
 * Tests for the ListSearchService class that handles search operations for lists.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ListSearchService } from '@/services/list/ListSearchService';
import { apiClient } from '@/services/apiClient';

// Mock the API client
vi.mock('@/services/apiClient', () => ({
  apiClient: vi.fn()
}));

// Mock the logger
vi.mock('@/utils/logger', () => ({
  logDebug: vi.fn(),
  logError: vi.fn(),
  logInfo: vi.fn()
}));

describe('ListSearchService', () => {
  let service;
  
  beforeEach(() => {
    // Create a new instance of the service for each test
    service = new ListSearchService();
    
    // Reset the mock API client
    vi.clearAllMocks();
  });
  
  describe('searchLists', () => {
    it('should search lists with default parameters', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          lists: [
            { id: '1', name: 'Pizza List' },
            { id: '2', name: 'Italian Pizza Places' }
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
      const result = await service.searchLists('pizza');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/lists/search',
        params: {
          searchTerm: 'pizza',
          searchType: 'all',
          page: 1,
          limit: 20
        }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data.lists,
        pagination: mockResponse.data.pagination,
        message: 'Search completed successfully'
      });
    });
    
    it('should search lists with custom parameters', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          lists: [
            { id: '1', name: 'Best Burgers' }
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
      
      // Custom parameters
      const options = {
        page: 2,
        limit: 5,
        userId: '123',
        cityId: '456',
        includePrivate: true
      };
      
      // Call the method
      const result = await service.searchLists('burger', 'dish', options);
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/lists/search',
        params: {
          searchTerm: 'burger',
          searchType: 'dish',
          page: 2,
          limit: 5,
          userId: '123',
          cityId: '456',
          includePrivate: true
        }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data.lists,
        pagination: mockResponse.data.pagination,
        message: 'Search completed successfully'
      });
    });
    
    it('should return error for missing search term', async () => {
      // Call the method with empty search term
      const result = await service.searchLists('');
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Search term is required',
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      });
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock the API error
      const mockError = new Error('Network error');
      apiClient.mockRejectedValueOnce(mockError);
      
      // Call the method
      const result = await service.searchLists('pizza');
      
      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Failed to search lists',
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      });
    });
  });
  
  describe('getListSuggestions', () => {
    it('should get list suggestions for a query', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          suggestions: [
            { id: '1', name: 'Pizza Places' },
            { id: '2', name: 'Best Pizza in NYC' }
          ]
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.getListSuggestions('pizza');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/lists/suggestions',
        params: {
          query: 'pizza',
          limit: 5
        }
      });
      
      expect(result).toEqual({
        success: true,
        suggestions: mockResponse.data.suggestions
      });
    });
    
    it('should get list suggestions with custom parameters', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          suggestions: [
            { id: '1', name: 'Italian Restaurants' }
          ]
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Custom parameters
      const options = {
        limit: 3,
        listType: 'restaurants',
        forUserId: '123'
      };
      
      // Call the method
      const result = await service.getListSuggestions('italian', options);
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/lists/suggestions',
        params: {
          query: 'italian',
          limit: 3,
          listType: 'restaurants',
          forUserId: '123'
        }
      });
      
      expect(result).toEqual({
        success: true,
        suggestions: mockResponse.data.suggestions
      });
    });
    
    it('should return error for missing query', async () => {
      // Call the method with empty query
      const result = await service.getListSuggestions('');
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Query is required',
        suggestions: []
      });
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock the API error
      const mockError = new Error('Network error');
      apiClient.mockRejectedValueOnce(mockError);
      
      // Call the method
      const result = await service.getListSuggestions('pizza');
      
      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Failed to get list suggestions',
        suggestions: []
      });
    });
  });
  
  describe('getRecentListsForUser', () => {
    it('should get recent lists for a user', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          lists: [
            { id: '1', name: 'Recent List 1', lastViewed: '2023-01-02T00:00:00Z' },
            { id: '2', name: 'Recent List 2', lastViewed: '2023-01-01T00:00:00Z' }
          ]
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.getRecentListsForUser('user123');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/lists/recent',
        params: {
          userId: 'user123',
          limit: 5,
          sortBy: 'lastViewed',
          sortOrder: 'desc'
        }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data.lists
      });
    });
    
    it('should get recent lists with custom limit', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          lists: [
            { id: '1', name: 'Recent List 1', lastViewed: '2023-01-02T00:00:00Z' },
            { id: '2', name: 'Recent List 2', lastViewed: '2023-01-01T00:00:00Z' },
            { id: '3', name: 'Recent List 3', lastViewed: '2022-12-31T00:00:00Z' }
          ]
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method with custom limit
      const result = await service.getRecentListsForUser('user123', { limit: 3 });
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/lists/recent',
        params: {
          userId: 'user123',
          limit: 3,
          sortBy: 'lastViewed',
          sortOrder: 'desc'
        }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data.lists
      });
    });
    
    it('should return error for invalid user ID', async () => {
      // Call the method with invalid ID
      const result = await service.getRecentListsForUser(null);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid user ID',
        data: []
      });
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock the API error
      const mockError = new Error('Network error');
      apiClient.mockRejectedValueOnce(mockError);
      
      // Call the method
      const result = await service.getRecentListsForUser('user123');
      
      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Failed to get recent lists',
        data: []
      });
    });
  });
  
  describe('getListActivity', () => {
    it('should get activity for a list', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          activities: [
            { id: '1', type: 'item_added', user: { name: 'User 1' }, timestamp: '2023-01-02T00:00:00Z' },
            { id: '2', type: 'list_updated', user: { name: 'User 2' }, timestamp: '2023-01-01T00:00:00Z' }
          ],
          pagination: {
            page: 1,
            limit: 15,
            total: 2,
            totalPages: 1
          }
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.getListActivity('list123');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/lists/list123/activity',
        params: {
          page: 1,
          limit: 15
        }
      });
      
      expect(result).toEqual({
        success: true,
        activities: mockResponse.data.activities,
        pagination: mockResponse.data.pagination
      });
    });
    
    it('should get activity with custom pagination', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          activities: [
            { id: '3', type: 'item_removed', user: { name: 'User 1' }, timestamp: '2022-12-31T00:00:00Z' }
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
      
      // Call the method with custom pagination
      const result = await service.getListActivity('list123', { page: 2, limit: 5 });
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/lists/list123/activity',
        params: {
          page: 2,
          limit: 5
        }
      });
      
      expect(result).toEqual({
        success: true,
        activities: mockResponse.data.activities,
        pagination: mockResponse.data.pagination
      });
    });
    
    it('should return error for invalid list ID', async () => {
      // Call the method with invalid ID
      const result = await service.getListActivity(null);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid list ID',
        activities: []
      });
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock the API error
      const mockError = new Error('Network error');
      apiClient.mockRejectedValueOnce(mockError);
      
      // Call the method
      const result = await service.getListActivity('list123');
      
      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Failed to get list activity',
        activities: []
      });
    });
  });
  
  describe('getUserLists', () => {
    it('should get user lists with string user ID', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          lists: [
            { id: '1', name: 'User List 1' },
            { id: '2', name: 'User List 2' }
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
      
      // Call the method with string user ID
      const result = await service.getUserLists('user123');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/lists',
        params: {
          userId: 'user123',
          page: 1,
          limit: 10
        }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data.lists,
        pagination: mockResponse.data.pagination,
        message: 'Lists retrieved successfully'
      });
    });
    
    it('should get user lists with params object', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          lists: [
            { id: '1', name: 'User List 1' }
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
      
      // Call the method with params object
      const result = await service.getUserLists({
        userId: 'user123',
        page: 2,
        limit: 5,
        isPublic: true
      });
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/lists',
        params: {
          userId: 'user123',
          page: 2,
          limit: 5,
          isPublic: true
        }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data.lists,
        pagination: mockResponse.data.pagination,
        message: 'Lists retrieved successfully'
      });
    });
    
    it('should return error for invalid parameters', async () => {
      // Call the method with invalid parameters
      const result = await service.getUserLists(123); // Not a string or object
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid user ID or parameters',
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      });
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock the API error
      const mockError = new Error('Network error');
      apiClient.mockRejectedValueOnce(mockError);
      
      // Call the method
      const result = await service.getUserLists('user123');
      
      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Failed to get user lists',
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      });
    });
  });
});
