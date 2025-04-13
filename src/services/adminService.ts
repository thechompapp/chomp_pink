/* src/services/adminService.ts */
import apiClient, { ApiResponse, Pagination } from '@/services/apiClient'; // Use named export for Pagination
import type { City } from '@/types/Filters'; // Assuming Neighborhood is here too, or import separately
import type { Neighborhood } from '@/types/Neighborhood'; // Import specific Neighborhood type
import type { Restaurant } from '@/types/Restaurant';
import type { Dish } from '@/types/Dish';
import type { List } from '@/types/List';
import type { User } from '@/types/User';
import type { Hashtag } from '@/doof-backend/models/hashtagModel'; // Check path if needed
import type { Submission } from '@/types/Submission';

// Remove local Pagination interface if imported

// Generic structure for responses containing paginated data
interface AdminDataResponse<T> {
    data: T[];
    pagination: Pagination;
}

// Generic structure for responses containing a single resource
interface AdminResourceResponse<T> {
    data: T;
}

// Parameters for GET requests to admin endpoints
interface AdminGetParams {
    page?: number;
    limit?: number;
    sortBy?: string; // Combined column_direction e.g., 'name_asc'
    sortOrder?: 'asc' | 'desc'; // Kept for potential use with sortBy
    search?: string;
    // Specific filters
    status?: Submission['status'];
    listType?: List['list_type'];
    hashtagCategory?: string;
    cityId?: number;
}

// Allowed resource types managed by the generic admin endpoints
type AdminResourceType = 'submissions' | 'restaurants' | 'dishes' | 'lists' | 'hashtags' | 'users' | 'neighborhoods';

// Helper to build query string, ensuring sort format is correct
const buildAdminQueryString = (params: AdminGetParams): string => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    // Use combined sortBy format if provided (e.g., 'name_asc')
    if (params.sortBy) queryParams.append('sort', params.sortBy);
     // Include individual filters
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.listType) queryParams.append('list_type', params.listType);
    if (params.hashtagCategory) queryParams.append('hashtag_category', params.hashtagCategory);
    if (params.cityId) queryParams.append('cityId', String(params.cityId));
    return queryParams.toString();
};

// --- Generic Admin CRUD Functions ---

/** Fetches a list of resources from a generic admin endpoint */
const getAdminData = async <T = any>(type: AdminResourceType, params: AdminGetParams = {}): Promise<ApiResponse<T[]>> => {
    const queryString = buildAdminQueryString(params);
    const endpoint = `/api/admin/${type}${queryString ? `?${queryString}` : ''}`;
    const context = `AdminService Get ${type}`;
    // Expect { data: T[], pagination: Pagination } structure from backend
    const response = await apiClient<AdminDataResponse<T>>(endpoint, context);
    // Adapt to the actual response structure, ensuring data array and pagination exist
    return {
        success: response.success,
        status: response.status,
        data: Array.isArray(response.data?.data) ? response.data.data : [], // Extract data array
        pagination: response.data?.pagination, // Extract pagination object
        error: response.error,
    };
};

/** Creates a resource using a generic admin endpoint */
const createResource = async <T = any>(type: AdminResourceType, resourceData: Partial<T>): Promise<ApiResponse<T>> => {
    const endpoint = `/api/admin/${type}`;
    const context = `AdminService Create ${type}`;
    // Expect { data: T } structure from backend
    const response = await apiClient<AdminResourceResponse<T>>(endpoint, context, {
        method: 'POST',
        body: JSON.stringify(resourceData),
    });
     // Adapt to the actual response structure
    return {
        success: response.success,
        status: response.status,
        data: response.data?.data ?? null, // Extract nested data object
        error: response.error,
        message: response.message, // Include message if present (e.g., from conflicts)
    };
};

