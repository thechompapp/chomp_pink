// Filename: /src/services/listService.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import listService from './listService'; // Adjust path if needed
import apiClient from './apiClient'; // To mock

// Mock the apiClient completely
vi.mock('./apiClient', () => ({
    // Need to mock the default export since apiClient is likely exported as default
    default: vi.fn()
}));

describe('listService', () => {
    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();
    });

    // --- getListDetails ---
    describe('getListDetails', () => {
        it('should call apiClient with correct endpoint and return formatted data on success', async () => {
            const mockListId = 123;
            const mockApiResponse = {
                success: true,
                data: {
                    // Raw data structure expected from API before formatting
                    id: mockListId,
                    name: 'Test List Raw',
                    description: 'Raw Desc',
                    list_type: 'mixed', // Use list_type
                    is_public: true,
                    user_id: 1,
                    creator_handle: 'tester',
                    saved_count: 5,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    items: [
                        { list_item_id: 1, item_id: 10, item_type: 'restaurant', name: 'Restaurant A', notes: 'Note 1', added_at: new Date().toISOString() },
                        { list_item_id: 2, item_id: 25, item_type: 'dish', name: 'Dish B', restaurant_name: 'Restaurant C', notes: null, added_at: new Date().toISOString() }
                    ],
                    is_following: false, // Example extra fields from backend query
                    created_by_user: true,
                }
            };
            // Configure the mock for this specific call
            apiClient.mockResolvedValue(mockApiResponse);

            const result = await listService.getListDetails(mockListId);

            // Check apiClient call
            expect(apiClient).toHaveBeenCalledTimes(1);
            expect(apiClient).toHaveBeenCalledWith(
                `/api/lists/${mockListId}`, // Ensure endpoint matches
                `ListService Details ${mockListId}`, // Ensure context matches
                undefined // No options for GET by default
            );

            // Check formatted result structure (using internal formatters)
            // The service returns { data: formattedList } structure based on last refactor
            expect(result).toHaveProperty('data');
            const formattedList = result.data;
            expect(formattedList.id).toBe(mockListId);
            expect(formattedList.name).toBe('Test List Raw');
            expect(formattedList.list_type).toBe('mixed'); // Check formatted field
            expect(formattedList.items).toBeInstanceOf(Array);
            expect(formattedList.items.length).toBe(2);
            expect(formattedList.items[0]).toMatchObject({ list_item_id: 1, id: 10, item_type: 'restaurant', name: 'Restaurant A', notes: 'Note 1'});
            expect(formattedList.items[1]).toMatchObject({ list_item_id: 2, id: 25, item_type: 'dish', name: 'Dish B', notes: null });
            expect(formattedList).not.toHaveProperty('item_count'); // Check removed property
        });

        it('should throw error if listId is missing', async () => {
            await expect(listService.getListDetails(null)).rejects.toThrow('List ID is required');
            await expect(listService.getListDetails(undefined)).rejects.toThrow('List ID is required');
            expect(apiClient).not.toHaveBeenCalled();
        });

        it('should propagate error from apiClient', async () => {
            const mockListId = 456;
            const mockError = { message: 'Network Error', status: 500 };
            // Mock apiClient to reject
            apiClient.mockRejectedValue(mockError);

            await expect(listService.getListDetails(mockListId)).rejects.toEqual(mockError);

            expect(apiClient).toHaveBeenCalledTimes(1);
            expect(apiClient).toHaveBeenCalledWith(
                `/api/lists/${mockListId}`,
                `ListService Details ${mockListId}`,
                undefined
            );
        });

        it('should throw error if formatting fails', async () => {
             const mockListId = 789;
             const invalidApiResponse = {
                 success: true,
                 data: { /* Missing essential fields like id */ name: 'Incomplete List' }
             };
             apiClient.mockResolvedValue(invalidApiResponse);

             await expect(listService.getListDetails(mockListId)).rejects.toThrow('Failed to process list details');
             expect(apiClient).toHaveBeenCalledTimes(1);
        });
    });

    // --- createList ---
    describe('createList', () => {
         const listData = { name: 'New Test List', description: 'Desc', is_public: false, list_type: 'dish', tags: ['test', ''] };
         const mockApiResponse = {
             success: true,
             data: { // Raw data from backend after creation
                 id: 999, name: 'New Test List', description: 'Desc', is_public: false, list_type: 'dish', tags: ['test'], user_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), item_count: 0, saved_count: 0, creator_handle: 'creator'
             }
         };

         it('should call apiClient with correct endpoint and payload, returning formatted list', async () => {
             apiClient.mockResolvedValue(mockApiResponse);

             const result = await listService.createList(listData);

             expect(apiClient).toHaveBeenCalledTimes(1);
             expect(apiClient).toHaveBeenCalledWith(
                 '/api/lists',
                 'ListService Create',
                 {
                     method: 'POST',
                     body: JSON.stringify({
                         name: 'New Test List',
                         description: 'Desc',
                         is_public: false,
                         tags: ['test'], // Empty tag filtered out
                         list_type: 'dish',
                         city_name: null
                     })
                 }
             );

             // Check formatted result
             expect(result.id).toBe(999);
             expect(result.name).toBe('New Test List');
             expect(result.list_type).toBe('dish');
             expect(result.tags).toEqual(['test']);
         });

         it('should throw error if list name is missing', async () => {
            const invalidData = { ...listData, name: '' };
             await expect(listService.createList(invalidData)).rejects.toThrow('List name is required for creation');
             expect(apiClient).not.toHaveBeenCalled();
         });

         it('should propagate error from apiClient', async () => {
              const mockError = { message: 'Server Error', status: 500 };
              apiClient.mockRejectedValue(mockError);

              await expect(listService.createList(listData)).rejects.toEqual(mockError);
              expect(apiClient).toHaveBeenCalledTimes(1);
         });
    });

    // --- deleteList ---
    describe('deleteList', () => {
        const mockListId = 321;
        const mockSuccessResponse = { success: true }; // apiClient indicates success

        it('should call apiClient with correct endpoint and method, returning success', async () => {
            apiClient.mockResolvedValue(mockSuccessResponse);

            const result = await listService.deleteList(mockListId);

            expect(apiClient).toHaveBeenCalledTimes(1);
            expect(apiClient).toHaveBeenCalledWith(
                `/api/lists/${mockListId}`,
                'ListService Delete List',
                { method: 'DELETE' }
            );
            expect(result).toEqual({ success: true });
        });

        it('should throw error if listId is missing', async () => {
             await expect(listService.deleteList(null)).rejects.toThrow('List ID is required');
             expect(apiClient).not.toHaveBeenCalled();
        });

        it('should propagate error from apiClient', async () => {
             const mockError = { message: 'Forbidden', status: 403 };
             apiClient.mockRejectedValue(mockError); // Simulate permission error

             await expect(listService.deleteList(mockListId)).rejects.toEqual(mockError);
             expect(apiClient).toHaveBeenCalledTimes(1);
        });
    });

    // --- Add tests for other methods (addItemToList, removeItemFromList, toggleFollow, updateList) ---
    // Example structure for addItemToList
    describe('addItemToList', () => {
        const listId = 1;
        const itemData = { item_id: 10, item_type: 'restaurant', notes: 'Good stuff' };
         const mockApiResponse = {
             success: true,
             data: {
                 message: "Success",
                 item: { list_item_id: 5, item_id: 10, item_type: 'restaurant', name: 'Mock Rest', notes: 'Good stuff', added_at: new Date().toISOString() }
             }
         };

        it('should call apiClient and return formatted item on success', async () => {
             apiClient.mockResolvedValue(mockApiResponse);
             const result = await listService.addItemToList(listId, itemData);
             expect(apiClient).toHaveBeenCalledWith(
                 `/api/lists/${listId}/items`,
                 'ListService Add Item',
                 { method: 'POST', body: JSON.stringify({ item_id: 10, item_type: 'restaurant', notes: 'Good stuff' }) }
             );
             expect(result.message).toBe('Success');
             expect(result.item).toMatchObject({ list_item_id: 5, id: 10, name: 'Mock Rest', notes: 'Good stuff' });
        });

         it('should throw error for invalid input', async () => {
             await expect(listService.addItemToList(null, itemData)).rejects.toThrow();
             await expect(listService.addItemToList(listId, null)).rejects.toThrow();
             await expect(listService.addItemToList(listId, { item_id: null, item_type: 'dish' })).rejects.toThrow();
             expect(apiClient).not.toHaveBeenCalled();
         });
    });

});