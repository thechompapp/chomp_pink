/* src/doof-backend/models/restaurantModel.ts */
import db from '../db/index.js'; // Keep .js extension for compiled JS import
import type { QueryResult, QueryResultRow } from 'pg'; // Import types from pg
// Correctly import Dish type from its .ts file (Node/TS handles resolution)
import type { Dish } from './dishModel';

// --- Interfaces ---

// Interface for basic restaurant data (used in lists, search results)
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

// Interface for detailed restaurant view, including dishes
export interface RestaurantDetail extends Restaurant {
    dishes: Dish[]; // Array of Dish objects
}

// Interface for raw data from Restaurant table query
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
    tags?: string[] | null; // Tags might come directly aggregated
}

// Interface for raw data from Dish table query (within restaurant context)
interface RawDishRow extends QueryResultRow {
    id: number | string;
    name: string;
    adds?: number | string | null;
    created_at?: Date | string;
    restaurant_id: number | string; // Foreign key
    tags?: string[] | null; // Tags might come directly aggregated
     // Add fields needed for DishCard if joined in restaurant details query
     city_name?: string | null;
     neighborhood_name?: string | null;
}


// --- Helper Functions ---

// Formats raw DB row into the standard Restaurant type
const formatRestaurantForResponse = (restaurant: RawRestaurantRow | undefined): Restaurant | null => {
    if (!restaurant) return null;
    try {
        // Ensure tags is always an array, filtering out nulls/empty strings if necessary
        const tagsArray = Array.isArray(restaurant.tags)
            ? restaurant.tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0)
            : [];

        return {
            // Spread other potential columns first to allow specific overrides
            ...restaurant,
            id: parseInt(String(restaurant.id), 10),
            city_id: restaurant.city_id ? parseInt(String(restaurant.city_id), 10) : null,
            neighborhood_id: restaurant.neighborhood_id ? parseInt(String(restaurant.neighborhood_id), 10) : null,
            adds: restaurant.adds != null ? parseInt(String(restaurant.adds), 10) : 0,
            tags: tagsArray,
            latitude: restaurant.latitude != null ? parseFloat(String(restaurant.latitude)) : null,
            longitude: restaurant.longitude != null ? parseFloat(String(restaurant.longitude)) : null,
            // Ensure string dates are passed through, Date objects are fine too
            created_at: restaurant.created_at,
            updated_at: restaurant.updated_at,
        };
    } catch (e) {
        console.error(`[RestaurantModel Format Error] Failed to format restaurant row:`, restaurant, e);
        return null;
    }
};

// Formats raw DB row into the standard Dish type
// Note: This might be slightly different from the one in dishModel if the join structure differs
const formatDishForRestaurantDetail = (dish: RawDishRow | undefined): Dish | null => {
     if (!dish) return null;
     try {
        const tagsArray = Array.isArray(dish.tags)
            ? dish.tags.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0)
            : [];
         return {
            // Spread other potential columns
            ...dish,
            id: parseInt(String(dish.id), 10),
            restaurant_id: parseInt(String(dish.restaurant_id), 10), // Ensure restaurant_id is number
            adds: dish.adds != null ? parseInt(String(dish.adds), 10) : 0,
            tags: tagsArray,
            name: dish.name || 'Unnamed Dish',
            // Aliases often needed by frontend cards
            restaurant_name: dish.restaurant_name || undefined, // Could be passed in if querying dishes separately
            city: dish.city_name || null,
            neighborhood: dish.neighborhood_name || null,
            created_at: dish.created_at,
         };
     } catch(e) {
         console.error(`[RestaurantModel Format Error] Failed to format dish row (for restaurant detail):`, dish, e);
         return null;
     }
};

// --- Model Functions ---

