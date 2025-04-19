/* main/doof-backend/models/dishModel.js */
/* ADDED: checkDishExistence function */
/* Other functions remain unchanged */
import db from '../db/index.js';

// Formatter (Keep as before)
export const formatDishForResponse = (dishRow) => {
    if (!dishRow || dishRow.id == null) {
        return null;
    }
    try {
        const tagsArray = Array.isArray(dishRow.tags)
            ? dishRow.tags.filter((tag) => typeof tag === 'string' && tag !== null)
            : [];

        return {
            id: parseInt(String(dishRow.id), 10),
            name: dishRow.name || 'Unnamed Dish',
            adds: dishRow.adds != null ? parseInt(String(dishRow.adds), 10) : 0,
            created_at: typeof dishRow.created_at === 'string' ? dishRow.created_at : dishRow.created_at?.toISOString() ?? '',
            restaurant_id: dishRow.restaurant_id ? parseInt(String(dishRow.restaurant_id), 10) : null, // Handle potential null
            restaurant_name: dishRow.restaurant_name || undefined,
            city_name: dishRow.city_name || undefined,
            neighborhood_name: dishRow.neighborhood_name || undefined,
            tags: tagsArray,
            city: dishRow.city_name || null,
            neighborhood: dishRow.neighborhood_name || null,
        };
    } catch (e) {
        console.error(`[DishModel Format Error] Failed to format dish row:`, dishRow, e);
        return null;
    }
};


// Find by ID (Keep as before)
export const findDishById = async (id) => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId) || numericId <= 0) { return null; }
     const query = `
        SELECT d.*, r.name as restaurant_name, c.name as city_name, n.name as neighborhood_name,
               COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}'::text[]) as tags
        FROM dishes d
        LEFT JOIN restaurants r ON d.restaurant_id = r.id
        LEFT JOIN cities c ON r.city_id = c.id
        LEFT JOIN neighborhoods n ON r.neighborhood_id = n.id
        LEFT JOIN dishhashtags dh ON d.id = dh.dish_id
        LEFT JOIN hashtags h ON dh.hashtag_id = h.id
        WHERE d.id = $1
        GROUP BY d.id, r.name, c.name, n.name;
     `;
     try {
        const result = await db.query(query, [numericId]);
        return formatDishForResponse(result.rows[0]); // Assuming formatDishForResponse handles the columns correctly
    }
     catch (error) { console.error(`[DishModel FindByID] Error fetching dish ${numericId}:`, error); throw error; }
};


// Find by Name (Keep as before)
export const findDishesByName = async (name, limit = 20, offset = 0) => {
    const searchPattern = `%${name}%`;
    const query = `
         SELECT d.*, r.name as restaurant_name, c.name as city_name, n.name as neighborhood_name,
                COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}'::text[]) as tags
         FROM dishes d
         JOIN restaurants r ON d.restaurant_id = r.id
         LEFT JOIN cities c ON r.city_id = c.id
         LEFT JOIN neighborhoods n ON r.neighborhood_id = n.id
         LEFT JOIN dishhashtags dh ON d.id = dh.dish_id
         LEFT JOIN hashtags h ON dh.hashtag_id = h.id
         WHERE d.name ILIKE $1
         GROUP BY d.id, r.name, c.name, n.name
         ORDER BY d.adds DESC NULLS LAST, d.name ASC
         LIMIT $2 OFFSET $3;
     `;
     const params = [searchPattern, limit, offset];
     try {
         const result = await db.query(query, params);
         return (result.rows || []).map(formatDishForResponse).filter((d) => d !== null);
    }
     catch (error) { console.error(`[DishModel FindByName] Error searching dishes for "${name}":`, error); throw error; }
};

// Create Dish (Keep as before)
export const createDish = async (dishData) => {
      if (!dishData.name || typeof dishData.restaurant_id !== 'number') { throw new Error('Invalid data: Name and numeric restaurant_id required.'); }
      const query = `
         INSERT INTO dishes (name, restaurant_id, adds, created_at, updated_at)
         VALUES ($1, $2, 0, NOW(), NOW())
         ON CONFLICT (name, restaurant_id) DO NOTHING
         RETURNING id;
      `;
      try {
          const result = await db.query(query, [dishData.name, dishData.restaurant_id]);
          if (result.rows.length === 0) {
               console.warn(`[DishModel Create] Dish "${dishData.name}" likely already exists for restaurant ${dishData.restaurant_id}.`);
               return null; // Indicate conflict/no creation
            }
            // Refetch the newly created dish to return the full object
            return findDishById(parseInt(String(result.rows[0].id), 10));
        }
      catch (error) {
          console.error(`[DishModel Create] Error creating dish "${dishData.name}":`, error);
          // Handle specific errors like FK violation if needed
          if (error.code === '23503') { // Foreign key violation (restaurant_id doesn't exist)
               throw new Error(`Create failed: Restaurant ID ${dishData.restaurant_id} not found.`);
          }
          throw error; // Re-throw other errors
        }
};

