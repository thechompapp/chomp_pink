/* src/services/restaurantService.js */
// Renamed from restauantService.js to restaurantService.js
import apiClient from '@/services/apiClient'; // Corrected Path

const getRestaurantDetails = async (restaurantId) => {
     if (!restaurantId) throw new Error("Restaurant ID required.");
     // Fetch details from the correct backend endpoint
     const response = await apiClient(`/api/restaurants/${restaurantId}`, `RestaurantService Details ${restaurantId}`);
     // Check if the response indicates not found (you might need to adjust based on API behavior)
     if (!response || typeof response.id === 'undefined') {
          // Throw a specific error for not found cases, potentially with a status
           const error = new Error(`Restaurant not found.`);
           error.status = 404; // Add status for better error handling downstream
           throw error;
     }
     // Ensure tags and dishes are arrays, and adapt dish tags
     return {
          ...response,
          tags: Array.isArray(response.tags) ? response.tags : [],
          // Ensure dishes is an array and map through them safely
          dishes: Array.isArray(response.dishes)
              ? response.dishes
                    .filter(d => d && typeof d.id !== 'undefined') // Filter out invalid dish objects
                    .map(d => ({ ...d, tags: Array.isArray(d.tags) ? d.tags : [] })) // Ensure dish tags are arrays
              : [],
       };
};

// Add other restaurant-related API calls here if they exist
// e.g., search restaurants, get restaurants by filter, etc.

export const restaurantService = {
    getRestaurantDetails,
};