export const findRestaurantByIdWithDetails = async (id: number | string): Promise<RestaurantDetail | null> => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId) || numericId <= 0) {
         console.warn(`[RestaurantModel findRestaurantByIdWithDetails] Invalid ID: ${id}`);
         return null;
     }
    console.log(`[RestaurantModel] Finding restaurant details for ID: ${numericId}`);
    const restaurantQuery = `
      SELECT r.*, -- Select all columns from restaurants
             COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}'::text[]) as tags
      FROM Restaurants r
      LEFT JOIN RestaurantHashtags rh ON r.id = rh.restaurant_id
      LEFT JOIN Hashtags h ON rh.hashtag_id = h.id
      WHERE r.id = $1
      GROUP BY r.id; -- Group by restaurant primary key
    `;
    const dishQuery = `
      SELECT d.*, -- Select all columns from dishes
             COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}'::text[]) as tags
             -- No need to join Restaurants table here if only dish data + tags needed
      FROM Dishes d
      LEFT JOIN DishHashtags dh ON d.id = dh.dish_id
      LEFT JOIN Hashtags h ON dh.hashtag_id = h.id
      WHERE d.restaurant_id = $1
      GROUP BY d.id -- Group by dish primary key
      ORDER BY d.adds DESC NULLS LAST, d.name ASC;
    `;

    try {
        const [restaurantResult, dishResult] = await Promise.all([
             db.query<RawRestaurantRow>(restaurantQuery, [numericId]),
             db.query<RawDishRow>(dishQuery, [numericId])
        ]);

        if (restaurantResult.rows.length === 0) {
            return null; // Not found
        }

        const restaurant = formatRestaurantForResponse(restaurantResult.rows[0]);
        if (!restaurant) {
             console.error(`[RestaurantModel] Failed to format base restaurant data for ID: ${numericId}`);
             return null; // Formatting failed
        }

        // Format dishes and filter out any null results from formatting errors
        const dishes = (dishResult.rows || [])
            .map(formatDishForRestaurantDetail) // Use the specific formatter if needed
            .filter((dish): dish is Dish => dish !== null);

        // Combine into RestaurantDetail type
        const restaurantDetail: RestaurantDetail = {
            ...restaurant,
            dishes: dishes,
        };

        return restaurantDetail;
    } catch (error) {
         console.error(`[RestaurantModel findRestaurantByIdWithDetails] Error fetching details for ID ${numericId}:`, error);
         throw error; // Re-throw for handler
    }
};

export const findRestaurantById = async (id: number | string): Promise<Restaurant | null> => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId) || numericId <= 0) {
         console.warn(`[RestaurantModel findRestaurantById] Invalid ID: ${id}`);
         return null;
     }
    console.log(`[RestaurantModel] Finding restaurant basic info for ID: ${numericId}`);
    // Fetch tags along with basic info if Restaurant type includes it
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

