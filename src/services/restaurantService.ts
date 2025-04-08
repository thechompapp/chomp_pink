/* src/services/restaurantService.ts */
import apiClient from '@/services/apiClient'; // Use .ts version
// Assume RestaurantDetail type exists, potentially extending a base Restaurant type
import type { Restaurant, RestaurantDetail } from '@/types/Restaurant'; // Example path
import type { Dish } from '@/types/Dish'; // Example path for Dish type

// Define service function with types
const getRestaurantDetails = async (restaurantId: number | string): Promise<RestaurantDetail> => {
     if (!restaurantId) throw new Error('Restaurant ID required.');

     const endpoint = `/api/restaurants/${encodeURIComponent(restaurantId)}`;
     const context = `RestaurantService Details ${restaurantId}`;

     try {
        // Expecting { data: RestaurantDetail } from API response structure
        const response = await apiClient<RestaurantDetail>(endpoint, context);

        // Check if the data field within the response actually contains the restaurant detail
        if (!response.data || typeof response.data.id === 'undefined') {
             // Handle case where API returns 200 but no data (should ideally be a 404 from backend)
             throw new Error(`Restaurant not found or invalid data received.`);
        }

        // Ensure nested arrays (tags, dishes, dish tags) are arrays
        const restaurantData = response.data;
        // Use type assertion carefully if backend might return slightly different dish structure here
        const formattedDishes = (Array.isArray(restaurantData.dishes) ? restaurantData.dishes : [])
              .filter((d): d is Dish => d != null && typeof d.id !== 'undefined') // Type guard
              .map((d: Dish) => ({
                  ...d,
                  tags: Array.isArray(d.tags) ? d.tags : [], // Ensure dish tags are arrays
              }));

        const formattedData: RestaurantDetail = {
            ...restaurantData,
            tags: Array.isArray(restaurantData.tags) ? restaurantData.tags : [],
            dishes: formattedDishes,
         };
        return formattedData;

     } catch (error: unknown) { // Catch unknown error type
         // Type guard to check if it's an error with status
         if (error instanceof Error && (error as any).status === 404) {
             const notFoundError = new Error(`Restaurant not found.`);
             (notFoundError as any).status = 404;
             throw notFoundError;
         }
         console.error(`[RestaurantService] Error fetching details for ${restaurantId}:`, error);
         // Re-throw other errors to be handled by useQuery/caller
          if (error instanceof Error) {
               throw error;
          } else {
               throw new Error(`An unexpected error occurred fetching restaurant ${restaurantId}`);
          }
     }
};

// Export the typed service object
export const restaurantService = {
    getRestaurantDetails,
    // Add other restaurant-related functions here (e.g., searchRestaurants) with types
};