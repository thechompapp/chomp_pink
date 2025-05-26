/**
 * ListSharingService Tests
 * 
 * Tests for the ListSharingService class that handles sharing, following, and collaboration.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ListSharingService } from '@/services/list/ListSharingService';
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

// Mock the engagement logger
vi.mock('@/utils/logEngagement', () => ({
  logEngagement: vi.fn()
}));

describe('ListSharingService', () => {
  let service;
  
  beforeEach(() => {
    // Create a new instance of the service for each test
    service = new ListSharingService();
    
    // Reset the mock API client
    vi.clearAllMocks();
  });
  
  describe('getFollowedLists', () => {
    it('should fetch lists followed by a user', async () => {
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
      const result = await service.getFollowedLists('user123');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/lists',
        params: {
          isFollowedByUserId: 'user123',
          page: 1,
          limit: 10
        }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: expect.any(String)
      });
    });
    
    it('should return error for invalid user ID', async () => {
      // Call the method with invalid ID
      const result = await service.getFollowedLists(null);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid user ID'
      });
    });
  });
  
  describe('followList', () => {
    it('should follow a list', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          success: true,
          isFollowing: true
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.followList('list123');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'post',
        url: '/lists/list123/follow'
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: expect.any(String)
      });
    });
    
    it('should return error for invalid list ID', async () => {
      // Call the method with invalid ID
      const result = await service.followList(null);
      
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
      const result = await service.followList('list123');
      
      // Assertions
      expect(result).toEqual({
        success: false,
        message: 'Failed to follow list'
      });
    });
  });
  
  describe('unfollowList', () => {
    it('should unfollow a list', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          success: true,
          isFollowing: false
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.unfollowList('list123');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'delete',
        url: '/lists/list123/follow'
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: expect.any(String)
      });
    });
    
    it('should return error for invalid list ID', async () => {
      // Call the method with invalid ID
      const result = await service.unfollowList(null);
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid list ID'
      });
    });
  });
  
  describe('toggleFollowList', () => {
    it('should follow a list if not currently following', async () => {
      // Mock the check status response
      const checkStatusResponse = {
        data: {
          isFollowing: false
        }
      };
      
      // Mock the follow response
      const followResponse = {
        data: {
          success: true,
          isFollowing: true
        }
      };
      
      // Set up the API client mock to return the responses in sequence
      apiClient.mockResolvedValueOnce(checkStatusResponse); // For checkFollowStatus
      apiClient.mockResolvedValueOnce(followResponse); // For followList
      
      // Call the method
      const result = await service.toggleFollowList('list123');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledTimes(2);
      expect(apiClient).toHaveBeenNthCalledWith(1, {
        method: 'get',
        url: '/lists/list123/follow/status',
        params: {}
      });
      expect(apiClient).toHaveBeenNthCalledWith(2, {
        method: 'post',
        url: '/lists/list123/follow'
      });
      
      expect(result).toEqual({
        success: true,
        data: followResponse.data,
        message: expect.any(String)
      });
    });
    
    it('should unfollow a list if currently following', async () => {
      // Mock the check status response
      const checkStatusResponse = {
        data: {
          isFollowing: true
        }
      };
      
      // Mock the unfollow response
      const unfollowResponse = {
        data: {
          success: true,
          isFollowing: false
        }
      };
      
      // Set up the API client mock to return the responses in sequence
      apiClient.mockResolvedValueOnce(checkStatusResponse); // For checkFollowStatus
      apiClient.mockResolvedValueOnce(unfollowResponse); // For unfollowList
      
      // Call the method
      const result = await service.toggleFollowList('list123');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledTimes(2);
      expect(apiClient).toHaveBeenNthCalledWith(1, {
        method: 'get',
        url: '/lists/list123/follow/status',
        params: {}
      });
      expect(apiClient).toHaveBeenNthCalledWith(2, {
        method: 'delete',
        url: '/lists/list123/follow'
      });
      
      expect(result).toEqual({
        success: true,
        data: unfollowResponse.data,
        message: expect.any(String)
      });
    });
  });
  
  describe('checkFollowStatus', () => {
    it('should check if a user follows a list', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          isFollowing: true
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.checkFollowStatus('list123');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/lists/list123/follow/status',
        params: {}
      });
      
      expect(result).toEqual({
        success: true,
        isFollowing: true
      });
    });
    
    it('should check if a specific user follows a list', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          isFollowing: false
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method with a specific user ID
      const result = await service.checkFollowStatus('list123', 'user456');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/lists/list123/follow/status',
        params: { userId: 'user456' }
      });
      
      expect(result).toEqual({
        success: true,
        isFollowing: false
      });
    });
  });
  
  describe('getShareableListLink', () => {
    it('should generate a shareable link for a list', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          url: 'https://chomp.app/share/abc123',
          expiresAt: '2023-12-31T23:59:59Z'
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Share options
      const shareOptions = {
        generateShortLink: true,
        expiresIn: '7d',
        trackClicks: true
      };
      
      // Call the method
      const result = await service.getShareableListLink('list123', shareOptions);
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'post',
        url: '/lists/list123/share',
        data: shareOptions
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: expect.any(String)
      });
    });
  });
  
  describe('getListCollaborators', () => {
    it('should fetch collaborators for a list', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          collaborators: [
            { userId: 'user1', role: 'editor', name: 'User One' },
            { userId: 'user2', role: 'viewer', name: 'User Two' }
          ]
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.getListCollaborators('list123');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'get',
        url: '/lists/list123/collaborators'
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: expect.any(String)
      });
    });
  });
  
  describe('addCollaboratorToList', () => {
    it('should add a collaborator to a list', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          success: true,
          collaborator: {
            userId: 'user456',
            role: 'editor',
            name: 'New Collaborator'
          }
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.addCollaboratorToList('list123', 'user456', 'editor');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'post',
        url: '/lists/list123/collaborators',
        data: {
          userId: 'user456',
          role: 'editor'
        }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: expect.any(String)
      });
    });
    
    it('should validate IDs', async () => {
      // Call the method with invalid IDs
      const result = await service.addCollaboratorToList(null, 'user456');
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid list ID or user ID'
      });
    });
  });
  
  describe('removeCollaboratorFromList', () => {
    it('should remove a collaborator from a list', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          success: true
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.removeCollaboratorFromList('list123', 'user456');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'delete',
        url: '/lists/list123/collaborators/user456'
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: expect.any(String)
      });
    });
  });
  
  describe('updateCollaboratorRole', () => {
    it('should update a collaborator\'s role', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          success: true,
          collaborator: {
            userId: 'user456',
            role: 'viewer',
            name: 'Updated Collaborator'
          }
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Call the method
      const result = await service.updateCollaboratorRole('list123', 'user456', 'viewer');
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'put',
        url: '/lists/list123/collaborators/user456',
        data: {
          role: 'viewer'
        }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: expect.any(String)
      });
    });
    
    it('should validate role', async () => {
      // Call the method with missing role
      const result = await service.updateCollaboratorRole('list123', 'user456', '');
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Role is required'
      });
    });
  });
  
  describe('mergeLists', () => {
    it('should merge two lists', async () => {
      // Mock the API response
      const mockResponse = {
        data: {
          success: true,
          targetList: {
            id: 'target123',
            name: 'Merged List',
            itemCount: 10
          }
        }
      };
      
      // Set up the API client mock to return the mock response
      apiClient.mockResolvedValueOnce(mockResponse);
      
      // Merge options
      const options = {
        deleteSourceList: true,
        conflictResolution: 'keep_both'
      };
      
      // Call the method
      const result = await service.mergeLists('source123', 'target123', options);
      
      // Assertions
      expect(apiClient).toHaveBeenCalledWith({
        method: 'post',
        url: '/lists/merge',
        data: {
          sourceListId: 'source123',
          targetListId: 'target123',
          deleteSourceList: true,
          conflictResolution: 'keep_both'
        }
      });
      
      expect(result).toEqual({
        success: true,
        data: mockResponse.data,
        message: expect.any(String)
      });
    });
    
    it('should validate list IDs', async () => {
      // Call the method with invalid IDs
      const result = await service.mergeLists(null, 'target123');
      
      // Assertions
      expect(apiClient).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        message: 'Invalid source or target list ID'
      });
    });
  });
});
