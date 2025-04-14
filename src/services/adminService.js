/* src/services/adminService.js */
import apiClient from '@/services/apiClient.js'; // Use .js extension

// REMOVED: All import type statements
// REMOVED: All TypeScript interfaces

const ALLOWED_TYPES = ['submissions', 'restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods'];

const buildAdminQueryString = (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    // Corrected: Use 'sort' parameter name as expected by backend admin route
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    // Corrected: Use 'list_type' parameter name as expected by backend admin route
    if (params.listType) queryParams.append('list_type', params.listType);
    // Corrected: Use 'hashtag_category' parameter name as expected by backend admin route
    if (params.hashtagCategory) queryParams.append('hashtag_category', params.hashtagCategory);
    if (params.cityId) queryParams.append('cityId', String(params.cityId));
    return queryParams.toString();
};

// --- Generic Admin CRUD Functions ---

const getAdminData = async (type, params = {}) => {
    if (!ALLOWED_TYPES.includes(type)) throw new Error(`Unsupported resource type: ${type}`);
    const queryString = buildAdminQueryString(params);
    const endpoint = `/api/admin/${type}${queryString ? `?${queryString}` : ''}`;
    const context = `AdminService Get ${type}`;
    try {
        const response = await apiClient(endpoint, context);
        // Standardized response from apiClient should have data directly if successful
        return {
            success: response.success,
            status: response.status,
            data: Array.isArray(response.data) ? response.data : [], // Expect data to be the array
            pagination: response.pagination, // apiClient places pagination at top level
            error: response.error,
            message: response.message,
        };
    } catch (error) {
        console.error(`[${context}] Error fetching data:`, error);
        // Rethrow the error (potentially ApiError from apiClient)
        throw error;
    }
};

const createResource = async (type, resourceData) => {
    if (!ALLOWED_TYPES.includes(type)) throw new Error(`Creation not supported for resource type: ${type}`);
    const endpoint = `/api/admin/${type}`;
    const context = `AdminService Create ${type}`;
    try {
        const response = await apiClient(endpoint, context, {
            method: 'POST',
            body: JSON.stringify(resourceData),
        });
        // apiClient returns the created object in response.data
        return {
            success: response.success,
            status: response.status,
            data: response.data ?? null,
            error: response.error,
            message: response.message,
        };
    } catch (error) {
         console.error(`[${context}] Error creating resource:`, error);
         throw error;
    }
};

const updateResource = async (type, id, updateData) => {
    if (!ALLOWED_TYPES.includes(type)) throw new Error(`Updates not supported for resource type: ${type}`);
    const endpoint = `/api/admin/${type}/${encodeURIComponent(String(id))}`;
    const context = `AdminService Update ${type} ${id}`;
     try {
        const response = await apiClient(endpoint, context, {
            method: 'PUT',
            body: JSON.stringify(updateData),
        });
        // apiClient returns the updated object in response.data
        return {
            success: response.success,
            status: response.status,
            data: response.data ?? null,
            error: response.error,
            message: response.message,
        };
    } catch (error) {
         console.error(`[${context}] Error updating resource:`, error);
         throw error;
    }
};

const deleteResource = async (type, id) => {
    if (!ALLOWED_TYPES.includes(type)) throw new Error(`Deletions not supported for resource type: ${type}`);
    const endpoint = `/api/admin/${type}/${encodeURIComponent(String(id))}`;
    const context = `AdminService Delete ${type} ${id}`;
    try {
        const response = await apiClient(endpoint, context, { method: 'DELETE' });
        // DELETE usually has no body, success indicated by status
        return {
            success: response.success,
            status: response.status,
            data: null, // No data expected on successful delete
            error: response.error,
            message: response.message,
        };
    } catch (error) {
        console.error(`[${context}] Error deleting resource:`, error);
        throw error;
    }
};

// --- Specialized Admin Functions ---
const getAdminSubmissions = (params = {}) => getAdminData('submissions', params);
const approveAdminSubmission = async (id) => {
     const endpoint = `/api/admin/submissions/${id}/approve`;
     const context = `AdminService Approve Submission ${id}`;
     try {
         const response = await apiClient(endpoint, context, { method: 'POST' });
         return { ...response, data: response.data ?? null };
     } catch(error) {
         console.error(`[${context}] Error:`, error);
         throw error;
     }
};
const rejectAdminSubmission = async (id) => {
     const endpoint = `/api/admin/submissions/${id}/reject`;
     const context = `AdminService Reject Submission ${id}`;
     try {
        const response = await apiClient(endpoint, context, { method: 'POST' });
        return { ...response, data: response.data ?? null };
    } catch(error) {
        console.error(`[${context}] Error:`, error);
        throw error;
    }
};

