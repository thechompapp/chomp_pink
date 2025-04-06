// src/services/listService.js
import apiClient from '@/services/apiClient.js'; // Corrected Path

const BASE_PATH = '/api/lists';

const getLists = async (params = {}) => {
    // Params could be { createdByUser: true } or { followedByUser: true }
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `${BASE_PATH}${queryString ? `?${queryString}` : ''}`;
    const context = queryString ? `ListService Get (${queryString})` : 'ListService Get All (Default)';
    // Ensure array is returned on success, handle potential null/undefined from apiClient
    const data = await apiClient(endpoint, context) || [];
    if (!Array.isArray(data)) {
         console.warn(`[${context}] Invalid data format received. Expected array, got:`, data);
         return []; // Return empty array for safety
    }
    // Format data within the service if needed, or keep it raw
    return data.map(list => ({
        ...list,
        city: list.city_name,
        is_following: list.is_following ?? false,
        is_public: list.is_public ?? true,
        created_by_user: list.created_by_user ?? false,
        tags: Array.isArray(list.tags) ? list.tags : [],
        item_count: list.item_count || 0,
        id: list.id
     })).filter(list => typeof list.id !== 'undefined' && list.id !== null);
};

const getListDetails = async (listId) => {
    if (!listId) throw new Error('List ID is required');
    const data = await apiClient(`${BASE_PATH}/${listId}`, `ListService Details ${listId}`);
    // Ensure items array exists
    return { ...data, items: Array.isArray(data?.items) ? data.items : [] } || {};
};

const createList = async (listData) => {
    // listData: { name, description, is_public, tags, ... }
    return await apiClient(BASE_PATH, 'ListService Create', {
        method: 'POST',
        body: JSON.stringify(listData),
    });
};

const addItemToList = async (listId, itemData) => {
    // itemData: { item_id, item_type }
     if (!listId || !itemData || !itemData.item_id || !itemData.item_type) {
          throw new Error("List ID, Item ID, and Item Type are required.");
     }
    return await apiClient(`${BASE_PATH}/${listId}/items`, 'ListService Add Item', {
        method: 'POST',
        body: JSON.stringify(itemData),
    });
};

const removeItemFromList = async (listId, listItemId) => {
     if (!listId || !listItemId) {
          throw new Error("List ID and List Item ID are required.");
     }
    // Expects 204 No Content on success, apiClient handles this
    return await apiClient(`${BASE_PATH}/${listId}/items/${listItemId}`, 'ListService Remove Item', {
        method: 'DELETE',
    });
};

const toggleFollow = async (listId) => {
     if (!listId) throw new Error("List ID is required.");
    // Returns the updated list object with new follow status and count
    return await apiClient(`${BASE_PATH}/${listId}/follow`, 'ListService Toggle Follow', {
        method: 'POST',
    });
};

const updateVisibility = async (listId, visibilityData) => {
    // visibilityData: { is_public: boolean }
     if (!listId || typeof visibilityData?.is_public !== 'boolean') {
          throw new Error("List ID and visibility flag are required.");
     }
    return await apiClient(`${BASE_PATH}/${listId}/visibility`, 'ListService Update Visibility', {
        method: 'PUT',
        body: JSON.stringify(visibilityData),
    });
};

export const listService = {
    getLists,
    getListDetails,
    createList,
    addItemToList,
    removeItemFromList,
    toggleFollow,
    updateVisibility,
    // deleteList // Add if implemented
};