/** Updates a resource using a generic admin endpoint */
const updateResource = async <T = any>(type: AdminResourceType, id: number | string, updateData: Partial<T>): Promise<ApiResponse<T>> => {
    const endpoint = `/api/admin/${type}/${encodeURIComponent(String(id))}`;
    const context = `AdminService Update ${type} ${id}`;
     // Expect { data: T } structure from backend
    const response = await apiClient<AdminResourceResponse<T>>(endpoint, context, {
        method: 'PUT',
        body: JSON.stringify(updateData),
    });
     // Adapt to the actual response structure
    return {
        success: response.success,
        status: response.status,
        data: response.data?.data ?? null, // Extract nested data object
        error: response.error,
        message: response.message, // Include message if present (e.g., no changes applied)
    };
};

/** Deletes a resource using a generic admin endpoint */
const deleteResource = async (type: AdminResourceType, id: number | string): Promise<ApiResponse<null>> => {
    const endpoint = `/api/admin/${type}/${encodeURIComponent(String(id))}`;
    const context = `AdminService Delete ${type} ${id}`;
    // Expect 204 No Content on success, or error object
    const response = await apiClient<null>(endpoint, context, { method: 'DELETE' });
    // Return standardized success/error structure
     return {
        success: response.success, // Should be true if DELETE was successful (status 204)
        status: response.status,
        data: null,
        error: response.error,
        message: response.message, // Include message for conflicts/errors
    };
};


// --- Specialized Admin Functions (using generic helpers) ---

// -- Submissions --
const getAdminSubmissions = async (params: AdminGetParams = {}): Promise<ApiResponse<Submission[]>> => {
    return getAdminData<Submission>('submissions', params);
};
// Specific approval/rejection use dedicated backend routes, not generic PUT
const approveAdminSubmission = async (id: number): Promise<ApiResponse<Submission>> => {
     const endpoint = `/api/admin/submissions/${id}/approve`;
     const context = `AdminService Approve Submission ${id}`;
     const response = await apiClient<AdminResourceResponse<Submission>>(endpoint, context, { method: 'POST' });
      return { ...response, data: response.data?.data ?? null };
};
const rejectAdminSubmission = async (id: number): Promise<ApiResponse<Submission>> => {
     const endpoint = `/api/admin/submissions/${id}/reject`;
     const context = `AdminService Reject Submission ${id}`;
      const response = await apiClient<AdminResourceResponse<Submission>>(endpoint, context, { method: 'POST' });
      return { ...response, data: response.data?.data ?? null };
};

// -- Users --
const getAdminUsers = async (params: AdminGetParams = {}): Promise<ApiResponse<User[]>> => {
    return getAdminData<User>('users', params);
};
const updateAdminUser = async (id: number | string, data: Partial<Omit<User, 'id' | 'created_at' | 'updated_at' | 'password_hash'>>): Promise<ApiResponse<User>> => {
    // Use generic update, ensuring password isn't passed
    return updateResource<User>('users', id, data);
};
// Role update might be part of the generic update now if `is_superadmin` is in the schema
// const updateAdminUserRole = async (id: number, is_superadmin: boolean): Promise<ApiResponse<User>> => {
//     return updateResource<User>('users', id, { is_superadmin });
// };
const deleteAdminUser = async (id: number | string): Promise<ApiResponse<null>> => {
     return deleteResource('users', id);
};

// -- Restaurants (New) --
const getAdminRestaurants = async (params: AdminGetParams = {}): Promise<ApiResponse<Restaurant[]>> => {
    return getAdminData<Restaurant>('restaurants', params);
};
const getAdminRestaurantById = async (id: number): Promise<ApiResponse<Restaurant>> => {
    // Need a specific GET by ID endpoint or adapt generic GET if backend supports filtering by ID
     // Assuming a generic endpoint exists for fetching single items (modify if needed)
     const endpoint = `/api/admin/restaurants/${id}`;
     const context = `AdminService Get Restaurant ${id}`;
     const response = await apiClient<AdminResourceResponse<Restaurant>>(endpoint, context);
     return { ...response, data: response.data?.data ?? null };
};
const updateAdminRestaurant = async (id: number, restaurantData: Partial<Restaurant>): Promise<ApiResponse<Restaurant>> => {
    return updateResource<Restaurant>('restaurants', id, restaurantData);
};
// Optional: Add create/delete if needed
// const createAdminRestaurant = async (data: Partial<Restaurant>): Promise<ApiResponse<Restaurant>> => {
//     return createResource<Restaurant>('restaurants', data);
// }
// const deleteAdminRestaurant = async (id: number | string): Promise<ApiResponse<null>> => {
//     return deleteResource('restaurants', id);
// }


