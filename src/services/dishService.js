// src/services/dishService.js
import apiClient from '@/services/apiClient.js'; // Corrected Path

const getDishDetails = async (dishId) => {
     if (!dishId) throw new Error("Dish ID required.");
     const response = await apiClient(`/api/dishes/${dishId}`, `DishService Details ${dishId}`);
      if (!response || typeof response.id === 'undefined') {
           throw new Error(`Dish not found.`); // Specific error for not found
      }
     // Ensure tags is an array
     return { ...response, tags: Array.isArray(response.tags) ? response.tags : [] };
};

// Add other dish-related API calls here if they exist (e.g., search, list)

export const dishService = {
    getDishDetails,
};