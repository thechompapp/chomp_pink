/* src/services/dishService.js */
import apiClient, { ApiError } from './apiClient.js';
import useApiErrorHandler from '@/hooks/useApiErrorHandler';

export const dishService = {
  getDishDetails: async (dishId) => {
    const { handleError } = useApiErrorHandler();
    if (!dishId) {
      throw new Error('Dish ID is required');
    }
    try {
      const response = await apiClient(`/api/dishes/${encodeURIComponent(String(dishId))}`, 'DishService GetDetails');
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch dish details');
    } catch (error) {
      handleError(error, 'Failed to fetch dish details.');
      throw error;
    }
  },

  searchDishes: async (params) => {
    const { handleError } = useApiErrorHandler();
    try {
      const queryParams = new URLSearchParams(params);
      const response = await apiClient(`/api/dishes?${queryParams.toString()}`, 'DishService Search');
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to search dishes');
    } catch (error) {
      handleError(error, 'Failed to search dishes.');
      throw error;
    }
  },

  getDishesByRestaurantId: async (restaurantId) => {
    const { handleError } = useApiErrorHandler();
    if (!restaurantId) {
      throw new Error('Restaurant ID is required');
    }
    try {
      const queryParams = new URLSearchParams({ restaurantId: String(restaurantId) });
      const response = await apiClient(`/api/dishes?${queryParams.toString()}`, 'DishService GetByRestaurantId');
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch dishes by restaurant ID');
    } catch (error) {
      handleError(error, 'Failed to fetch dishes by restaurant ID.');
      throw error;
    }
  },
};

export default dishService;