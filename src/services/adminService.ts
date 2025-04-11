/* src/services/adminService.ts */
import apiClient, { ApiResponse } from '@/services/apiClient';
// Import specific types needed for admin resources
import type { City, Neighborhood } from '@/types/Filters';
import type { Restaurant } from '@/types/Restaurant';
import type { Dish } from '@/types/Dish';
import type { List } from '@/types/List';
import type { User } from '@/types/User';
import type { Hashtag } from '@/doof-backend/models/hashtagModel'; // Adjust path/import if Hashtag type is moved to '@/types'
import type { Submission } from '@/types/Submission';

// --- Type Definitions ---

// Interface for pagination info returned by the admin list endpoints
interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// Generic type for paginated admin data response
interface AdminDataResponse<T> {
    data: T[];
    pagination: Pagination;
}

// Generic type for single admin resource response
interface AdminResourceResponse<T> {
    data: T;
}

// Define parameter types for fetching admin data lists
interface AdminGetParams {
    page?: number;
    limit?: number;
    sortBy?: string; // e.g., 'name' or 'neighborhoods.name' (backend route handles specific mapping)
    sortOrder?: 'ASC' | 'DESC';
    search?: string;
    // Type-specific filters
    status?: 'pending' | 'approved' | 'rejected'; // For submissions
    listType?: 'mixed' | 'restaurant' | 'dish'; // For lists
    hashtagCategory?: string; // For hashtags
    cityId?: number; // For neighborhoods
}

// Define allowed resource types for type safety
type AdminResourceType = 'submissions' | 'restaurants' | 'dishes' | 'lists' | 'hashtags' | 'users' | 'neighborhoods';

// --- Helper Functions ---

// Function to build query string safely, excluding undefined/null values
const buildAdminQueryString = (params: AdminGetParams): string => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    // Combine sort Key and Order into 'sort' param if both provided
    if (params.sortBy && params.sortOrder) queryParams.append('sort', `${params.sortBy}_${params.sortOrder.toLowerCase()}`);
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.listType) queryParams.append('list_type', params.listType);
    if (params.hashtagCategory) queryParams.append('hashtag_category', params.hashtagCategory);
    if (params.cityId) queryParams.append('cityId', String(params.cityId)); // Add cityId for neighborhoods
    return queryParams.toString();
};


// --- Generic Admin API Functions ---

/**
 * Fetches paginated/sorted/filtered data for a given admin resource type.
 * Corresponds to GET /api/admin/:type
 */
const getAdminData = async <T = any>(type: AdminResourceType, params: AdminGetParams = {}): Promise<ApiResponse<T[]>> => {
    const queryString = buildAdminQueryString(params);
    const endpoint = `/api/admin/${type}${queryString ? `?${queryString}` : ''}`;
    const context = `AdminService Get ${type}`;

    // Expecting ApiResponse<{ data: T[], pagination: Pagination }> structure from backend via apiClient
    const response = await apiClient<AdminDataResponse<T>>(endpoint, context);

    // Return the structured response, ensuring data is an array
    return {
        ...response, // Spread other potential fields like success, message
        data: Array.isArray(response.data?.data) ? response.data.data : [],
        pagination: response.data?.pagination,
    };
};

/**
 * Creates a new resource of the specified type.
 * Corresponds to POST /api/admin/:type
 */
const createResource = async <T = any>(type: AdminResourceType, resourceData: Partial<T>): Promise<ApiResponse<T>> => {
    const endpoint = `/api/admin/${type}`;
    const context = `AdminService Create ${type}`;
    const response = await apiClient<AdminResourceResponse<T>>(endpoint, context, {
        method: 'POST',
        body: JSON.stringify(resourceData),
    });
     return {
        ...response, // Spread potential error/message/success
        data: response.data?.data ?? null // Extract nested data
     };
};

/**
 * Updates an existing resource.
 * Corresponds to PUT /api/admin/:type/:id
 */
const updateResource = async <T = any>(type: AdminResourceType, id: number | string, updateData: Partial<T>): Promise<ApiResponse<T>> => {
    const endpoint = `/api/admin/${type}/${encodeURIComponent(String(id))}`;
    const context = `AdminService Update ${type} ${id}`;
    const response = await apiClient<AdminResourceResponse<T>>(endpoint, context, {
        method: 'PUT',
        body: JSON.stringify(updateData),
    });
     return {
        ...response, // Spread potential error/message/success
        data: response.data?.data ?? null // Extract nested data
     };
};

/**
 * Deletes a resource by type and ID.
 * Corresponds to DELETE /api/admin/:type/:id
 */
const deleteResource = async (type: AdminResourceType, id: number | string): Promise<ApiResponse<null>> => {
    const endpoint = `/api/admin/${type}/${encodeURIComponent(String(id))}`;
    const context = `AdminService Delete ${type} ${id}`;
    // Expecting 204 No Content on success, which apiClient handles
    const response = await apiClient<null>(endpoint, context, { method: 'DELETE' });
    // Ensure success boolean is accurate even on 204
    return { success: response?.success ?? true, error: response?.error };
};

// --- Specific Functions (Leveraging Generic Ones) ---

/**
 * Fetches paginated/sorted/filtered neighborhoods for the admin panel.
 */
const getAdminNeighborhoods = async (params: AdminGetParams = {}): Promise<ApiResponse<Neighborhood[]>> => {
    // Explicitly pass cityId if it exists in params for the generic fetcher to build the query string
    return getAdminData<Neighborhood>('neighborhoods', params);
};

/**
 * Creates a new neighborhood via the admin endpoint.
 */
const createAdminNeighborhood = async (data: { name: string; city_id: number }): Promise<ApiResponse<Neighborhood>> => {
    return createResource<Neighborhood>('neighborhoods', data);
};

/**
 * Updates an existing neighborhood via the admin endpoint.
 */
const updateAdminNeighborhood = async (id: number | string, data: Partial<Omit<Neighborhood, 'id'>>): Promise<ApiResponse<Neighborhood>> => {
    return updateResource<Neighborhood>('neighborhoods', id, data);
};

/**
 * Deletes a neighborhood via the admin endpoint.
 */
const deleteAdminNeighborhood = async (id: number | string): Promise<ApiResponse<null>> => {
    return deleteResource('neighborhoods', id);
};

/**
 * Fetches the simple list of cities for dropdowns in the admin panel.
 * Corresponds to GET /api/admin/lookup/cities (assuming this exists based on admin.ts)
 */
const getAdminCitiesSimple = async (): Promise<City[]> => {
    // Note: Using a different endpoint based on inspection of admin.ts logic
    const endpoint = '/api/admin/lookup/cities';
    const context = 'AdminService Get Cities Lookup';
    try {
        const response = await apiClient<{ data: City[] }>(endpoint, context);
        return Array.isArray(response.data?.data) ? response.data.data : [];
    } catch (error) {
        console.error(`[AdminService] Error fetching cities lookup:`, error);
        return []; // Return empty on error
    }
};


// Export the service object
export const adminService = {
    // Generic
    getAdminData,
    createResource,
    updateResource,
    deleteResource,
    // Specific wrappers (examples)
    getAdminNeighborhoods,
    createAdminNeighborhood,
    updateAdminNeighborhood,
    deleteAdminNeighborhood,
    getAdminCitiesSimple,
    // Note: Submission approve/reject are handled in submissionService.ts
};