// Type the input data more strictly if possible, using Partial<Restaurant>
export const createRestaurant = async (restaurantData: Partial<Restaurant>): Promise<Restaurant | null> => {
     console.log('[RestaurantModel] Creating restaurant:', restaurantData);
     const { name, city_id, neighborhood_id, city_name, neighborhood_name, address, google_place_id, latitude, longitude } = restaurantData;

     // Basic validation
     if (!name) {
         throw new Error("Restaurant name is required for creation.");
     }

     const query = `
        INSERT INTO restaurants (name, city_id, neighborhood_id, city_name, neighborhood_name, address, google_place_id, latitude, longitude, adds, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, NOW(), NOW())
        ON CONFLICT (name, city_id) DO NOTHING
        RETURNING *;
     `;
     // Ensure nulls are passed correctly for optional fields
     const params = [
        name, city_id ?? null, neighborhood_id ?? null, city_name ?? null, neighborhood_name ?? null,
        address ?? null, google_place_id ?? null, latitude ?? null, longitude ?? null
     ];

     try {
        const result = await db.query<RawRestaurantRow>(query, params);
        if (result.rows.length === 0) {
            // Handle conflict - restaurant might already exist
            console.warn(`[RestaurantModel] Restaurant "${name}" in city ID ${city_id ?? 'N/A'} might already exist (ON CONFLICT).`);
            // Fetch the existing one including tags to return it
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
        // Fetch tags separately or modify query if needed for newly created restaurant
        const createdRestaurant = formatRestaurantForResponse(result.rows[0]);
         // If tags aren't returned by RETURNING *, fetch them if the type requires it
         if (createdRestaurant && !createdRestaurant.tags) {
            createdRestaurant.tags = []; // Initialize as empty array if needed
         }
        return createdRestaurant;
     } catch (error) {
         console.error(`[RestaurantModel createRestaurant] Error creating restaurant "${name}":`, error);
         throw error;
     }
};

export const updateRestaurant = async (id: number | string, restaurantData: Partial<Restaurant>): Promise<Restaurant | null> => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
     if (isNaN(numericId) || numericId <= 0) {
         console.warn(`[RestaurantModel Update] Invalid ID: ${id}`);
         return null;
     }
    console.log(`[RestaurantModel] Updating restaurant ID: ${numericId}`, restaurantData);

    // Build query dynamically based on provided fields
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Helper to add field if value is defined
    const addField = (dbField: string, value: any) => {
        // Check if the value is explicitly provided (not undefined)
        if (value !== undefined) {
            fields.push(`"${dbField}" = $${paramIndex++}`); // Quote column names
            // Handle potential null explicitly for optional fields
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
    // Only allow updating 'adds' if explicitly provided (be cautious)
    if (restaurantData.adds !== undefined) {
        addField('adds', restaurantData.adds);
    }
    // Note: Tags are handled via the junction table, not directly here.

    if (fields.length === 0) {
         console.warn(`[RestaurantModel Update] No valid fields provided for update on restaurant ${numericId}`);
         return findRestaurantById(numericId); // Return current data if no changes
    }

    fields.push(`"updated_at" = NOW()`); // Always update timestamp

    const query = `
        UPDATE Restaurants
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex++}
        RETURNING id; -- Only return ID, then refetch full data with tags
    `;
    values.push(numericId); // Add the ID for the WHERE clause

     try {
         const result = await db.query<{ id: number }>(query, values);
         if (result.rowCount === 0) {
              console.warn(`[RestaurantModel Update] Restaurant with ID ${numericId} not found or no rows updated.`);
              return null; // Return null if not found or no update occurred
         }
         // Refetch the full data including tags after successful update
         return findRestaurantById(result.rows[0].id);
     } catch (error) {
         console.error(`[RestaurantModel updateRestaurant] Error updating restaurant ${numericId}:`, error);
         throw error;
     }
};

export const deleteRestaurant = async (id: number | string): Promise<boolean> => {
     const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
     if (isNaN(numericId) || numericId <= 0) {
         console.warn(`[RestaurantModel deleteRestaurant] Invalid ID: ${id}`);
         return false;
     }
    console.log(`[RestaurantModel] Deleting restaurant ID: ${numericId}`);
    // Assumes ON DELETE CASCADE constraints are set up correctly in the DB (e.g., for dishes, hashtags)
    const query = 'DELETE FROM Restaurants WHERE id = $1 RETURNING id';
    try {
        const result = await db.query(query, [numericId]);
        return (result.rowCount ?? 0) > 0; // Check if a row was actually deleted
    } catch (error) {
         console.error(`[RestaurantModel deleteRestaurant] Error deleting restaurant ${numericId}:`, error);
         // Check for specific foreign key violation errors if necessary
         if ((error as any)?.code === '23503') {
            console.warn(`[RestaurantModel deleteRestaurant] Cannot delete restaurant ${numericId} due to foreign key constraints.`);
            throw new Error(`Cannot delete restaurant: It is referenced by other items (e.g., dishes).`);
         }
         throw error; // Re-throw other errors
    }
};