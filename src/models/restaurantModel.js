/* src/doof-backend/models/restaurantModel.js */
import db from '../db/index.js';

const formatRestaurantForResponse = (restaurant) => {
    if (!restaurant) return null;
    return {
        ...restaurant,
        id: parseInt(restaurant.id, 10),
        city_id: restaurant.city_id ? parseInt(restaurant.city_id, 10) : null,
        neighborhood_id: restaurant.neighborhood_id ? parseInt(restaurant.neighborhood_id, 10) : null,
        adds: restaurant.adds != null ? parseInt(restaurant.adds, 10) : 0,
        tags: Array.isArray(restaurant.tags) ? restaurant.tags : [],
        latitude: restaurant.latitude != null ? parseFloat(restaurant.latitude) : null,
        longitude: restaurant.longitude != null ? parseFloat(restaurant.longitude) : null,
    };
};

const formatDishForResponse = (dish) => {
    if (!dish) return null;
     return {
        ...dish,
        id: parseInt(dish.id, 10),
        restaurant_id: dish.restaurant_id ? parseInt(dish.restaurant_id, 10) : null,
        adds: dish.adds != null ? parseInt(dish.adds, 10) : 0,
        tags: Array.isArray(dish.tags) ? dish.tags : [],
    };
};

export const findRestaurantByIdWithDetails = async (id) => {
    console.log(`[RestaurantModel] Finding restaurant details for ID: ${id}`);
    const restaurantQuery = `
      SELECT r.id, r.name, r.city_id, r.neighborhood_id, r.city_name, r.neighborhood_name, r.adds,
             r.google_place_id, r.address, r.latitude, r.longitude, r.created_at, r.updated_at,
             COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}'::text[]) as tags
      FROM Restaurants r
      LEFT JOIN RestaurantHashtags rh ON r.id = rh.restaurant_id
      LEFT JOIN Hashtags h ON rh.hashtag_id = h.id
      WHERE r.id = $1
      GROUP BY r.id;
    `;
    const restaurantResult = await db.query(restaurantQuery, [id]);

    if (restaurantResult.rows.length === 0) {
      return null;
    }

    const dishQuery = `
      SELECT d.id, d.name, d.adds, d.created_at, d.restaurant_id,
             COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}'::text[]) as tags
      FROM Dishes d
      LEFT JOIN DishHashtags dh ON d.id = dh.dish_id
      LEFT JOIN Hashtags h ON dh.hashtag_id = h.id
      WHERE d.restaurant_id = $1
      GROUP BY d.id
      ORDER BY d.adds DESC NULLS LAST, d.name ASC;
    `;
    const dishResult = await db.query(dishQuery, [id]);

    const restaurant = formatRestaurantForResponse(restaurantResult.rows[0]);
    restaurant.dishes = (dishResult.rows || []).map(formatDishForResponse);

    return restaurant;
};

export const findRestaurantById = async (id) => {
    console.log(`[RestaurantModel] Finding restaurant basic info for ID: ${id}`);
    const query = `SELECT * FROM Restaurants WHERE id = $1`;
    const result = await db.query(query, [id]);
    return formatRestaurantForResponse(result.rows[0]);
};

export const createRestaurant = async (restaurantData) => {
     console.log('[RestaurantModel] Creating restaurant:', restaurantData);
     const { name, city_id, neighborhood_id, city_name, neighborhood_name, address, google_place_id, latitude, longitude } = restaurantData;
     const query = `
        INSERT INTO restaurants (name, city_id, neighborhood_id, city_name, neighborhood_name, address, google_place_id, latitude, longitude, adds, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, NOW(), NOW())
        ON CONFLICT (name, city_id) DO NOTHING -- Or potentially update? Check requirements
        RETURNING *;
     `;
     const params = [name, city_id || null, neighborhood_id || null, city_name || null, neighborhood_name || null, address || null, google_place_id || null, latitude || null, longitude || null];
     const result = await db.query(query, params);
     if (result.rows.length === 0) {
         // Handle conflict - restaurant might already exist
         console.warn(`[RestaurantModel] Restaurant "${name}" in city ID ${city_id} might already exist.`);
         // Optionally fetch the existing one to return it
         const existing = await db.query('SELECT * FROM Restaurants WHERE name = $1 AND city_id = $2', [name, city_id || null]);
         return formatRestaurantForResponse(existing.rows[0]);
     }
     return formatRestaurantForResponse(result.rows[0]);
};

export const updateRestaurant = async (id, restaurantData) => {
    console.log(`[RestaurantModel] Updating restaurant ID: ${id}`, restaurantData);
    const { name, city_id, neighborhood_id, city_name, neighborhood_name, address, google_place_id, latitude, longitude, adds } = restaurantData;
    // Build query dynamically
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Add fields to update
    if (name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(name); }
    if (city_id !== undefined) { fields.push(`city_id = $${paramIndex++}`); values.push(city_id); }
    if (neighborhood_id !== undefined) { fields.push(`neighborhood_id = $${paramIndex++}`); values.push(neighborhood_id); }
    if (city_name !== undefined) { fields.push(`city_name = $${paramIndex++}`); values.push(city_name); }
    if (neighborhood_name !== undefined) { fields.push(`neighborhood_name = $${paramIndex++}`); values.push(neighborhood_name); }
    if (address !== undefined) { fields.push(`address = $${paramIndex++}`); values.push(address); }
    if (google_place_id !== undefined) { fields.push(`google_place_id = $${paramIndex++}`); values.push(google_place_id); }
    if (latitude !== undefined) { fields.push(`latitude = $${paramIndex++}`); values.push(latitude); }
    if (longitude !== undefined) { fields.push(`longitude = $${paramIndex++}`); values.push(longitude); }
    if (adds !== undefined) { fields.push(`adds = $${paramIndex++}`); values.push(adds); } // Allow updating adds? Careful.

    if (fields.length === 0) {
         console.warn(`[RestaurantModel Update] No fields provided for update on restaurant ${id}`);
         return findRestaurantById(id); // Return current data if no changes
    }

    fields.push(`updated_at = NOW()`); // Always update timestamp

    const query = `
        UPDATE Restaurants
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex++}
        RETURNING *;
    `;
    values.push(id);

    const result = await db.query(query, values);
    return formatRestaurantForResponse(result.rows[0]);
};

export const deleteRestaurant = async (id) => {
    console.log(`[RestaurantModel] Deleting restaurant ID: ${id}`);
    // Cascading delete should handle related dishes, hashtags etc. due to schema
    const query = 'DELETE FROM Restaurants WHERE id = $1 RETURNING id';
    const result = await db.query(query, [id]);
    return result.rowCount > 0;
};

// Add findRestaurants (list/search) functions if needed for specific admin views or searches
// that aren't covered by the generic admin route or searchModel.