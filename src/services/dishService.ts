/* src/services/dishService.ts */
import apiClient from '@/services/apiClient'; // Use .ts version
// Assume DishDetail type exists
import type { DishDetail } from '@/types'; // Example path using central types index

// Define service function with types
const getDishDetails = async (dishId: number | string): Promise<DishDetail> => {
     if (!dishId) throw new Error("Dish ID required.");

     const endpoint = `/api/dishes/${encodeURIComponent(dishId)}`;
     const context = `DishService Details ${dishId}`;

     try {
        // Expecting { data: DishDetail } from API response structure
        const response = await apiClient<DishDetail>(endpoint, context);
        const dishData = response.data; // Access data property

        // Check if the data field within the response actually contains the dish detail
        if (!dishData || typeof dishData.id === 'undefined') {
           // Handle case where API returns 200 but no data (or data is not the expected DishDetail)
            const notFoundError = new Error(`Dish not found or invalid data received.`);
            (notFoundError as any).status = 404;
            throw notFoundError;
        }

        // Ensure tags is an array on the received data
        const formattedData: DishDetail = {
            ...dishData,
            tags: Array.isArray(dishData.tags) ? dishData.tags : []
        };
        return formattedData;

     } catch (error: unknown) { // Catch unknown error type
          // Type guard to check if it's an error with status
          if (error instanceof Error && (error as any).status === 404) {
             const notFoundError = new Error(`Dish not found.`); // Specific message
             (notFoundError as any).status = 404;
             throw notFoundError;
          }
          console.error(`[DishService] Error fetching details for ${dishId}:`, error);
          // Re-throw other errors to be handled by useQuery/caller
          if (error instanceof Error) {
               throw error; // Re-throw original error
          } else {
               // Create a new error for unknown types
               throw new Error(`An unexpected error occurred fetching dish ${dishId}`);
          }
     }
};

// Export the typed service object
export const dishService = {
    getDishDetails,
    // Add other dish-related API calls here if needed
};