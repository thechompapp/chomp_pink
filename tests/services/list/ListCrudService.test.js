/**
 * ListCrudService Tests
 * 
 * Tests for the ListCrudService class that handles CRUD operations for lists.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ListCrudService } from '@/services/list/ListCrudService';
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

describe('ListCrudService', () => {
  let service;
  
  beforeEach(() => {
    // Create a new instance of the service for each test
    service = new ListCrudService();
    
    // Reset the mock API client
    vi.clearAllMocks();
  });
  
  describe('getLists', () => {
    it('should fetch lists with default parameters', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          lists: [
            { id: '1', name: 'List 1' },
            { id: '2', name: 'List 2' }
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
      const result = await service.getLists();
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/lists',
        params: { page: 1, limit: 10 }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Lists retrieved successfully'
      });
    });
    
    it('should fetch lists with custom parameters', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          lists: [
            { id: '1', name: 'List 1' }
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
      const params = {
        page: 2,
        limit: 5,
        userId: '123',
        isPublic: true
      };
      
      // Call the method
      const result = await service.getLists(params);
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/lists',
        params
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Lists retrieved successfully'
      });
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock the API error
      const mockError = new Error('Network error');
      apiClient.mockRejectedValueOnce(mockError);
      
      // Call the method
      const result = await service.getLists();
      
      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Failed to retrieve lists',
        data: {
          lists: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
          }
        }
      });
    });
  });
  
  describe('getList', () => {
    it('should fetch a single list by ID', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          id: '1',
          name: 'List 1',
          description: 'Test list',
          items: [
            { id: '101', name: 'Item 1' },
            { id: '102', name: 'Item 2' }
          ]
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.getList('1');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/lists/1'
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'List retrieved successfully'
      });
    });
    
    it('should return error for invalid list ID', async () => {
      // Call the method with invalid ID
      const result = await service.getList(null);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid list ID',
        data: null
      });
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock the API error
      const mockError = new Error('Network error');
      apiClient.mockRejectedValueOnce(mockError);
      
      // Call the method
      const result = await service.getList('1');
      
      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Failed to retrieve list',
        data: null
      });
    });
  });
  
  describe('createList', () => {
    it('should create a new list', async () => {
      // Mock list data
      const listData = {
        name: 'New List',
        description: 'A new test list',
        isPublic: true
      };
      
      // Mock the API response
      const mockResponse = {
        data: {
          id: '3',
          ...listData,
          createdAt: '2023-01-01T00:00:00Z'
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.createList(listData);
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'post',
        url: '/lists',
        data: listData
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'List created successfully'
      });
    });
    
    it('should validate required fields', async () => {
      // Call the method with missing name
      const result = await service.createList({ description: 'Missing name' });
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'List name is required',
        data: null
      });
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock list data
      const listData = {
        name: 'New List',
        description: 'A new test list'
      };
      
      // Mock the API error
      const mockError = new Error('Network error');
      apiClient.mockRejectedValueOnce(mockError);
      
      // Call the method
      const result = await service.createList(listData);
      
      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Failed to create list',
        data: null
      });
    });
  });
  
  describe('updateList', () => {
    it('should update an existing list', async () => {
      // Mock list data
      const listId = '1';
      const updateData = {
        name: 'Updated List',
        description: 'An updated test list'
      };
      
      // Mock the API response
      const mockResponse = {
        data: {
          id: listId,
          ...updateData,
          updatedAt: '2023-01-02T00:00:00Z'
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.updateList(listId, updateData);
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'put',
        url: '/lists/1',
        data: updateData
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'List updated successfully'
      });
    });
    
    it('should return error for invalid list ID', async () => {
      // Call the method with invalid ID
      const result = await service.updateList(null, { name: 'Test' });
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid list ID',
        data: null
      });
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock the API error
      const mockError = new Error('Network error');
      apiClient.mockRejectedValueOnce(mockError);
      
      // Call the method
      const result = await service.updateList('1', { name: 'Test' });
      
      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Failed to update list',
        data: null
      });
    });
  });
  
  describe('deleteList', () => {
    it('should delete a list', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          success: true
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.deleteList('1');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'delete',
        url: '/lists/1'
      });
      
      expect(result).toEqual({
        success: true,
        message: 'List deleted successfully'
      });
    });
    
    it('should return error for invalid list ID', async () => {
      // Call the method with invalid ID
      const result = await service.deleteList(null);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid list ID'
      });
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock the API error
      const mockError = new Error('Network error');
      apiClient.mockRejectedValueOnce(mockError);
      
      // Call the method
      const result = await service.deleteList('1');
      
      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Failed to delete list'
      });
    });
  });
  
  describe('getPublicLists', () => {
    it('should fetch public lists with default parameters', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          lists: [
            { id: '1', name: 'Public List 1', isPublic: true },
            { id: '2', name: 'Public List 2', isPublic: true }
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
      const result = await service.getPublicLists();
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/lists/public',
        params: { page: 1, limit: 10 }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: 'Public lists retrieved successfully'
      });
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock the API error
      const mockError = new Error('Network error');
      apiClient.mockRejectedValueOnce(mockError);
      
      // Call the method
      const result = await service.getPublicLists();
      
      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Failed to retrieve public lists',
        data: {
          lists: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0
          }
        }
      });
    });
  });
});
