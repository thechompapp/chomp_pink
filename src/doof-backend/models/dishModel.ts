/* src/doof-backend/models/dishModel.ts */
import db from '../db/index.js'; // Corrected import path
import type { QueryResult, QueryResultRow } from 'pg';

// Define Dish type locally or import if defined globally
export interface Dish extends QueryResultRow { // Extend QueryResultRow
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
interface RawDishRow extends QueryResultRow { // Extend QueryResultRow
    id: number | string;
    name: string;
    adds?: number | string | null;
    created_at: string | Date; // Allow both string and Date types
    restaurant_id: number | string;
    restaurant_name?: string | null;
    city_name?: string | null;
    neighborhood_name?: string | null;
    tags?: string[] | null;
}

// Exported formatter function
export const formatDishForResponse = (dishRow: RawDishRow | undefined): Dish | null => {
    if (!dishRow || dishRow.id == null) {
        console.warn('[DishModel Format Error] Invalid or incomplete dish data received:', dishRow);
        return null;
    }
    try {
        const tagsArray = Array.isArray(dishRow.tags)
            ? dishRow.tags.filter((tag): tag is string => typeof tag === 'string' && tag !== null)
            : [];

        return {
            id: parseInt(String(dishRow.id), 10),
            name: dishRow.name || 'Unnamed Dish',
            adds: dishRow.adds != null ? parseInt(String(dishRow.adds), 10) : 0,
            created_at: typeof dishRow.created_at === 'string' ? dishRow.created_at : (dishRow.created_at instanceof Date ? dishRow.created_at.toISOString() : ''), // Ensure string
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
          console.warn(`[DishModel FindByID] Invalid ID: ${id}`);
          return null;
     }
     const query = `
        SELECT d.*, r.name as restaurant_name, r.city_name, r.neighborhood_name,
               COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}'::text[]) as tags
        FROM Dishes d
        JOIN Restaurants r ON d.restaurant_id = r.id
        LEFT JOIN DishHashtags dh ON d.id = dh.dish_id
        LEFT JOIN Hashtags h ON dh.hashtag_id = h.id
        WHERE d.id = $1
        GROUP BY d.id, r.name, r.city_name, r.neighborhood_name;
     `;
     try {
         const result: QueryResult<RawDishRow> = await db.query(query, [id]);
         return formatDishForResponse(result.rows[0]);
     } catch (error) {
          console.error(`[DishModel FindByID] Error fetching dish ${id}:`, error);
          throw error;
     }
};

export const findDishesByName = async (name: string, limit: number = 20, offset: number = 0): Promise<Dish[]> => {
     const searchPattern = `%${name}%`;
     // Assuming a query that joins restaurant info and aggregates tags
     const query = `
         SELECT d.*, r.name as restaurant_name, r.city_name, r.neighborhood_name,
                COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}'::text[]) as tags
         FROM Dishes d
         JOIN Restaurants r ON d.restaurant_id = r.id
         LEFT JOIN DishHashtags dh ON d.id = dh.dish_id
         LEFT JOIN Hashtags h ON dh.hashtag_id = h.id
         WHERE d.name ILIKE $1
         GROUP BY d.id, r.name, r.city_name, r.neighborhood_name
         ORDER BY d.adds DESC NULLS LAST, d.name ASC
         LIMIT $2 OFFSET $3;
     `;
     const params = [searchPattern, limit, offset];
     try {
         const result = await db.query<RawDishRow>(query, params);
         return (result.rows || []).map(formatDishForResponse).filter((d): d is Dish => d !== null);
     } catch (error) {
          console.error(`[DishModel FindByName] Error searching dishes for "${name}":`, error);
          throw error;
     }
};

export const createDish = async (dishData: { name: string; restaurant_id: number }): Promise<Dish | null> => {
      if (!dishData.name || typeof dishData.restaurant_id !== 'number') {
          throw new Error('Invalid data: Name and numeric restaurant_id required.');
      }
      const query = `
         INSERT INTO Dishes (name, restaurant_id, adds, created_at, updated_at)
         VALUES ($1, $2, 0, NOW(), NOW())
         ON CONFLICT (name, restaurant_id) DO NOTHING
         RETURNING id;
      `;
      try {
         const result = await db.query<{ id: number | string }>(query, [dishData.name, dishData.restaurant_id]);
         if (result.rows.length === 0) {
             // Handle conflict or failure
             console.warn(`[DishModel Create] Dish "${dishData.name}" likely already exists for restaurant ${dishData.restaurant_id}.`);
             // Optionally fetch the existing dish
             // const existing = await findDishByNameAndRestaurant(dishData.name, dishData.restaurant_id);
             // return existing;
             return null; // Or throw specific conflict error
         }
         // Fetch the newly created dish with all details
         return findDishById(parseInt(String(result.rows[0].id), 10));
      } catch (error) {
           console.error(`[DishModel Create] Error creating dish "${dishData.name}":`, error);
           throw error;
      }
};

export const updateDish = async (id: number, dishData: Partial<Pick<Dish, 'name' | 'adds' | 'restaurant_id'>>): Promise<Dish | null> => {
    if (isNaN(id) || id <= 0) {
         console.warn(`[DishModel Update] Invalid ID: ${id}`);
         return null;
    }
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1; // Parameter index starts at 1

    console.log(`[DishModel Update] Received data for dish ${id}:`, dishData);

    // Build fields/values dynamically
    if (dishData.name !== undefined) {
        if (typeof dishData.name !== 'string' || dishData.name.trim() === '') {
            throw new Error("Invalid name provided for update.");
        }
        fields.push(`name = $${paramIndex++}`);
        values.push(dishData.name.trim());
    }
    // We decided 'adds' shouldn't be updated via generic PUT in admin routes
    // if (dishData.adds !== undefined) { ... }

    if (dishData.restaurant_id !== undefined) {
         if (typeof dishData.restaurant_id !== 'number' || isNaN(dishData.restaurant_id) || dishData.restaurant_id <= 0) {
             throw new Error("Invalid restaurant_id provided for update.");
         }
        fields.push(`restaurant_id = $${paramIndex++}`);
        values.push(dishData.restaurant_id);
    }
    // Note: Tags are not updated directly on the Dishes table in this schema.
    // Tag updates would require separate operations on the DishHashtags table.

    if (fields.length === 0) { // No valid fields provided
        console.warn(`[DishModel Update] No fields to update for dish ID ${id}.`);
        return findDishById(id); // Return current data
    }

    fields.push(`updated_at = NOW()`); // Always update timestamp

    // Construct the query string
    const query = `UPDATE "Dishes" SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING id;`;
    values.push(id); // Add the ID for the WHERE clause

    // --- ADDED LOGGING ---
    console.log(`[DishModel Update] Executing Query for Dish ID ${id}:`);
    console.log(`   SQL: ${query}`);
    console.log(`   Values: ${JSON.stringify(values)}`);
    // --- END LOGGING ---

    try {
        const result = await db.query<{ id: number }>(query, values);
        if (result.rows.length > 0) {
            console.log(`[DishModel Update] Successfully updated dish ID ${id}. Refetching...`);
            return findDishById(id); // Refetch the updated dish
        }
        // If no rows returned, check if the dish exists
        console.warn(`[DishModel Update] Update query affected 0 rows for dish ID ${id}. Checking existence.`);
        const exists = await findDishById(id);
        if (exists) {
             console.log(`[DishModel Update] Dish ID ${id} exists but was not updated (possibly no changes or concurrent modification).`);
        } else {
             console.warn(`[DishModel Update] Dish ID ${id} not found.`);
        }
        return exists; // Return existing data if no update occurred but dish exists, or null if not found
    } catch (error) {
         console.error(`[DishModel Update] Error during SQL execution for dish ${id}:`, error);
         if ((error as any)?.code === '23505') { // Unique constraint violation
              throw new Error(`Update failed: Dish name conflicts with an existing dish for this restaurant.`);
         } else if ((error as any)?.code === '23503') { // Foreign key violation (e.g., restaurant_id doesn't exist)
              throw new Error(`Update failed: Invalid restaurant ID provided.`);
         } else if ((error as Error).message?.includes('syntax error')) {
              // Log extra info if it's specifically a syntax error
              console.error("[DishModel Update] Potential Syntax Error Detail:", (error as Error).stack);
         }
         // Re-throw other errors
         throw error;
    }
};

export const deleteDish = async (id: number): Promise<boolean> => {
     if (isNaN(id) || id <= 0) {
          console.warn(`[DishModel Delete] Invalid ID: ${id}`);
          return false;
     }
     const query = 'DELETE FROM Dishes WHERE id = $1 RETURNING id';
     try {
         const result = await db.query(query, [id]);
         console.log(`[DishModel Delete] Result for dish ID ${id}:`, result.rowCount);
         return (result.rowCount ?? 0) > 0;
     } catch (error) {
          console.error(`[DishModel Delete] Error deleting dish ${id}:`, error);
          throw error;
     }
};