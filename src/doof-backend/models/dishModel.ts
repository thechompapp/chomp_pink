/* src/doof-backend/models/dishModel.ts */
import db from '../db/index.js'; // Ensure .js extension
import type { QueryResult } from 'pg';

// Define Dish type locally or import if defined globally
export interface Dish {
    id: number;
    name: string;
    adds: number;
    created_at: string; // Or Date
    restaurant_id: number; // Dishes must belong to a restaurant
    restaurant_name?: string; // Optional, joined field
    city_name?: string; // Optional, joined field
    neighborhood_name?: string; // Optional, joined field
    tags?: string[]; // Use optional if tags are not always present/fetched
    // Aliases for frontend convenience
    city?: string | null;
    neighborhood?: string | null;
}

// Type for the raw DB row before formatting
interface RawDishRow extends Record<string, any> {
    id: number | string;
    name: string;
    adds?: number | string | null;
    created_at: string; // Or Date
    restaurant_id: number | string;
    restaurant_name?: string | null;
    city_name?: string | null;
    neighborhood_name?: string | null;
    tags?: string[] | null;
}

// Helper to safely format data from the database
const formatDishForResponse = (dishRow: RawDishRow | undefined): Dish | null => {
    if (!dishRow) return null;
    try {
        const tagsArray = Array.isArray(dishRow.tags)
            ? dishRow.tags.filter((tag): tag is string => typeof tag === 'string' && tag !== null)
            : [];

        return {
            id: parseInt(String(dishRow.id), 10),
            name: dishRow.name || 'Unnamed Dish',
            adds: dishRow.adds != null ? parseInt(String(dishRow.adds), 10) : 0,
            created_at: dishRow.created_at,
            restaurant_id: parseInt(String(dishRow.restaurant_id), 10), // Should always exist
            restaurant_name: dishRow.restaurant_name || undefined,
            city_name: dishRow.city_name || undefined,
            neighborhood_name: dishRow.neighborhood_name || undefined,
            tags: tagsArray,
            // Add aliases
            city: dishRow.city_name || null,
            neighborhood: dishRow.neighborhood_name || null,
        };
    } catch (e) {
        console.error(`[DishModel Format Error] Failed to format dish row:`, dishRow, e);
        return null; // Return null if formatting fails
    }
};


export const findDishById = async (id: number): Promise<Dish | null> => {
    if (isNaN(id) || id <= 0) {
        console.warn(`[DishModel findDishById] Invalid ID provided: ${id}`);
        return null;
    }
    console.log(`[DishModel] Finding dish by ID: ${id}`);
    const query = `
        SELECT
            d.id, d.name, d.adds, d.created_at, d.restaurant_id,
            r.name AS restaurant_name,
            r.city_name,
            r.neighborhood_name,
            -- Ensure tags are aggregated correctly, handling NULLs
            COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.id IS NOT NULL), '{}'::text[]) as tags
        FROM Dishes d
        -- Use INNER JOIN if a dish MUST have a restaurant
        JOIN Restaurants r ON d.restaurant_id = r.id
        LEFT JOIN DishHashtags dh ON d.id = dh.dish_id
        LEFT JOIN Hashtags h ON dh.hashtag_id = h.id
        WHERE d.id = $1
        GROUP BY d.id, r.id -- Group by primary keys of joined tables
    `;
    try {
        const result: QueryResult<RawDishRow> = await db.query(query, [id]);
        return formatDishForResponse(result.rows[0]);
    } catch (error) {
        console.error(`[DishModel findDishById] Error fetching dish ${id}:`, error);
        throw error; // Re-throw the error for handler upstream
    }
};

export const findDishesByName = async (name: string, limit: number = 20, offset: number = 0): Promise<Dish[]> => {
    console.log(`[DishModel] Finding dishes by name like: ${name}`);
    const query = `
        SELECT
            d.id, d.name, d.adds, d.created_at, d.restaurant_id,
            r.name AS restaurant_name,
            r.city_name,
            r.neighborhood_name,
            COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.id IS NOT NULL), '{}'::text[]) as tags
        FROM Dishes d
        JOIN Restaurants r ON d.restaurant_id = r.id
        LEFT JOIN DishHashtags dh ON d.id = dh.dish_id
        LEFT JOIN Hashtags h ON dh.hashtag_id = h.id
        WHERE d.name ILIKE $1
        GROUP BY d.id, r.id -- Group by primary keys to get tags correctly
        ORDER BY d.adds DESC NULLS LAST, d.name ASC
        LIMIT $2 OFFSET $3
    `;
    const params = [`%${name}%`, limit, offset];
    try {
        const result = await db.query<RawDishRow>(query, params);
        // Safely map results using the formatter
        return (result.rows || []).map(formatDishForResponse).filter((d): d is Dish => d !== null);
    } catch (error) {
        console.error(`[DishModel findDishesByName] Error fetching dishes for name ${name}:`, error);
        throw error;
    }
};

