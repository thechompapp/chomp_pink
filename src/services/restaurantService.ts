/* src/services/restaurantService.ts */
import apiClient from '@/services/apiClient'; // Use .ts version
// Assume RestaurantDetail type exists, potentially extending a base Restaurant type
import type { RestaurantDetail, Dish } from '@/types'; // Import from central index

// Define service function with types
const getRestaurantDetails = async (restaurantId: number | string): Promise<RestaurantDetail> => {
     if (!restaurantId) throw new Error('Restaurant ID required.');

     const endpoint = `/api/restaurants/${encodeURIComponent(restaurantId)}`;
     const context = `RestaurantService Details ${restaurantId}`;

     try {
        // Expecting { data: RestaurantDetail } from API response structure
        // apiClient handles the { data: ... } wrapper
        const response = await apiClient<RestaurantDetail>(endpoint, context);
        const restaurantData = response.data; // Access data property

        // Check if the data field within the response actually contains the restaurant detail
        if (!restaurantData || typeof restaurantData.id === 'undefined') {
             // Handle case where API returns 200 but no data (should ideally be a 404 from backend)
             const notFoundError = new Error(`Restaurant not found or invalid data received.`);
             (notFoundError as any).status = 404; // Simulate a 404 status
             throw notFoundError;
        }

        // Ensure nested arrays (tags, dishes, dish tags) are arrays
        // Use type assertion carefully if backend might return slightly different dish structure here
        const formattedDishes = (Array.isArray(restaurantData.dishes) ? restaurantData.dishes : [])
              // Filter out potentially invalid dish entries
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
             const notFoundError = new Error(`Restaurant not found.`); // Specific message
             (notFoundError as any).status = 404;
             throw notFoundError;
         }
         console.error(`[RestaurantService] Error fetching details for ${restaurantId}:`, error);
         // Re-throw other errors to be handled by useQuery/caller
          if (error instanceof Error) {
               throw error; // Re-throw original error if it's already an Error instance
          } else {
               // Create a new error for unknown types
               throw new Error(`An unexpected error occurred fetching restaurant ${restaurantId}`);
          }
     }
};

// Export the typed service object
export const restaurantService = {
    getRestaurantDetails,
    // Add other restaurant-related functions here (e.g., searchRestaurants) with types
};