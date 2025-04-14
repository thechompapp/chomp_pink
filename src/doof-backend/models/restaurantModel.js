/* src/doof-backend/models/restaurantModel.js */
import db from '../db/index.js';

export const formatRestaurantForResponse = (restaurant) => {
    if (!restaurant) return null;
    try {
        const tagsArray = Array.isArray(restaurant.tags)
            ? restaurant.tags.filter((tag) => typeof tag === 'string' && tag.length > 0)
            : [];
        return {
            id: parseInt(String(restaurant.id), 10),
            name: restaurant.name || "Unknown Restaurant",
            city_id: restaurant.city_id ? parseInt(String(restaurant.city_id), 10) : null,
            city_name: restaurant.city_name || null,
            neighborhood_id: restaurant.neighborhood_id ? parseInt(String(restaurant.neighborhood_id), 10) : null,
            neighborhood_name: restaurant.neighborhood_name || null,
            address: restaurant.address || null,
            google_place_id: restaurant.google_place_id || null,
            latitude: restaurant.latitude != null ? parseFloat(String(restaurant.latitude)) : null,
            longitude: restaurant.longitude != null ? parseFloat(String(restaurant.longitude)) : null,
            // ** FIXED: Ensure adds defaults to 0 **
            adds: restaurant.adds != null ? parseInt(String(restaurant.adds), 10) : 0,
            created_at: restaurant.created_at,
            updated_at: restaurant.updated_at,
            tags: tagsArray,
            phone_number: restaurant.phone_number || null,
            website: restaurant.website || null,
            instagram_handle: restaurant.instagram_handle || null,
             photo_url: restaurant.photo_url || null,
        };
    } catch (e) {
        console.error(`[RestaurantModel Format Error] Failed to format restaurant row:`, restaurant, e);
        return null;
    }
};

const formatDishForRestaurantDetail = (dish) => { /* ... function body remains the same ... */
     if (!dish) return null;
     try {
        const tagsArray = Array.isArray(dish.tags) ? dish.tags.filter((tag) => typeof tag === 'string' && tag.length > 0) : [];
        const createdAtString = dish.created_at instanceof Date ? dish.created_at.toISOString() : typeof dish.created_at === 'string' ? dish.created_at : undefined;
         return {
            id: parseInt(String(dish.id), 10), name: dish.name || 'Unnamed Dish',
            // ** FIXED: Ensure adds defaults to 0 **
            adds: dish.adds != null ? parseInt(String(dish.adds), 10) : 0,
            restaurant_id: parseInt(String(dish.restaurant_id), 10), tags: tagsArray, created_at: createdAtString,
            restaurant_name: dish.restaurant_name || undefined, city: dish.city_name || null,
            neighborhood: dish.neighborhood_name || null, city_name: dish.city_name || undefined, neighborhood_name: dish.neighborhood_name || undefined,
         };
     } catch(e) { console.error(`[RestaurantModel Format Error] Failed to format dish row (for restaurant detail):`, dish, e); return null; }
};

export const findRestaurantByIdWithDetails = async (id) => { /* ... function body remains the same ... */
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId) || numericId <= 0) { return null; }
    const restaurantQuery = `...`; const dishQuery = `...`;
    try {
        const [restaurantResult, dishResult] = await Promise.all([ db.query(restaurantQuery, [numericId]), db.query(dishQuery, [numericId]) ]);
        if (restaurantResult.rows.length === 0) return null;
        const restaurant = formatRestaurantForResponse(restaurantResult.rows[0]);
        if (!restaurant) { return null; }
        const dishes = (dishResult.rows || []).map(formatDishForRestaurantDetail).filter((dish) => dish !== null);
        const restaurantDetail = { ...restaurant, dishes: dishes };
        return restaurantDetail;
    } catch (error) { console.error(`[RestaurantModel findRestaurantByIdWithDetails] Error fetching details for ID ${numericId}:`, error); throw error; }
};

export const findRestaurantById = async (id) => { /* ... function body remains the same ... */
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId) || numericId <= 0) { return null; }
    const query = `...`;
    try { const result = await db.query(query, [numericId]); return formatRestaurantForResponse(result.rows[0]); }
    catch (error) { console.error(`[RestaurantModel findRestaurantById] Error fetching basic info for ID ${numericId}:`, error); throw error; }
};

export const createRestaurant = async (restaurantData) => { /* ... function body remains the same ... */
     const { name, city_id } = restaurantData;
     if (!name) throw new Error("Restaurant name is required for creation.");
     const query = `...`; const params = [ name, city_id ?? null, /* other fields */ ];
     try {
        const result = await db.query(query, params);
        if (result.rows.length === 0) { /* ... conflict handling ... */ }
        const createdRestaurant = formatRestaurantForResponse(result.rows[0]);
        if (createdRestaurant && !createdRestaurant.tags) createdRestaurant.tags = [];
        return createdRestaurant;
     } catch (error) { console.error(`[RestaurantModel createRestaurant] Error creating restaurant "${name}":`, error); throw error; }
};

export const updateRestaurant = async (id, restaurantData) => { /* ... function body remains the same ... */
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId) || numericId <= 0) { return null; }
    const fields = []; const values = []; let paramIndex = 1;
    const addField = (dbField, value) => { if (value !== undefined) { fields.push(`"${dbField}" = $${paramIndex++}`); values.push(value === '' ? null : value); } };
    // Add all fields...
    if (fields.length === 0) { return findRestaurantById(numericId); }
    fields.push(`"updated_at" = NOW()`);
    const query = `UPDATE Restaurants SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING id;`;
    values.push(numericId);
     try {
         const result = await db.query(query, values);
         if (result.rowCount === 0) { return null; }
         return findRestaurantById(result.rows[0].id);
     } catch (error) { console.error(`[RestaurantModel updateRestaurant] Error updating restaurant ${numericId}:`, error); /* ... error handling ... */ throw error; }
};

export const deleteRestaurant = async (id) => { /* ... function body remains the same ... */
     const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
     if (isNaN(numericId) || numericId <= 0) { return false; }
    const query = 'DELETE FROM Restaurants WHERE id = $1 RETURNING id';
    try { const result = await db.query(query, [numericId]); return (result.rowCount ?? 0) > 0; }
    catch (error) { console.error(`[RestaurantModel deleteRestaurant] Error deleting restaurant ${numericId}:`, error); /* ... error handling ... */ throw error; }
};