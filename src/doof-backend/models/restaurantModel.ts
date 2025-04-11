/* src/doof-backend/models/restaurantModel.ts */
import db from '../db/index.js';
import type { QueryResult, QueryResultRow } from 'pg';
import type { Dish } from './dishModel.js';

// --- Interfaces ---
export interface Restaurant extends QueryResultRow {
    id: number;
    name: string;
    city_id?: number | null;
    city_name?: string | null;
    neighborhood_id?: number | null;
    neighborhood_name?: string | null;
    address?: string | null;
    google_place_id?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    adds?: number;
    created_at?: Date | string;
    updated_at?: Date | string;
    tags?: string[];
}
export interface RestaurantDetail extends Restaurant {
    dishes: Dish[];
}
interface RawRestaurantRow extends QueryResultRow {
    id: number | string;
    name: string;
    city_id?: number | string | null;
    city_name?: string | null;
    neighborhood_id?: number | string | null;
    neighborhood_name?: string | null;
    address?: string | null;
    google_place_id?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    adds?: number | string | null;
    created_at?: Date | string;
    updated_at?: Date | string;
    tags?: string[] | null;
}
interface RawDishRow extends QueryResultRow {
    id: number | string;
    name: string;
    adds?: number | string | null;
    created_at?: Date | string;
    restaurant_id: number | string;
    tags?: string[] | null;
    city_name?: string | null;
    neighborhood_name?: string | null;
}


// --- Helper Functions ---

export const formatRestaurantForResponse = (restaurant: RawRestaurantRow | undefined): Restaurant | null => {
    // FIXED: Restored full function body
    if (!restaurant) return null;
    try {
        const tagsArray = Array.isArray(restaurant.tags)
            ? restaurant.tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0)
            : [];

        return {
            ...restaurant,
            id: parseInt(String(restaurant.id), 10),
            city_id: restaurant.city_id ? parseInt(String(restaurant.city_id), 10) : null,
            neighborhood_id: restaurant.neighborhood_id ? parseInt(String(restaurant.neighborhood_id), 10) : null,
            adds: restaurant.adds != null ? parseInt(String(restaurant.adds), 10) : 0,
            tags: tagsArray,
            latitude: restaurant.latitude != null ? parseFloat(String(restaurant.latitude)) : null,
            longitude: restaurant.longitude != null ? parseFloat(String(restaurant.longitude)) : null,
            created_at: restaurant.created_at,
            updated_at: restaurant.updated_at,
        };
    } catch (e) {
        console.error(`[RestaurantModel Format Error] Failed to format restaurant row:`, restaurant, e);
        return null;
    }
};

const formatDishForRestaurantDetail = (dish: RawDishRow | undefined): Dish | null => {
    // FIXED: Restored full function body
     if (!dish) return null;
     try {
        const tagsArray = Array.isArray(dish.tags)
            ? dish.tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0)
            : [];
        const createdAtString = dish.created_at instanceof Date
            ? dish.created_at.toISOString()
            : typeof dish.created_at === 'string' ? dish.created_at : undefined;

         return {
            id: parseInt(String(dish.id), 10),
            name: dish.name || 'Unnamed Dish',
            adds: dish.adds != null ? parseInt(String(dish.adds), 10) : 0,
            restaurant_id: parseInt(String(dish.restaurant_id), 10),
            tags: tagsArray,
            created_at: createdAtString!,
            restaurant_name: (dish as any).restaurant_name || undefined,
            city: dish.city_name || null,
            neighborhood: dish.neighborhood_name || null,
            city_name: dish.city_name || undefined,
            neighborhood_name: dish.neighborhood_name || undefined,
         };
     } catch(e) {
         console.error(`[RestaurantModel Format Error] Failed to format dish row (for restaurant detail):`, dish, e);
         return null;
     }
};

// --- Model Functions ---

