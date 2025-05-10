/* src/services/restaurantService.js */
import apiClient from './apiClient.js';
import { handleApiResponse, validateId } from '@/utils/serviceHelpers.js';
import { logError, logDebug } from '@/utils/logger.js';

export const restaurantService = {
  getRestaurantDetails: async (restaurantId) => {
    const id = validateId(restaurantId, 'restaurantId');
    return handleApiResponse(
      () => apiClient.get(`/restaurants/${id}`),
      'RestaurantService GetDetails'
    );
  },

  getRestaurantById: async (restaurantId) => {
    const id = validateId(restaurantId, 'restaurantId');
    return handleApiResponse(
      () => apiClient.get(`/restaurants/${id}`),
      'RestaurantService GetById'
    );
  },

  searchRestaurants: async (params) => {
    return handleApiResponse(
      () => apiClient.get('/restaurants', { params }),
      'RestaurantService Search'
    );
  },
};

// Only use named export for consistency