// Users
const getAdminUsers = (params = {}) => getAdminData('users', params);
const updateAdminUser = (id, data) => updateResource('users', id, data);
const deleteAdminUser = (id) => deleteResource('users', id);

// Restaurants
const getAdminRestaurants = (params = {}) => getAdminData('restaurants', params);
const getAdminRestaurantById = async (id) => { /* ... unchanged ... */ }; // Fetching single item might have different structure
const updateAdminRestaurant = (id, data) => updateResource('restaurants', id, data);
const createAdminRestaurant = (data) => createResource('restaurants', data);
const deleteAdminRestaurant = (id) => deleteResource('restaurants', id);

// Dishes
const getAdminDishes = (params = {}) => getAdminData('dishes', params);
const updateAdminDish = (id, data) => updateResource('dishes', id, data);
const createAdminDish = (data) => createResource('dishes', data);
const deleteAdminDish = (id) => deleteResource('dishes', id);

 // Lists
const getAdminLists = (params = {}) => getAdminData('lists', params);
const updateAdminList = (id, data) => updateResource('lists', id, data);
const createAdminList = (data) => createResource('lists', data);
const deleteAdminList = (id) => deleteResource('lists', id);

// Hashtags
const getAdminHashtags = (params = {}) => getAdminData('hashtags', params);
const updateAdminHashtag = (id, data) => updateResource('hashtags', id, data);
const createAdminHashtag = (data) => createResource('hashtags', data);
const deleteAdminHashtag = (id) => deleteResource('hashtags', id);

// Neighborhoods
const getAdminNeighborhoods = (params = {}) => getAdminData('neighborhoods', params);
const createAdminNeighborhood = (data) => createResource('neighborhoods', data);
const updateAdminNeighborhood = (id, data) => updateResource('neighborhoods', id, data);
const deleteAdminNeighborhood = (id) => deleteResource('neighborhoods', id);

// -- Cities Lookup --
// CORRECTED: Directly check response.data
const getAdminCitiesSimple = async () => {
    const endpoint = '/api/admin/lookup/cities';
    const context = 'AdminService Get Cities Lookup';
    try {
        const response = await apiClient(endpoint, context);
        // ** FIX: Check response.data directly for array **
        return {
             success: response.success,
             status: response.status,
             data: Array.isArray(response.data) ? response.data : [], // Correctly access data
             error: response.error,
         };
     } catch (error) {
         console.error(`[${context}] Error:`, error);
         // Return error structure consistent with other functions
         return {
             success: false,
             status: error.status || 500,
             data: [],
             error: error.message || 'Failed to fetch cities lookup',
         };
     }
};

// Bulk Add
const bulkAddAdminItems = async (items) => {
     const endpoint = '/api/admin/bulk-add';
     const context = 'AdminService Bulk Add';
     try {
        const response = await apiClient(endpoint, context, {
            method: 'POST',
            body: JSON.stringify({ items }),
        });
        // Backend sends result directly in response object (not nested under data)
        return {
            success: response.success,
            status: response.status,
            data: response.data ?? null, // Use data directly
            error: response.error,
            message: response.message || response.data?.message, // Use message directly or from data
        };
    } catch (error) {
        console.error(`[${context}] Error:`, error);
        throw error;
    }
 };


// Export all functions
export const adminService = {
    getAdminData, createResource, updateResource, deleteResource,
    getAdminSubmissions, approveAdminSubmission, rejectAdminSubmission,
    getAdminUsers, updateAdminUser, deleteAdminUser,
    getAdminRestaurants, getAdminRestaurantById, updateAdminRestaurant, createAdminRestaurant, deleteAdminRestaurant,
    getAdminDishes, updateAdminDish, createAdminDish, deleteAdminDish,
    getAdminLists, updateAdminList, createAdminList, deleteAdminList,
    getAdminHashtags, updateAdminHashtag, createAdminHashtag, deleteAdminHashtag,
    getAdminNeighborhoods, createAdminNeighborhood, updateAdminNeighborhood, deleteAdminNeighborhood,
    getAdminCitiesSimple,
    bulkAddAdminItems,
};