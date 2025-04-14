/* src/services/restaurantService.js */
/* REMOVED: All TypeScript syntax */
import apiClient from '@/services/apiClient';
// REMOVED: import type { RestaurantDetail, Dish } from '@/types'; // Removed this line

const getRestaurantDetails = async (restaurantId) => { // REMOVED: Type hints & Promise return type
    if (!restaurantId) throw new Error('Restaurant ID required.');

    const endpoint = `/api/restaurants/${encodeURIComponent(String(restaurantId))}`; // Use String()
    const context = `RestaurantService Details ${restaurantId}`;

    try {
        // Assume apiClient returns { success: boolean, data: any, error: string|null, status: number|null }
        const response = await apiClient/*REMOVED: <any>*/(endpoint, context);
        const restaurantData = response.data;

        // Basic JS check for valid response data
        if (!response.success || !restaurantData || typeof restaurantData.id === 'undefined') {
            const notFoundError = new Error(`Restaurant not found or invalid data received.`);
            notFoundError.status = response.status === 404 ? 404 : 500; // Use status from response or default
            throw notFoundError;
        }

        // Basic JS map and filter for dishes
        const formattedDishes/*REMOVED: : Dish[]*/ = (Array.isArray(restaurantData.dishes) ? restaurantData.dishes : [])
            .filter((d) => d != null && typeof d.id !== 'undefined') // Basic validity check
            .map((d) => ({
                ...d,
                tags: Array.isArray(d.tags) ? d.tags : [], // Ensure tags is array
                id: Number(d.id), // Ensure ID is number
                adds: Number(d.adds || 0) // Ensure adds is number
            }));

        // Construct final response data
        const formattedData/*REMOVED: : RestaurantDetail*/ = {
            ...restaurantData,
            id: Number(restaurantData.id), // Ensure ID is number
            adds: Number(restaurantData.adds || 0), // Ensure adds is number
            tags: Array.isArray(restaurantData.tags) ? restaurantData.tags : [], // Ensure tags is array
            dishes: formattedDishes,
            // Ensure other potentially null fields are handled if necessary
            rating: restaurantData.rating ?? null,
            primary_category: restaurantData.primary_category ?? null,
            phone: restaurantData.phone ?? null,
            website: restaurantData.website ?? null,
            hours: restaurantData.hours ?? null,
            instagram_handle: restaurantData.instagram_handle ?? null,
            transit_info: restaurantData.transit_info ?? null,
            the_take_review: restaurantData.the_take_review ?? null,
            the_take_reviewer_handle: restaurantData.the_take_reviewer_handle ?? null,
            the_take_reviewer_verified: restaurantData.the_take_reviewer_verified ?? false,
            featured_on_lists: Array.isArray(restaurantData.featured_on_lists) ? restaurantData.featured_on_lists : [],
            similar_places: Array.isArray(restaurantData.similar_places) ? restaurantData.similar_places : [],
        };
        return formattedData;

    } catch (error/*REMOVED: : unknown*/) {
        // Keep existing error handling
        if (error instanceof Error && error.status === 404) {
            const notFoundError = new Error(`Restaurant not found.`);
            notFoundError.status = 404;
            throw notFoundError;
        }
        console.error(`[RestaurantService] Error fetching details for ${restaurantId}:`, error);
        if (error instanceof Error) {
            throw error;
        } else {
            throw new Error(`An unexpected error occurred fetching restaurant ${restaurantId}`);
        }
    }
};

export const restaurantService = {
    getRestaurantDetails,
};