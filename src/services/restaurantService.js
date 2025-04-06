/* src/services/restaurantService.js */
// Renamed from restauantService.js to restaurantService.js
import apiClient from '@/services/apiClient'; // Corrected Path

const getRestaurantDetails = async (restaurantId) => {
     if (!restaurantId) throw new Error("Restaurant ID required.");
     // Fetch details from the correct backend endpoint
     try {
         const response = await apiClient(`/api/restaurants/${restaurantId}`, `RestaurantService Details ${restaurantId}`);

         // Check if the response indicates not found (backend should return 404 which apiClient handles)
         if (!response || typeof response.id === 'undefined') {
              // This case might occur if backend returns 200 OK with empty/invalid data
               throw new Error(`Restaurant not found or invalid data received.`);
         }
         // Ensure tags and dishes are arrays, and adapt dish tags
         return {
              ...response,
              tags: Array.isArray(response.tags) ? response.tags : [],
              // Ensure dishes is an array and map through them safely, filtering invalid ones
              dishes: Array.isArray(response.dishes)
                  ? response.dishes
                        .filter(d => d && d.id != null) // Filter out invalid dish objects
                        .map(d => ({ ...d, tags: Array.isArray(d.tags) ? d.tags : [] })) // Ensure dish tags are arrays
                  : [],
           };
     } catch (error) {
         // Handle specific errors or re-throw
         if (error.message.includes("Not Found") || error.message.includes("404")) {
             const notFoundError = new Error(`Restaurant not found.`);
             notFoundError.status = 404; // Add status for better handling downstream
             throw notFoundError;
         }
         console.error(`[RestaurantService] Error fetching details for ${restaurantId}:`, error);
         throw error; // Re-throw other errors
     }
};

// Add other restaurant-related API calls here if they exist
// e.g., search restaurants, get restaurants by filter, etc.

export const restaurantService = {
    getRestaurantDetails,
};