export const createDish = async (dishData: { name: string; restaurant_id: number }): Promise<Dish | null> => {
    console.log('[DishModel] Creating dish:', dishData);
    const { name, restaurant_id } = dishData;
     if (!name || typeof restaurant_id !== 'number' || isNaN(restaurant_id) || restaurant_id <= 0) {
          console.error('[DishModel createDish] Invalid input data:', dishData);
          throw new Error('Invalid data for creating dish.');
     }
    const query = `
        INSERT INTO Dishes (name, restaurant_id, adds, created_at, updated_at)
        VALUES ($1, $2, 0, NOW(), NOW())
        ON CONFLICT (name, restaurant_id) DO NOTHING
        RETURNING id; -- Only return ID
    `;
    try {
        const result = await db.query<{ id: number | string }>(query, [name, restaurant_id]);
        if (result.rows.length === 0) {
            console.warn(`[DishModel createDish] Dish "${name}" for restaurant ID ${restaurant_id} might already exist.`);
            // Optionally fetch the existing one if needed, but returning null is okay for ON CONFLICT DO NOTHING
             const existing = await db.query<RawDishRow>(
                 'SELECT * FROM Dishes WHERE name = $1 AND restaurant_id = $2',
                 [name, restaurant_id]
             );
             // If it exists, fetch its full details to return
             return existing.rows[0] ? findDishById(parseInt(String(existing.rows[0].id), 10)) : null;
        }
        // Fetch the full details including joined data after successful creation
        return findDishById(parseInt(String(result.rows[0].id), 10));
    } catch (error) {
        console.error(`[DishModel createDish] Error creating dish "${name}":`, error);
        throw error;
    }
};

export const updateDish = async (id: number, dishData: Partial<Pick<Dish, 'name' | 'adds' | 'restaurant_id'>>): Promise<Dish | null> => {
    if (isNaN(id) || id <= 0) {
        console.warn(`[DishModel Update] Invalid ID provided: ${id}`);
        return null;
    }
    console.log(`[DishModel] Updating dish ID: ${id}`, dishData);
    const { name, adds, restaurant_id } = dishData;
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(name); }
    // Only update 'adds' if provided explicitly (be cautious)
    if (adds !== undefined && typeof adds === 'number' && !isNaN(adds)) {
        fields.push(`adds = $${paramIndex++}`);
        values.push(adds);
    }
    if (restaurant_id !== undefined && typeof restaurant_id === 'number' && !isNaN(restaurant_id) && restaurant_id > 0) {
        fields.push(`restaurant_id = $${paramIndex++}`); values.push(restaurant_id);
    }

    if (fields.length === 0) {
        console.warn(`[DishModel Update] No valid fields provided for update on dish ${id}`);
        return findDishById(id); // Return current data if no valid changes
    }

    fields.push(`updated_at = NOW()`); // Always update timestamp

    const query = `
        UPDATE Dishes
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id; -- Only return ID to confirm update
    `;
    values.push(id); // Add ID as the last parameter

    try {
        const result = await db.query<{ id: number }>(query, values);
        if (result.rows.length > 0) {
            return findDishById(id); // Fetch updated full details
        } else {
            console.warn(`[DishModel Update] Dish with ID ${id} not found or no changes made.`);
            // Check if it exists at all
            const exists = await findDishById(id);
            return exists; // Return current data if it exists but wasn't updated
        }
    } catch (error) {
        console.error(`[DishModel Update] Error updating dish ${id}:`, error);
        throw error;
    }
};

export const deleteDish = async (id: number): Promise<boolean> => {
     if (isNaN(id) || id <= 0) {
         console.warn(`[DishModel deleteDish] Invalid ID provided: ${id}`);
         return false;
     }
    console.log(`[DishModel] Deleting dish ID: ${id}`);
    const query = 'DELETE FROM Dishes WHERE id = $1 RETURNING id';
    try {
        const result = await db.query(query, [id]);
        // Check rowCount to confirm deletion
        return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
        console.error(`[DishModel deleteDish] Error deleting dish ${id}:`, error);
        // Check for specific foreign key violation errors if needed
         if ((error as any)?.code === '23503') {
            console.warn(`[DishModel deleteDish] Cannot delete dish ${id} due to foreign key constraints.`);
            throw new Error(`Cannot delete dish: It is referenced by other items (e.g., list items, votes).`);
         }
        throw error; // Re-throw other errors
    }
};