export const findRestaurantByIdWithDetails = async (id: number | string): Promise<RestaurantDetail | null> => {
    // FIXED: Restored full function body
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId) || numericId <= 0) {
         console.warn(`[RestaurantModel findRestaurantByIdWithDetails] Invalid ID: ${id}`);
         return null;
     }
    console.log(`[RestaurantModel] Finding restaurant details for ID: ${numericId}`);
    const restaurantQuery = `
      SELECT r.*,
             COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}'::text[]) as tags
      FROM Restaurants r
      LEFT JOIN RestaurantHashtags rh ON r.id = rh.restaurant_id
      LEFT JOIN Hashtags h ON rh.hashtag_id = h.id
      WHERE r.id = $1
      GROUP BY r.id;
    `;
    const dishQuery = `
      SELECT d.*,
             COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}'::text[]) as tags
      FROM Dishes d
      LEFT JOIN DishHashtags dh ON d.id = dh.dish_id
      LEFT JOIN Hashtags h ON dh.hashtag_id = h.id
      WHERE d.restaurant_id = $1
      GROUP BY d.id
      ORDER BY d.adds DESC NULLS LAST, d.name ASC;
    `;

    try {
        const [restaurantResult, dishResult] = await Promise.all([
             db.query<RawRestaurantRow>(restaurantQuery, [numericId]),
             db.query<RawDishRow>(dishQuery, [numericId])
        ]);

        if (restaurantResult.rows.length === 0) {
            return null;
        }

        const restaurant = formatRestaurantForResponse(restaurantResult.rows[0]);
        if (!restaurant) {
             console.error(`[RestaurantModel] Failed to format base restaurant data for ID: ${numericId}`);
             return null;
        }

        const dishes = (dishResult.rows || [])
            .map(formatDishForRestaurantDetail)
            .filter((dish): dish is Dish => dish !== null);

        const restaurantDetail: RestaurantDetail = {
            ...restaurant,
            dishes: dishes,
        };

        return restaurantDetail;
    } catch (error) {
         console.error(`[RestaurantModel findRestaurantByIdWithDetails] Error fetching details for ID ${numericId}:`, error);
         throw error;
    }
};

export const findRestaurantById = async (id: number | string): Promise<Restaurant | null> => {
    // FIXED: Restored full function body
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId) || numericId <= 0) {
         console.warn(`[RestaurantModel findRestaurantById] Invalid ID: ${id}`);
         return null;
     }
    console.log(`[RestaurantModel] Finding restaurant basic info for ID: ${numericId}`);
    const query = `
        SELECT r.*,
               COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}'::text[]) as tags
        FROM Restaurants r
        LEFT JOIN RestaurantHashtags rh ON r.id = rh.restaurant_id
        LEFT JOIN Hashtags h ON rh.hashtag_id = h.id
        WHERE r.id = $1
        GROUP BY r.id;
    `;
    try {
        const result = await db.query<RawRestaurantRow>(query, [numericId]);
        return formatRestaurantForResponse(result.rows[0]);
    } catch (error) {
         console.error(`[RestaurantModel findRestaurantById] Error fetching basic info for ID ${numericId}:`, error);
         throw error;
    }
};

export const createRestaurant = async (restaurantData: Partial<Restaurant>): Promise<Restaurant | null> => {
     // ... (implementation remains the same) ...
      console.log('[RestaurantModel] Creating restaurant:', restaurantData);
     const { name, city_id /* ... others */ } = restaurantData;
     if (!name) throw new Error("Restaurant name is required for creation.");
     const query = `
        INSERT INTO restaurants (name, city_id, neighborhood_id, city_name, neighborhood_name, address, google_place_id, latitude, longitude, adds, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, NOW(), NOW())
        ON CONFLICT (name, city_id) DO NOTHING
        RETURNING *;
     `;
     const params: any[] = [
        name, city_id ?? null, restaurantData.neighborhood_id ?? null, restaurantData.city_name ?? null, restaurantData.neighborhood_name ?? null,
        restaurantData.address ?? null, restaurantData.google_place_id ?? null, restaurantData.latitude ?? null, restaurantData.longitude ?? null
     ];
     try {
        const result = await db.query<RawRestaurantRow>(query, params);
        if (result.rows.length === 0) {
            // Handle conflict
            const existingQuery = `
                SELECT r.*, COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}'::text[]) as tags
                FROM Restaurants r
                LEFT JOIN RestaurantHashtags rh ON r.id = rh.restaurant_id
                LEFT JOIN Hashtags h ON rh.hashtag_id = h.id
                WHERE r.name = $1 AND r.city_id ${city_id ? '= $2' : 'IS NULL'}
                GROUP BY r.id;
            `;
            const existingParams = city_id ? [name, city_id] : [name];
            const existingResult = await db.query<RawRestaurantRow>(existingQuery, existingParams);
            return formatRestaurantForResponse(existingResult.rows[0]);
        }
        const createdRestaurant = formatRestaurantForResponse(result.rows[0]);
         if (createdRestaurant && !createdRestaurant.tags) createdRestaurant.tags = [];
        return createdRestaurant;
     } catch (error) {
         console.error(`[RestaurantModel createRestaurant] Error creating restaurant "${name}":`, error);
         throw error;
     }
};

