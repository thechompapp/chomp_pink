/* main/src/services/dishService.js */
import apiClient, { ApiError } from '@/services/apiClient'; // Add the import here

// Helper functions for data formatting (if any)
const formatDish = (dish) => {
  // Implement dish formatting logic
  if (!dish || typeof dish.id !== 'number') {
    return null;
  }

  return {
    id: dish.id,
    name: dish.name,
    description: dish.description || null,
    price: dish.price || null,
    restaurant_id: dish.restaurant_id,
    restaurant_name: dish.restaurant_name || null,
    // Add other fields as needed
  };
};

// --- Service Functions ---
export const getDishes = async (params = {}) => {
  // Query parameters logic
  const queryParams = {};
  if (params.restaurantId) queryParams.restaurantId = String(params.restaurantId);

  const queryString = new URLSearchParams(queryParams).toString();
  const endpoint = `/api/dishes${queryString ? `?${queryString}` : ''}`;

  try {
    const response = await apiClient(endpoint, 'DishService Get Dishes');

    if (!response.success || !Array.isArray(response.data)) {
      throw new ApiError(response.error || 'Invalid dishes data format', response.status ?? 500);
    }

    return response.data.map(formatDish).filter(Boolean);
  } catch (error) {
    console.error('[DishService getDishes] Error:', error);
    throw error;
  }
};

export const getDishesByRestaurantId = async (restaurantId) => {
  if (!restaurantId) {
    throw new ApiError('Restaurant ID is required', 400);
  }

  const endpoint = `/api/restaurants/${encodeURIComponent(String(restaurantId))}/dishes`;

  try {
    const response = await apiClient(endpoint, 'DishService Get Restaurant Dishes');

    if (!response.success || !Array.isArray(response.data)) {
      throw new ApiError(response.error || 'Invalid restaurant dishes data format', response.status ?? 500);
    }

    return response.data.map(formatDish).filter(Boolean);
  } catch (error) {
    console.error(`[DishService getDishesByRestaurantId] Error for restaurant ${restaurantId}:`, error);
    throw error;
  }
};

export const getDishById = async (dishId) => {
  if (!dishId) {
    throw new ApiError('Dish ID is required', 400);
  }

  const endpoint = `/api/dishes/${encodeURIComponent(String(dishId))}`;

  try {
    const response = await apiClient(endpoint, 'DishService Get Dish');

    if (!response.success || !response.data) {
      throw new ApiError(response.error || `Dish not found with ID: ${dishId}`, response.status ?? 404);
    }

    const formatted = formatDish(response.data);
    if (!formatted) {
      throw new ApiError(`Invalid dish data for ID: ${dishId}`, 500);
    }

    return formatted;
  } catch (error) {
    console.error(`[DishService getDishById] Error for dish ${dishId}:`, error);
    throw error;
  }
};

// Additional service functions as needed

// Export as a service object
export const dishService = {
  getDishes,
  getDishesByRestaurantId,
  getDishById,
  // Include other functions here
};

// Default export
export default dishService;