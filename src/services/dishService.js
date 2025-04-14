/* src/services/dishService.ts */
import apiClient from '@/services/apiClient';
import type { DishDetail } from '@/types';

const getDishDetails = async (dishId: number | string): Promise<DishDetail> => {
    if (!dishId) throw new Error("Dish ID required.");

    const endpoint = `/api/dishes/${encodeURIComponent(dishId)}`;
    const context = `DishService Details ${dishId}`;

    try {
        const response = await apiClient<DishDetail>(endpoint, context);
        const dishData = response.data;

        if (!dishData || typeof dishData.id === 'undefined') {
            const notFoundError = new Error(`Dish not found or invalid data received.`);
            (notFoundError as any).status = 404;
            throw notFoundError;
        }

        const formattedData: DishDetail = {
            ...dishData,
            tags: Array.isArray(dishData.tags) ? dishData.tags : []
        };
        return formattedData;

    } catch (error: unknown) {
        if (error instanceof Error && (error as any).status === 404) {
            const notFoundError = new Error(`Dish not found.`);
            (notFoundError as any).status = 404;
            throw notFoundError;
        }
        console.error(`[DishService] Error fetching details for ${dishId}:`, error);
        if (error instanceof Error) {
            throw error;
        } else {
            throw new Error(`An unexpected error occurred fetching dish ${dishId}`);
        }
    }
};

export const dishService = {
    getDishDetails,
};