// -- Neighborhoods --
const getAdminNeighborhoods = async (params: AdminGetParams = {}): Promise<ApiResponse<Neighborhood[]>> => {
    return getAdminData<Neighborhood>('neighborhoods', params);
};
const createAdminNeighborhood = async (data: { name: string; city_id: number, zip_codes?: string[] | string | null }): Promise<ApiResponse<Neighborhood>> => {
    return createResource<Neighborhood>('neighborhoods', data);
};
const updateAdminNeighborhood = async (id: number | string, data: Partial<Omit<Neighborhood, 'id'>>): Promise<ApiResponse<Neighborhood>> => {
    return updateResource<Neighborhood>('neighborhoods', id, data);
};
const deleteAdminNeighborhood = async (id: number | string): Promise<ApiResponse<null>> => {
    return deleteResource('neighborhoods', id);
};

// -- Cities Lookup --
const getAdminCitiesSimple = async (): Promise<ApiResponse<City[]>> => {
    const endpoint = '/api/admin/lookup/cities';
    const context = 'AdminService Get Cities Lookup';
    // Expect { data: City[] } structure from backend
     const response = await apiClient<{ data: City[] }>(endpoint, context);
     return {
         success: response.success,
         status: response.status,
         data: Array.isArray(response.data?.data) ? response.data.data : [], // Extract array
         error: response.error,
     };
};

// --- Bulk Add ---
interface BulkAddResultDetail { // Match backend type
    input: { name: string; type: string };
    status: 'added' | 'skipped' | 'error';
    reason?: string;
    id?: number;
    type?: 'restaurant' | 'dish';
}
interface BulkAddResults { // Match backend type
    processedCount: number;
    addedCount: number;
    skippedCount: number;
    details: BulkAddResultDetail[];
    message?: string;
}
const bulkAddAdminItems = async (items: Array<{ type: 'restaurant' | 'dish', name: string, [key: string]: any }>): Promise<ApiResponse<BulkAddResults>> => {
     const endpoint = '/api/admin/bulk-add';
     const context = 'AdminService Bulk Add';
     // Backend returns BulkAddResults directly
     const response = await apiClient<BulkAddResults>(endpoint, context, {
         method: 'POST',
         body: JSON.stringify({ items }),
     });
     // Return the results object nested under 'data' for consistency? Or directly? Assuming direct for now.
     return {
         success: response.success,
         status: response.status,
         data: response.data ?? null, // Return the BulkAddResults object
         error: response.error,
         message: response.message || response.data?.message,
     };
 };


// Export all functions
export const adminService = {
    // Generic (can be used directly if needed)
    getAdminData,
    createResource,
    updateResource,
    deleteResource,
    // Submissions
    getAdminSubmissions,
    approveAdminSubmission,
    rejectAdminSubmission,
    // Users
    getAdminUsers,
    updateAdminUser,
    deleteAdminUser,
    // Restaurants (New)
    getAdminRestaurants,
    getAdminRestaurantById,
    updateAdminRestaurant,
    // createAdminRestaurant, // Uncomment if added
    // deleteAdminRestaurant, // Uncomment if added
    // Neighborhoods
    getAdminNeighborhoods,
    createAdminNeighborhood,
    updateAdminNeighborhood,
    deleteAdminNeighborhood,
    // Lookups
    getAdminCitiesSimple,
    // Bulk Add
    bulkAddAdminItems,
};