/* src/services/restaurantService.ts */
import apiClient from '@/services/apiClient';
import type { RestaurantDetail, Dish } from '@/types';

const getRestaurantDetails = async (restaurantId: number | string): Promise<RestaurantDetail> => {
    if (!restaurantId) throw new Error('Restaurant ID required.');

    const endpoint = `/api/restaurants/${encodeURIComponent(restaurantId)}`;
    const context = `RestaurantService Details ${restaurantId}`;

    try {
        const response = await apiClient<RestaurantDetail>(endpoint, context);
        const restaurantData = response.data;

        if (!restaurantData || typeof restaurantData.id === 'undefined') {
            const notFoundError = new Error(`Restaurant not found or invalid data received.`);
            (notFoundError as any).status = 404;
            throw notFoundError;
        }

        const formattedDishes = (Array.isArray(restaurantData.dishes) ? restaurantData.dishes : [])
            .filter((d): d is Dish => d != null && typeof d.id !== 'undefined')
            .map((d: Dish) => ({
                ...d,
                tags: Array.isArray(d.tags) ? d.tags : [],
            }));

        const formattedData: RestaurantDetail = {
            ...restaurantData,
            tags: Array.isArray(restaurantData.tags) ? restaurantData.tags : [],
            dishes: formattedDishes,
        };
        return formattedData;

    } catch (error: unknown) {
        if (error instanceof Error && (error as any).status === 404) {
            const notFoundError = new Error(`Restaurant not found.`);
            (notFoundError as any).status = 404;
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