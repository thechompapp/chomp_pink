/* src/services/adminService.js */
import apiClient from './apiClient.js';
import useApiErrorHandler from '@/hooks/useApiErrorHandler';

export const adminService = {
  getAdminRestaurants: async () => {
    const { handleError } = useApiErrorHandler();
    try {
      const response = await apiClient('/api/admin/restaurants', 'AdminService GetRestaurants');
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch restaurants');
    } catch (error) {
      handleError(error, 'Failed to fetch restaurants.');
      throw error;
    }
  },

  getAdminDishes: async () => {
    const { handleError } = useApiErrorHandler();
    try {
      const response = await apiClient('/api/admin/dishes', 'AdminService GetDishes');
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch dishes');
    } catch (error) {
      handleError(error, 'Failed to fetch dishes.');
      throw error;
    }
  },

  getAdminUsers: async () => {
    const { handleError } = useApiErrorHandler();
    try {
      const response = await apiClient('/api/admin/users', 'AdminService GetUsers');
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch users');
    } catch (error) {
      handleError(error, 'Failed to fetch users.');
      throw error;
    }
  },

  getAdminCitiesSimple: async () => {
    const { handleError } = useApiErrorHandler();
    try {
      const response = await apiClient('/api/admin/cities', 'AdminService GetCitiesSimple');
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch cities');
    } catch (error) {
      handleError(error, 'Failed to fetch cities.');
      throw error;
    }
  },

  getAdminNeighborhoods: async () => {
    const { handleError } = useApiErrorHandler();
    try {
      const response = await apiClient('/api/admin/neighborhoods', 'AdminService GetNeighborhoods');
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch neighborhoods');
    } catch (error) {
      handleError(error, 'Failed to fetch neighborhoods.');
      throw error;
    }
  },

  getAdminHashtags: async () => {
    const { handleError } = useApiErrorHandler();
    try {
      const response = await apiClient('/api/admin/hashtags', 'AdminService GetHashtags');
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch hashtags');
    } catch (error) {
      handleError(error, 'Failed to fetch hashtags.');
      throw error;
    }
  },

  getAdminData: async (resource) => {
    const { handleError } = useApiErrorHandler();
    try {
      const response = await apiClient(`/api/admin/${resource}`, `AdminService Get${resource}`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || `Failed to fetch ${resource}`);
    } catch (error) {
      handleError(error, `Failed to fetch ${resource}.`);
      throw error;
    }
  },

  createResource: async (type, payload) => {
    const { handleError } = useApiErrorHandler();
    try {
      const response = await apiClient(`/api/admin/${type}`, `AdminService Create${type}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (response.success && response.data) {
        return response;
      }
      throw new Error(response.error || `Failed to create ${type}`);
    } catch (error) {
      handleError(error, `Failed to create ${type}.`);
      throw error;
    }
  },

  bulkAddItems: async (items) => {
    const { handleError } = useApiErrorHandler();
    try {
      const response = await apiClient('/api/admin/bulk-add', 'AdminService BulkAddItems', {
        method: 'POST',
        body: JSON.stringify(items),
      });
      if (response.success && response.data) {
        return response;
      }
      throw new Error(response.error || 'Failed to bulk add items');
    } catch (error) {
      handleError(error, 'Failed to bulk add items.');
      throw error;
    }
  },
};

export default adminService;