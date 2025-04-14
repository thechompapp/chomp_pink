/* src/services/adminService.js */
import apiClient from '@/services/apiClient.js'; // Use .js extension

// REMOVED: All import type statements
// REMOVED: All TypeScript interfaces

// Allowed resource types managed by the generic admin endpoints
const ALLOWED_TYPES = ['submissions', 'restaurants', 'dishes', 'lists', 'hashtags', 'users', 'neighborhoods'];

// Helper to build query string
const buildAdminQueryString = (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.sortBy) queryParams.append('sort', params.sortBy); // Use combined 'sort' param
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.listType) queryParams.append('list_type', params.listType);
    if (params.hashtagCategory) queryParams.append('hashtag_category', params.hashtagCategory);
    if (params.cityId) queryParams.append('cityId', String(params.cityId));
    return queryParams.toString();
};

// --- Generic Admin CRUD Functions ---

/** Fetches a list of resources from a generic admin endpoint */
const getAdminData = async (type, params = {}) => {
    if (!ALLOWED_TYPES.includes(type)) throw new Error(`Unsupported resource type: ${type}`);
    const queryString = buildAdminQueryString(params);
    const endpoint = `/api/admin/${type}${queryString ? `?${queryString}` : ''}`;
    const context = `AdminService Get ${type}`;
    const response = await apiClient(endpoint, context);
    // Adapt to the actual response structure, ensuring data array and pagination exist
    return {
        success: response.success,
        status: response.status,
        // Handle both direct data array and nested data array under 'data' key
        data: Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []),
        pagination: response.data?.pagination || response.pagination,
        error: response.error,
    };
};

/** Creates a resource using a generic admin endpoint */
const createResource = async (type, resourceData) => {
    if (!ALLOWED_TYPES.includes(type)) throw new Error(`Creation not supported for resource type: ${type}`);
    const endpoint = `/api/admin/${type}`;
    const context = `AdminService Create ${type}`;
    const response = await apiClient(endpoint, context, {
        method: 'POST',
        body: JSON.stringify(resourceData),
    });
    return {
        success: response.success,
        status: response.status,
        data: response.data?.data ?? response.data ?? null, // Extract nested or direct data object
        error: response.error,
        message: response.message,
    };
};

/** Updates a resource using a generic admin endpoint */
const updateResource = async (type, id, updateData) => {
    if (!ALLOWED_TYPES.includes(type)) throw new Error(`Updates not supported for resource type: ${type}`);
    const endpoint = `/api/admin/${type}/${encodeURIComponent(String(id))}`;
    const context = `AdminService Update ${type} ${id}`;
    const response = await apiClient(endpoint, context, {
        method: 'PUT',
        body: JSON.stringify(updateData),
    });
    return {
        success: response.success,
        status: response.status,
        data: response.data?.data ?? response.data ?? null, // Extract nested or direct data object
        error: response.error,
        message: response.message,
    };
};

/** Deletes a resource using a generic admin endpoint */
const deleteResource = async (type, id) => {
    if (!ALLOWED_TYPES.includes(type)) throw new Error(`Deletions not supported for resource type: ${type}`);
    const endpoint = `/api/admin/${type}/${encodeURIComponent(String(id))}`;
    const context = `AdminService Delete ${type} ${id}`;
    const response = await apiClient(endpoint, context, { method: 'DELETE' });
     return {
        success: response.success,
        status: response.status,
        data: null,
        error: response.error,
        message: response.message,
    };
};


// --- Specialized Admin Functions (using generic helpers) ---

// -- Submissions --
const getAdminSubmissions = async (params = {}) => getAdminData('submissions', params);
const approveAdminSubmission = async (id) => {
     const endpoint = `/api/admin/submissions/${id}/approve`;
     const context = `AdminService Approve Submission ${id}`;
     const response = await apiClient(endpoint, context, { method: 'POST' });
     return { ...response, data: response.data?.data ?? response.data ?? null };
};
const rejectAdminSubmission = async (id) => {
     const endpoint = `/api/admin/submissions/${id}/reject`;
     const context = `AdminService Reject Submission ${id}`;
     const response = await apiClient(endpoint, context, { method: 'POST' });
     return { ...response, data: response.data?.data ?? response.data ?? null };
};