// Update Dish (Keep as before)
export const updateDish = async (id, dishData) => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId) || numericId <= 0) {
        console.warn(`[DishModel Update] Invalid ID: ${id}`);
        return null;
    }

    const fieldsToSet = []; // Store parts like "column_name" = $N
    const values = [];
    let paramIndex = 1;

    console.log(`[DishModel Update] Received data for dish ${numericId}:`, dishData); // Log 1

    // Build fields/values dynamically, quoting column names
    if (dishData.name !== undefined) {
        if (typeof dishData.name !== 'string' || dishData.name.trim() === '') {
            throw new Error("Invalid name provided for update.");
        }
        fieldsToSet.push(`"name" = $${paramIndex++}`); // Quote "name"
        values.push(dishData.name.trim());
    }
    if (dishData.restaurant_id !== undefined) {
        const restId = dishData.restaurant_id;
        if (restId === null) {
             fieldsToSet.push(`"restaurant_id" = $${paramIndex++}`); // Quote "restaurant_id"
             values.push(null);
        } else {
            const restIdNum = Number(restId);
            if (!isNaN(restIdNum) && restIdNum > 0) {
                 fieldsToSet.push(`"restaurant_id" = $${paramIndex++}`); // Quote "restaurant_id"
                 values.push(restIdNum);
            } else {
                 throw new Error(`Invalid restaurant_id provided for update: ${restId}`);
            }
        }
    }

    // No fields to update other than timestamp?
    if (fieldsToSet.length === 0) {
        console.warn(`[DishModel Update] No changed fields detected for dish ID ${numericId}. Only updating timestamp.`);
        // Still update the timestamp if no other fields changed
        fieldsToSet.push(`"updated_at" = NOW()`); // Quote "updated_at"
    } else {
        // If other fields changed, also add the timestamp update
        fieldsToSet.push(`"updated_at" = NOW()`); // Quote "updated_at"
    }


    // Construct the query string using the prepared parts
    // Ensure there are fields to set before creating the query
    if (fieldsToSet.length === 0) {
         console.warn(`[DishModel Update] No fields to update for dish ID ${numericId} (not even timestamp?). Returning current.`);
         // This case should ideally not be reached if updated_at is always added, but handle defensively.
         return findDishById(numericId);
    }

    const setClause = fieldsToSet.join(', ');
    const query = `UPDATE dishes SET ${setClause} WHERE id = $${paramIndex} RETURNING id;`;
    values.push(numericId); // Add the ID for the WHERE clause

    // --- Logging ---
    console.log(`[DishModel Update] Executing Query for Dish ID ${numericId}:`); // Log 2
    console.log(`   SQL: ${query}`); // Log 3: The exact SQL
    console.log(`   Params: ${JSON.stringify(values)}`); // Log 4: The parameters
    // --- END LOGGING ---

    try {
        const result = await db.query(query, values);

        if (result.rowCount === 0) {
            console.warn(`[DishModel Update] Update query affected 0 rows for dish ID ${numericId}. Checking existence.`);
            const exists = await findDishById(numericId);
             return exists ?? null;
        }

        console.log(`[DishModel Update] Successfully updated dish ID ${numericId}. Refetching...`);
        return findDishById(numericId); // Refetch the updated dish with all joined data

    } catch (error) {
        console.error(`[DishModel Update] Error during SQL execution for dish ID ${numericId}:`, error); // Log 5: The DB error
        if (error?.code === '23505') {
            throw new Error(`Update failed: Dish name conflicts with an existing dish for this restaurant.`);
        }
        else if (error?.code === '23503') {
            throw new Error(`Update failed: Invalid restaurant ID provided.`);
        }
        // Throw the original error for more details
        throw error;
    }
};

// Delete Dish (Keep as before)
export const deleteDish = async (id) => {
     const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
     if (isNaN(numericId) || numericId <= 0) { return false; }
     const query = 'DELETE FROM dishes WHERE id = $1 RETURNING id';
     try { const result = await db.query(query, [numericId]); return (result.rowCount ?? 0) > 0; }
     catch (error) { console.error(`[DishModel Delete] Error deleting dish ${numericId}:`, error); throw error; }
};

/**
 * Checks if a dish with a specific name already exists for a given restaurant.
 * @param {string} name - The name of the dish.
 * @param {number} restaurantId - The ID of the restaurant.
 * @returns {Promise<boolean>} - True if the dish exists for the restaurant, false otherwise.
 */
export const checkDishExistence = async (name, restaurantId) => {
    if (!name || !restaurantId || isNaN(Number(restaurantId)) || Number(restaurantId) <= 0) {
        console.warn(`[DishModel checkDishExistence] Invalid input: Name and valid restaurantId required.`, { name, restaurantId });
        return false; // Or throw an error? Returning false might be safer for verification flow.
    }

    const query = `
        SELECT 1
        FROM dishes
        WHERE name = $1 AND restaurant_id = $2
        LIMIT 1;
    `;
    try {
        const result = await db.query(query, [name, Number(restaurantId)]);
        return (result.rowCount ?? 0) > 0;
    } catch (error) {
        console.error(`[DishModel checkDishExistence] Error checking dish "${name}" for restaurant ${restaurantId}:`, error);
        // Decide how to handle DB errors during a check. Throwing might halt bulk add.
        // Returning false might lead to a failed insert later. Let's throw.
        throw error;
    }
};