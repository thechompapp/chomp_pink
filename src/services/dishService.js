/* src/services/dishService.js */
import apiClient from './apiClient.js';
import { handleApiResponse, validateId } from '@/utils/serviceHelpers.js';
import { logError, logDebug } from '@/utils/logger.js';

export const dishService = {
  getDishDetails: async (dishId) => {
    const id = validateId(dishId, 'dishId');
    return handleApiResponse(
      () => apiClient.get(`/dishes/${id}`),
      'DishService GetDetails'
    );
  },

  searchDishes: async (params) => {
    return handleApiResponse(
      () => apiClient.get('/dishes', { params }),
      'DishService Search'
    );
  },

  getDishesByRestaurantId: async (restaurantId) => {
    const id = validateId(restaurantId, 'restaurantId');
    return handleApiResponse(
      () => apiClient.get('/dishes', { params: { restaurantId: id } }),
      'DishService GetByRestaurantId'
    );
  },
};

// Only use named export for consistency