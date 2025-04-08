/* src/doof-backend/models/dishModel.js */
import db from '../db/index.js';

const formatDishForResponse = (dish) => {
    if (!dish) return null;
    return {
        ...dish,
        id: parseInt(dish.id, 10),
        restaurant_id: dish.restaurant_id ? parseInt(dish.restaurant_id, 10) : null,
        adds: dish.adds != null ? parseInt(dish.adds, 10) : 0,
        tags: Array.isArray(dish.tags) ? dish.tags : [],
        city: dish.city_name, // Rename for consistency
        neighborhood: dish.neighborhood_name, // Rename for consistency
    };
};


export const findDishById = async (id) => {
     console.log(`[DishModel] Finding dish by ID: ${id}`);
     const query = `
        SELECT
          d.id, d.name, d.adds, d.created_at, d.restaurant_id,
          r.name AS restaurant_name,
          r.city_name, -- Include denormalized fields from restaurant
          r.neighborhood_name,
          COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}'::text[]) as tags
        FROM Dishes d
        LEFT JOIN Restaurants r ON d.restaurant_id = r.id
        LEFT JOIN DishHashtags dh ON d.id = dh.dish_id
        LEFT JOIN Hashtags h ON dh.hashtag_id = h.id
        WHERE d.id = $1
        GROUP BY d.id, r.id -- Group by restaurant too
      `;
      const result = await db.query(query, [id]);
      return formatDishForResponse(result.rows[0]);
};

export const findDishesByName = async (name, limit = 20, offset = 0) => {
    console.log(`[DishModel] Finding dishes by name like: ${name}`);
    const query = `
        SELECT d.id, d.name, d.adds, r.name AS restaurant_name, r.city_name, r.neighborhood_name
        FROM Dishes d
        JOIN Restaurants r ON d.restaurant_id = r.id
        WHERE d.name ILIKE $1
        ORDER BY d.name ASC, d.adds DESC NULLS LAST
        LIMIT $2 OFFSET $3
      `;
    const params = [`%${name}%`, limit, offset];
    const result = await db.query(query, params);
    // Simplified response for list/search, details fetched separately
    return result.rows.map(d => ({ id: d.id, name: d.name, restaurant_name: d.restaurant_name })) || [];
};

export const createDish = async (dishData) => {
    console.log('[DishModel] Creating dish:', dishData);
    const { name, restaurant_id } = dishData; // Required fields
    // Optional fields can be added later
    const query = `
        INSERT INTO Dishes (name, restaurant_id, adds, created_at, updated_at)
        VALUES ($1, $2, 0, NOW(), NOW())
        ON CONFLICT (name, restaurant_id) DO NOTHING
        RETURNING *;
    `;
    const result = await db.query(query, [name, restaurant_id]);
     if (result.rows.length === 0) {
         console.warn(`[DishModel] Dish "${name}" for restaurant ID ${restaurant_id} might already exist.`);
         // Optionally fetch existing dish
         const existing = await db.query('SELECT * FROM Dishes WHERE name = $1 AND restaurant_id = $2', [name, restaurant_id]);
         return formatDishForResponse(existing.rows[0]);
     }
    return formatDishForResponse(result.rows[0]);
};

export const updateDish = async (id, dishData) => {
    console.log(`[DishModel] Updating dish ID: ${id}`, dishData);
    const { name, adds, restaurant_id } = dishData; // Example updatable fields
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(name); }
    if (adds !== undefined) { fields.push(`adds = $${paramIndex++}`); values.push(adds); }
    if (restaurant_id !== undefined) { fields.push(`restaurant_id = $${paramIndex++}`); values.push(restaurant_id); } // Allow changing restaurant? Use with caution.

    if (fields.length === 0) {
        console.warn(`[DishModel Update] No fields provided for update on dish ${id}`);
        return findDishById(id); // Return current data
    }

    fields.push(`updated_at = NOW()`);

    const query = `
        UPDATE Dishes
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex++}
        RETURNING *;
    `;
    values.push(id);

    const result = await db.query(query, values);
    // Need to re-fetch with joins to get full details for response
    if (result.rows.length > 0) {
        return findDishById(id); // Fetch details after update
    }
    return null; // Return null if dish wasn't found to update
};

export const deleteDish = async (id) => {
    console.log(`[DishModel] Deleting dish ID: ${id}`);
    // Cascading delete should handle related hashtags, votes etc.
    const query = 'DELETE FROM Dishes WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
};