/* main/src/services/dishService.js */
/* ADDED: verifyDishExists function */
/* Other functions remain unchanged */
import apiClient, { ApiError } from '@/services/apiClient'; // Use .js extension and import ApiError

// REMOVED: import type { DishDetail } from '@/types'; // Removed type import

/**
 * Fetches detailed information for a specific dish.
 * @param {number|string} dishId - The ID of the dish to fetch.
 * @returns {Promise<object>} A promise that resolves to the dish details object.
 * @throws {ApiError} If the dish is not found (404) or another API error occurs.
 */
const getDishDetails = async (dishId) => { // REMOVED: Type hints & Promise return type
    const numericId = Number(dishId); // Convert to number for validation
    if (isNaN(numericId) || numericId <= 0) {
        throw new ApiError('Invalid Dish ID provided.', 400); // Use ApiError
    }

    const endpoint = `/api/dishes/${numericId}`; // Use numeric ID
    const context = `DishService Details ${numericId}`;

    try {
        // Assume apiClient returns { success: boolean, data: any, error: string|null, status: number|null }
        const response = await apiClient(endpoint, context); // REMOVED: Generic type

        // Check the structure returned by your specific /api/dishes/:id endpoint
        // Assuming it returns { success: true, data: DishDetailObject }
        const dishData = response.data;

        if (!response.success || !dishData || typeof dishData.id === 'undefined') {
            const status = response.status === 404 ? 404 : (response.status || 500);
            const message = response.error || `Dish not found or invalid data received for ID ${numericId}.`;
            throw new ApiError(message, status, response);
        }

        // Basic formatting/validation (ensure tags is array, ids are numbers)
        const formattedData = {
            ...dishData,
            id: Number(dishData.id),
            restaurant_id: dishData.restaurant_id ? Number(dishData.restaurant_id) : null,
            adds: Number(dishData.adds ?? 0),
            tags: Array.isArray(dishData.tags) ? dishData.tags.filter(t => typeof t === 'string') : [],
            // Ensure other expected fields exist or have defaults
             city: dishData.city_name || dishData.city || null,
             neighborhood: dishData.neighborhood_name || dishData.neighborhood || null,
             restaurant_name: dishData.restaurant_name || 'Unknown Restaurant', // Provide default
        };

        return formattedData; // Return the formatted dish data

    } catch (error) {
        console.error(`[${context}] Error fetching dish details:`, error);
        // Re-throw the error (it might already be an ApiError from apiClient)
        if (error instanceof ApiError) {
            throw error;
        } else {
            // Wrap other errors in ApiError for consistency
            throw new ApiError(
                error instanceof Error ? error.message : 'An unexpected error occurred',
                error.status || 500, // Use status if available
                error // Attach original error if needed
            );
        }
    }
};

/**
 * Checks if a dish with a specific name exists for a given restaurant ID.
 * @param {string} name - The name of the dish.
 * @param {number|string} restaurantId - The ID of the restaurant.
 * @returns {Promise<boolean>} - True if the dish exists, false otherwise or on error.
 */
const verifyDishExists = async (name, restaurantId) => {
    const numericRestId = Number(restaurantId);
    if (!name || !restaurantId || isNaN(numericRestId) || numericRestId <= 0) {
        console.warn('[DishService verifyDishExists] Invalid input:', { name, restaurantId });
        return false; // Cannot verify with invalid input
    }

    const queryParams = new URLSearchParams({
        name: name,
        restaurant_id: String(numericRestId),
    });
    const endpoint = `/api/dishes/verify?${queryParams.toString()}`;
    const context = `DishService Verify Existence`;

    try {
        const response = await apiClient(endpoint, context);

        // Check for success and the expected data structure
        if (response.success && response.data && typeof response.data.exists === 'boolean') {
            return response.data.exists;
        } else {
            console.error(`[${context}] Failed or invalid response:`, response);
            return false; // Assume not found or error occurred if response is invalid
        }
    } catch (error) {
        console.error(`[${context}] API call error:`, error);
        return false; // Assume not found on API error
    }
};


export const dishService = {
    getDishDetails,
    verifyDishExists, // Export the new function
};