export const updateRestaurant = async (id: number | string, restaurantData: Partial<Restaurant>): Promise<Restaurant | null> => {
    // FIXED: Restored full function body
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId) || numericId <= 0) {
        console.warn(`[RestaurantModel Update] Invalid ID: ${id}`);
        return null;
    }
    console.log(`[RestaurantModel] Updating restaurant ID: ${numericId}`, restaurantData);

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const addField = (dbField: string, value: any) => {
        if (value !== undefined) {
            fields.push(`"${dbField}" = $${paramIndex++}`);
            values.push(value === null ? null : value);
        }
    };

    addField('name', restaurantData.name);
    addField('city_id', restaurantData.city_id);
    addField('neighborhood_id', restaurantData.neighborhood_id);
    addField('city_name', restaurantData.city_name);
    addField('neighborhood_name', restaurantData.neighborhood_name);
    addField('address', restaurantData.address);
    addField('google_place_id', restaurantData.google_place_id);
    addField('latitude', restaurantData.latitude);
    addField('longitude', restaurantData.longitude);
    // addField('adds', restaurantData.adds);

    if (fields.length === 0) {
         console.warn(`[RestaurantModel Update] No valid fields provided for update on restaurant ${numericId}`);
         return findRestaurantById(numericId);
    }

    fields.push(`"updated_at" = NOW()`);

    const query = `
        UPDATE Restaurants
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex++}
        RETURNING id;
    `;
    values.push(numericId);

     try {
         const result = await db.query<{ id: number }>(query, values);
         if (result.rowCount === 0) {
              console.warn(`[RestaurantModel Update] Restaurant with ID ${numericId} not found or no rows updated.`);
              return null;
         }
         return findRestaurantById(result.rows[0].id);
     } catch (error) {
         console.error(`[RestaurantModel updateRestaurant] Error updating restaurant ${numericId}:`, error);
         if ((error as any)?.code === '23505') {
             const field = (error as any).constraint?.includes('google_place_id') ? 'Google Place ID' : 'Name in this city';
             throw new Error(`Update failed: ${field} conflicts with an existing record.`);
         }
         throw error;
     }
};

export const deleteRestaurant = async (id: number | string): Promise<boolean> => {
    // FIXED: Restored full function body
     const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
     if (isNaN(numericId) || numericId <= 0) {
         console.warn(`[RestaurantModel deleteRestaurant] Invalid ID: ${id}`);
         return false;
     }
    console.log(`[RestaurantModel] Deleting restaurant ID: ${numericId}`);
    const query = 'DELETE FROM Restaurants WHERE id = $1 RETURNING id';
    try {
        const result = await db.query(query, [numericId]);
        return (result.rowCount ?? 0) > 0;
    } catch (error) {
         console.error(`[RestaurantModel deleteRestaurant] Error deleting restaurant ${numericId}:`, error);
         if ((error as any)?.code === '23503') {
            console.warn(`[RestaurantModel deleteRestaurant] Cannot delete restaurant ${numericId} due to foreign key constraints.`);
            throw new Error(`Cannot delete restaurant: It is referenced by other items (e.g., dishes).`);
         }
         throw error;
    }
};