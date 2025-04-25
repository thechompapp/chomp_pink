/* src/services/adminService.js */
/* REFACTORED: Let apiClient handle and propagate standardized errors */
import apiClient from '@/services/apiClient.js';

// Optional: Import formatters if needed for response data, but rely on backend format first
// import { formatRestaurant, formatDish, formatUser, formatCity, formatNeighborhood, formatHashtag, formatChain } from '@/utils/formatters.js'; // REMOVED - Use backend formatting

const adminService = {
    // Generic fetch for admin data types
    getAdminData: async (resourceType) => {
        const endpoint = `/api/admin/${resourceType}`;
        const context = `AdminService Get ${resourceType}`;
        // Let apiClient handle the call and error propagation
        // Assumes backend returns { success: true, data: [...] }
        const response = await apiClient(endpoint, context);
        if (response.success) {
            // Return the data array directly if backend structure matches
            return Array.isArray(response.data) ? response.data : [];
        } else {
            // This case should ideally not be reached if apiClient rejects properly
            throw new Error(response.error || `Failed to fetch admin data for ${resourceType}`);
        }
        // REMOVED try/catch
    },

    // Specific getters (can be replaced by getAdminData if backend routes match)
    getAdminRestaurants: () => adminService.getAdminData('restaurants'),
    getAdminDishes: () => adminService.getAdminData('dishes'),
    getAdminUsers: () => adminService.getAdminData('users'),
    getAdminCities: () => adminService.getAdminData('cities'),
    getAdminNeighborhoods: () => adminService.getAdminData('neighborhoods'),
    getAdminHashtags: () => adminService.getAdminData('hashtags'),
    getAdminChains: () => adminService.getAdminData('restaurant_chains'), // Use correct resource type

    // Generic update for admin resources
    updateResource: async (resourceType, id, data) => {
        if (!resourceType || !id) {
            throw new Error('Resource type and ID are required for update.');
        }
        const endpoint = `/api/admin/${resourceType}/${id}`;
        const context = `AdminService Update ${resourceType} ${id}`;
        // Let apiClient handle call and errors
        const response = await apiClient(endpoint, context, {
            method: 'PUT',
            body: JSON.stringify(data),
        });

        // Assuming backend returns { success: true, data: {updatedResource} }
        if (response.success && response.data) {
            // Return the updated resource data
            // Add formatting here ONLY if backend doesn't return fully formatted data
            return response.data;
        } else {
            throw new Error(response.error || `Failed to update ${resourceType} with ID ${id}`);
        }
        // REMOVED try/catch
    },

    // Generic create for admin resources
    createResource: async (resourceType, data) => {
         if (!resourceType) {
             throw new Error('Resource type is required for creation.');
         }
        const endpoint = `/api/admin/${resourceType}`;
        const context = `AdminService Create ${resourceType}`;
        // Let apiClient handle call and errors
        const response = await apiClient(endpoint, context, {
            method: 'POST',
            body: JSON.stringify(data),
        });
         // Assuming backend returns { success: true, data: {createdResource} }
         if (response.success && response.data) {
            // Return the created resource data
            return response.data;
         } else {
            throw new Error(response.error || `Failed to create ${resourceType}`);
         }
         // REMOVED try/catch
    },

    // Generic delete for admin resources
    deleteResource: async (resourceType, id) => {
         if (!resourceType || !id) {
             throw new Error('Resource type and ID are required for deletion.');
         }
        const endpoint = `/api/admin/${resourceType}/${id}`;
        const context = `AdminService Delete ${resourceType} ${id}`;
        // Let apiClient handle call and errors (expects 204 or similar on success)
        const response = await apiClient(endpoint, context, {
            method: 'DELETE',
        });
        // Check success flag from apiClient
        if (response.success) {
            return { success: true }; // Indicate success
        } else {
            throw new Error(response.error || `Failed to delete ${resourceType} with ID ${id}`);
        }
        // REMOVED try/catch
    },

    // Bulk Add specific methods
    bulkAddRestaurants: async (restaurants) => {
        const endpoint = '/api/admin/bulk-add/restaurants';
        const context = 'AdminService Bulk Add Restaurants';
        const response = await apiClient(endpoint, context, {
            method: 'POST',
            body: JSON.stringify({ restaurants }), // Ensure backend expects this structure
        });
         if (response.success && response.data) {
             return response.data; // Return backend response (e.g., number added, any errors)
         } else {
             throw new Error(response.error || 'Failed to bulk add restaurants');
         }
    },

    bulkAddDishes: async (dishes) => {
        const endpoint = '/api/admin/bulk-add/dishes';
        const context = 'AdminService Bulk Add Dishes';
        const response = await apiClient(endpoint, context, {
            method: 'POST',
            body: JSON.stringify({ dishes }), // Ensure backend expects this structure
        });
         if (response.success && response.data) {
             return response.data;
         } else {
             throw new Error(response.error || 'Failed to bulk add dishes');
         }
    },

     // Efficient lookup check methods
     lookupNeighborhoods: async (names) => {
         const endpoint = '/api/admin/lookup/neighborhoods';
         const context = 'AdminService Lookup Neighborhoods';
         const response = await apiClient(endpoint, context, {
             method: 'POST',
             body: JSON.stringify({ names }),
         });
          if (response.success && Array.isArray(response.data)) {
              return new Set(response.data); // Return a Set of existing names
          } else {
              console.warn('[lookupNeighborhoods] Failed or received invalid data:', response);
              throw new Error(response.error || 'Failed neighborhood lookup');
          }
     },
     // Add lookupRestaurants, lookupDishes similarly if needed
     // Example:
     // lookupRestaurants: async (identifiers) => { ... }
     // lookupDishes: async (identifiers) => { ... }

    // Analytics specific methods
     getAnalyticsSummary: async () => {
        const endpoint = '/api/analytics/summary'; // Assuming endpoint exists
        const context = 'AdminService Get Analytics Summary';
        const response = await apiClient(endpoint, context);
         if (response.success && response.data) {
             return response.data;
         } else {
             throw new Error(response.error || 'Failed to fetch analytics summary');
         }
     },

     getEngagementTrends: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        const endpoint = `/api/analytics/engagement-trends${queryParams ? `?${queryParams}` : ''}`;
        const context = 'AdminService Get Engagement Trends';
        const response = await apiClient(endpoint, context);
         if (response.success && response.data) {
             return response.data;
         } else {
             throw new Error(response.error || 'Failed to fetch engagement trends');
         }
     },
};

export default adminService;