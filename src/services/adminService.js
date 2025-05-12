/* src/services/adminService.js */
import apiClient from './apiClient.js';
import { handleApiResponse } from '@/utils/serviceHelpers.js';
import { logError } from '@/utils/logger.js';

export const adminService = {
  getAdminRestaurants: async () => {
    return handleApiResponse(
      () => apiClient.get('/admin/restaurants'),
      'AdminService GetRestaurants'
    ).catch(error => {
      logError('Failed to fetch admin restaurants:', error);
      throw error;
    });
  },

  getAdminDishes: async () => {
    return handleApiResponse(
      () => apiClient.get('/admin/dishes'),
      'AdminService GetDishes'
    ).catch(error => {
      logError('Failed to fetch admin dishes:', error);
      throw error;
    });
  },

  getAdminUsers: async () => {
    return handleApiResponse(
      () => apiClient.get('/admin/users'),
      'AdminService GetUsers'
    ).catch(error => {
      logError('Failed to fetch admin users:', error);
      throw error;
    });
  },

  getAdminCitiesSimple: async () => {
    return handleApiResponse(
      () => apiClient.get('/admin/cities'),
      'AdminService GetCitiesSimple'
    ).catch(error => {
      logError('Failed to fetch admin cities:', error);
      throw error;
    });
  },

  getAdminNeighborhoods: async () => {
    return handleApiResponse(
      () => apiClient.get('/admin/neighborhoods'),
      'AdminService GetNeighborhoods'
    ).catch(error => {
      logError('Failed to fetch admin neighborhoods:', error);
      throw error;
    });
  },

  getAdminHashtags: async () => {
    return handleApiResponse(
      () => apiClient.get('/admin/hashtags'),
      'AdminService GetHashtags'
    ).catch(error => {
      logError('Failed to fetch admin hashtags:', error);
      throw error;
    });
  },

  getAdminData: async (resource) => {
    return handleApiResponse(
      () => apiClient.get(`/admin/${resource}`),
      `AdminService Get${resource}`
    ).catch(error => {
      logError(`Failed to fetch admin ${resource}:`, error);
      throw error;
    });
  },

  createResource: async (type, payload) => {
    return handleApiResponse(
      () => apiClient.post(`/admin/${type}`, payload),
      `AdminService Create${type}`
    ).catch(error => {
      logError(`Failed to create ${type}:`, error);
      throw error;
    });
  },

  bulkAddItems: async (items) => {
    return handleApiResponse(
      () => apiClient.post('/admin/bulk/items', items),
      'AdminService BulkAddItems'
    ).catch(error => {
      logError('Failed to bulk add items:', error);
      throw error;
    });
  },
};

// Only use named export for consistency