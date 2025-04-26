/* src/services/restaurantService.js */
import apiClient, { ApiError } from './apiClient.js';
import useApiErrorHandler from '@/hooks/useApiErrorHandler';

export const restaurantService = {
  getRestaurantDetails: async (restaurantId) => {
    const { handleError } = useApiErrorHandler();
    if (!restaurantId) {
      throw new Error('Restaurant ID is required');
    }
    try {
      const response = await apiClient(`/api/restaurants/${encodeURIComponent(String(restaurantId))}`, 'RestaurantService GetDetails');
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch restaurant details');
    } catch (error) {
      handleError(error, 'Failed to fetch restaurant details.');
      throw error;
    }
  },

  getRestaurantById: async (restaurantId) => {
    const { handleError } = useApiErrorHandler();
    if (!restaurantId) {
      throw new Error('Restaurant ID is required');
    }
    try {
      const response = await apiClient(`/api/restaurants/${encodeURIComponent(String(restaurantId))}`, 'RestaurantService GetById');
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch restaurant by ID');
    } catch (error) {
      handleError(error, 'Failed to fetch restaurant by ID.');
      throw error;
    }
  },

  searchRestaurants: async (params) => {
    const { handleError } = useApiErrorHandler();
    try {
      const queryParams = new URLSearchParams(params);
      const response = await apiClient(`/api/restaurants?${queryParams.toString()}`, 'RestaurantService Search');
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to search restaurants');
    } catch (error) {
      handleError(error, 'Failed to search restaurants.');
      throw error;
    }
  },
};

export default restaurantService;