// -- Users --
const getAdminUsers = async (params = {}) => getAdminData('users', params);
const updateAdminUser = async (id, data) => updateResource('users', id, data);
const deleteAdminUser = async (id) => deleteResource('users', id);

// -- Restaurants --
const getAdminRestaurants = async (params = {}) => getAdminData('restaurants', params);
const getAdminRestaurantById = async (id) => {
     const endpoint = `/api/admin/restaurants/${id}`; // Assuming specific GET by ID endpoint
     const context = `AdminService Get Restaurant ${id}`;
     const response = await apiClient(endpoint, context);
     return { ...response, data: response.data?.data ?? response.data ?? null };
};
const updateAdminRestaurant = async (id, restaurantData) => updateResource('restaurants', id, restaurantData);
const createAdminRestaurant = async (data) => createResource('restaurants', data);
const deleteAdminRestaurant = async (id) => deleteResource('restaurants', id);

// -- Dishes --
const getAdminDishes = async (params = {}) => getAdminData('dishes', params);
const updateAdminDish = async (id, dishData) => updateResource('dishes', id, dishData);
const createAdminDish = async (data) => createResource('dishes', data);
const deleteAdminDish = async (id) => deleteResource('dishes', id);

 // -- Lists --
const getAdminLists = async (params = {}) => getAdminData('lists', params);
const updateAdminList = async (id, listData) => updateResource('lists', id, listData);
const createAdminList = async (data) => createResource('lists', data);
const deleteAdminList = async (id) => deleteResource('lists', id);

// -- Hashtags --
const getAdminHashtags = async (params = {}) => getAdminData('hashtags', params);
const updateAdminHashtag = async (id, hashtagData) => updateResource('hashtags', id, hashtagData);
const createAdminHashtag = async (data) => createResource('hashtags', data);
const deleteAdminHashtag = async (id) => deleteResource('hashtags', id);

// -- Neighborhoods --
const getAdminNeighborhoods = async (params = {}) => getAdminData('neighborhoods', params);
const createAdminNeighborhood = async (data) => createResource('neighborhoods', data);
const updateAdminNeighborhood = async (id, data) => updateResource('neighborhoods', id, data);
const deleteAdminNeighborhood = async (id) => deleteResource('neighborhoods', id);

// -- Cities Lookup --
const getAdminCitiesSimple = async () => {
    const endpoint = '/api/admin/lookup/cities';
    const context = 'AdminService Get Cities Lookup';
    const response = await apiClient(endpoint, context);
    return {
         success: response.success,
         status: response.status,
         data: Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []),
         error: response.error,
     };
};

// --- Bulk Add ---
const bulkAddAdminItems = async (items) => {
     const endpoint = '/api/admin/bulk-add';
     const context = 'AdminService Bulk Add';
     const response = await apiClient(endpoint, context, {
         method: 'POST',
         body: JSON.stringify({ items }),
     });
     return {
         success: response.success,
         status: response.status,
         data: response.data ?? null,
         error: response.error,
         message: response.message || response.data?.message,
     };
 };


// Export all functions
export const adminService = {
    // Generic
    getAdminData,
    createResource,
    updateResource,
    deleteResource,
    // Specific resources
    getAdminSubmissions, approveAdminSubmission, rejectAdminSubmission,
    getAdminUsers, updateAdminUser, deleteAdminUser,
    getAdminRestaurants, getAdminRestaurantById, updateAdminRestaurant, createAdminRestaurant, deleteAdminRestaurant,
    getAdminDishes, updateAdminDish, createAdminDish, deleteAdminDish,
    getAdminLists, updateAdminList, createAdminList, deleteAdminList,
    getAdminHashtags, updateAdminHashtag, createAdminHashtag, deleteAdminHashtag,
    getAdminNeighborhoods, createAdminNeighborhood, updateAdminNeighborhood, deleteAdminNeighborhood,
    // Lookups & Bulk
    getAdminCitiesSimple,
    bulkAddAdminItems,
};