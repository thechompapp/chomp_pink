/**
 * Unified List Service Tests
 * 
 * Tests for the unified list service that provides backward compatibility
 * while using the new modular services internally.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { listService } from '@/services/list';
import { listCrudService } from '@/services/list/ListCrudService';
import { listItemService } from '@/services/list/ListItemService';
import { listSharingService } from '@/services/list/ListSharingService';
import { listSearchService } from '@/services/list/ListSearchService';

// Mock the individual services
vi.mock('@/services/list/ListCrudService', () => ({
  listCrudService: {
    getLists: vi.fn(),
    getList: vi.fn(),
    createList: vi.fn(),
    updateList: vi.fn(),
    deleteList: vi.fn(),
    getPublicLists: vi.fn(),
    getFeaturedLists: vi.fn(),
    getMultipleListSummary: vi.fn(),
    duplicateList: vi.fn()
  }
}));

vi.mock('@/services/list/ListItemService', () => ({
  listItemService: {
    getListItems: vi.fn(),
    addItemToList: vi.fn(),
    updateListItem: vi.fn(),
    deleteListItem: vi.fn(),
    addItemsToListBulk: vi.fn(),
    reorderListItems: vi.fn(),
    addDishToMultipleLists: vi.fn(),
    addRestaurantToMultipleLists: vi.fn(),
    getListsContainingDish: vi.fn(),
    getListsContainingRestaurant: vi.fn(),
    getMultipleListItemsDetails: vi.fn()
  }
}));

vi.mock('@/services/list/ListSharingService', () => ({
  listSharingService: {
    getFollowedLists: vi.fn(),
    followList: vi.fn(),
    unfollowList: vi.fn(),
    toggleFollowList: vi.fn(),
    checkFollowStatus: vi.fn(),
    getShareableListLink: vi.fn(),
    getCollaboratingLists: vi.fn(),
    addCollaboratorToList: vi.fn(),
    removeCollaboratorFromList: vi.fn(),
    updateCollaboratorRole: vi.fn(),
    getListCollaborators: vi.fn(),
    mergeLists: vi.fn()
  }
}));

vi.mock('@/services/list/ListSearchService', () => ({
  listSearchService: {
    searchLists: vi.fn(),
    getListSuggestions: vi.fn(),
    getUserLists: vi.fn(),
    getRecentListsForUser: vi.fn(),
    getListActivity: vi.fn()
  }
}));

// Mock the logger
vi.mock('@/utils/logger', () => ({
  logDebug: vi.fn(),
  logError: vi.fn(),
  logInfo: vi.fn()
}));

describe('Unified List Service', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
  });
  
  describe('CRUD operations', () => {
    it('should delegate getLists to listCrudService', async () => {
      // Mock response
      const mockResponse = { success: true, data: [] };
      listCrudService.getLists.mockResolvedValueOnce(mockResponse);
      
      // Call the unified service
      const params = { page: 1, limit: 10 };
      const result = await listService.getLists(params);
      
      // Assertions
      expect(listCrudService.getLists).toHaveBeenCalledWith(params);
      expect(result).toBe(mockResponse);
    });
    
    it('should delegate getList to listCrudService', async () => {
      // Mock response
      const mockResponse = { success: true, data: { id: '1', name: 'Test List' } };
      listCrudService.getList.mockResolvedValueOnce(mockResponse);
      
      // Call the unified service
      const result = await listService.getList('1');
      
      // Assertions
      expect(listCrudService.getList).toHaveBeenCalledWith('1');
      expect(result).toBe(mockResponse);
    });
    
    it('should delegate createList to listCrudService', async () => {
      // Mock response
      const mockResponse = { success: true, data: { id: '1', name: 'New List' } };
      listCrudService.createList.mockResolvedValueOnce(mockResponse);
      
      // List data
      const listData = { name: 'New List', description: 'Test description' };
      
      // Call the unified service
      const result = await listService.createList(listData);
      
      // Assertions
      expect(listCrudService.createList).toHaveBeenCalledWith(listData);
      expect(result).toBe(mockResponse);
    });
  });
  
  describe('Item operations', () => {
    it('should delegate addItemToList to listItemService', async () => {
      // Mock response
      const mockResponse = { success: true, data: { id: '101' } };
      listItemService.addItemToList.mockResolvedValueOnce(mockResponse);
      
      // Item data
      const listId = '1';
      const itemData = { name: 'Test Item', type: 'restaurant', restaurant_id: '123' };
      
      // Call the unified service
      const result = await listService.addItemToList(listId, itemData);
      
      // Assertions
      expect(listItemService.addItemToList).toHaveBeenCalledWith(listId, itemData);
      expect(result).toBe(mockResponse);
    });
    
    it('should delegate getListItems to listItemService', async () => {
      // Mock response
      const mockResponse = { success: true, data: [] };
      listItemService.getListItems.mockResolvedValueOnce(mockResponse);
      
      // Call the unified service
      const result = await listService.getListItems('1');
      
      // Assertions
      expect(listItemService.getListItems).toHaveBeenCalledWith('1');
      expect(result).toBe(mockResponse);
    });
    
    it('should delegate addItemsToListBulk to listItemService', async () => {
      // Mock response
      const mockResponse = { success: true, data: { added: 2 } };
      listItemService.addItemsToListBulk.mockResolvedValueOnce(mockResponse);
      
      // Bulk data
      const listId = '1';
      const items = [
        { name: 'Item 1', type: 'restaurant', restaurant_id: '123' },
        { name: 'Item 2', type: 'dish', dish_id: '456' }
      ];
      
      // Call the unified service
      const result = await listService.addItemsToListBulk(listId, items);
      
      // Assertions
      expect(listItemService.addItemsToListBulk).toHaveBeenCalledWith(listId, items);
      expect(result).toBe(mockResponse);
    });
  });
  
  describe('Sharing operations', () => {
    it('should delegate followList to listSharingService', async () => {
      // Mock response
      const mockResponse = { success: true, data: { isFollowing: true } };
      listSharingService.followList.mockResolvedValueOnce(mockResponse);
      
      // Call the unified service
      const result = await listService.followList('1');
      
      // Assertions
      expect(listSharingService.followList).toHaveBeenCalledWith('1');
      expect(result).toBe(mockResponse);
    });
    
    it('should delegate unfollowList to listSharingService', async () => {
      // Mock response
      const mockResponse = { success: true, data: { isFollowing: false } };
      listSharingService.unfollowList.mockResolvedValueOnce(mockResponse);
      
      // Call the unified service
      const result = await listService.unfollowList('1');
      
      // Assertions
      expect(listSharingService.unfollowList).toHaveBeenCalledWith('1');
      expect(result).toBe(mockResponse);
    });
    
    it('should delegate handleFollowList to listSharingService.toggleFollowList', async () => {
      // Mock response
      const mockResponse = { success: true, data: { isFollowing: true } };
      listSharingService.toggleFollowList.mockResolvedValueOnce(mockResponse);
      
      // Call the unified service
      const result = await listService.handleFollowList('1');
      
      // Assertions
      expect(listSharingService.toggleFollowList).toHaveBeenCalledWith('1');
      expect(result).toBe(mockResponse);
    });
  });
  
  describe('Search operations', () => {
    it('should delegate searchLists to listSearchService', async () => {
      // Mock response
      const mockResponse = { success: true, data: [] };
      listSearchService.searchLists.mockResolvedValueOnce(mockResponse);
      
      // Call the unified service
      const result = await listService.searchLists('pizza', 'all', { page: 1, limit: 10 });
      
      // Assertions
      expect(listSearchService.searchLists).toHaveBeenCalledWith('pizza', 'all', { page: 1, limit: 10 });
      expect(result).toBe(mockResponse);
    });
    
    it('should delegate getUserLists to listSearchService', async () => {
      // Mock response
      const mockResponse = { success: true, data: [] };
      listSearchService.getUserLists.mockResolvedValueOnce(mockResponse);
      
      // Call the unified service
      const result = await listService.getUserLists('user123', { page: 1, limit: 10 });
      
      // Assertions
      expect(listSearchService.getUserLists).toHaveBeenCalledWith('user123', { page: 1, limit: 10 });
      expect(result).toBe(mockResponse);
    });
    
    it('should delegate getListSuggestions to listSearchService', async () => {
      // Mock response
      const mockResponse = { success: true, suggestions: [] };
      listSearchService.getListSuggestions.mockResolvedValueOnce(mockResponse);
      
      // Call the unified service
      const result = await listService.getListSuggestions('pizza', { limit: 5 });
      
      // Assertions
      expect(listSearchService.getListSuggestions).toHaveBeenCalledWith('pizza', { limit: 5 });
      expect(result).toBe(mockResponse);
    });
  });
});
