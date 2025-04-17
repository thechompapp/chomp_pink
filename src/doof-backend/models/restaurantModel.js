/* src/doof-backend/models/restaurantModel.js */
import db from '../db/index.js';

// Formatter: Ensure NO HTML encoding happens here.
export const formatRestaurantForResponse = (restaurant) => {
    // ... (formatter remains the same) ...
    if (!restaurant) return null;
    try {
        const tagsArray = Array.isArray(restaurant.tags)
            ? restaurant.tags.filter((tag) => typeof tag === 'string' && tag.length > 0)
            : [];
        const name = restaurant.name || "Unknown Restaurant";
        const address = restaurant.address || null;
        const google_place_id = restaurant.google_place_id || null;
        const city_name = restaurant.city_name || null;
        const neighborhood_name = restaurant.neighborhood_name || null;
        const phone_number = restaurant.phone_number || null;
        const website = restaurant.website || null;
        const instagram_handle = restaurant.instagram_handle || null;
        const photo_url = restaurant.photo_url || null;

        return {
            id: parseInt(String(restaurant.id), 10),
            name: name,
            city_id: restaurant.city_id ? parseInt(String(restaurant.city_id), 10) : null,
            city_name: city_name,
            neighborhood_id: restaurant.neighborhood_id ? parseInt(String(restaurant.neighborhood_id), 10) : null,
            neighborhood_name: neighborhood_name,
            address: address,
            google_place_id: google_place_id,
            latitude: restaurant.latitude != null ? parseFloat(String(restaurant.latitude)) : null,
            longitude: restaurant.longitude != null ? parseFloat(String(restaurant.longitude)) : null,
            adds: restaurant.adds != null ? parseInt(String(restaurant.adds), 10) : 0,
            created_at: restaurant.created_at,
            updated_at: restaurant.updated_at,
            tags: tagsArray,
            phone_number: phone_number,
            website: website,
            instagram_handle: instagram_handle,
            photo_url: photo_url,
        };
    } catch (e) {
        console.error(`[RestaurantModel Format Error] Failed to format restaurant row:`, restaurant, e);
        return null; // Return null on error
    }
};

// Dish Formatter for Detail View: Also ensure no encoding
const formatDishForRestaurantDetail = (dish) => {
    // ... (formatter remains the same) ...
    if (!dish) return null;
    try {
        const tagsArray = Array.isArray(dish.tags)
            ? dish.tags.filter((tag) => typeof tag === 'string' && tag.length > 0)
            : [];
        const createdAtString = dish.created_at instanceof Date
            ? dish.created_at.toISOString()
            : typeof dish.created_at === 'string' ? dish.created_at : undefined;

        const name = dish.name || 'Unnamed Dish';
        const restaurant_name = dish.restaurant_name || undefined;
        const city_name = dish.city_name || undefined;
        const neighborhood_name = dish.neighborhood_name || undefined;

        return {
            id: parseInt(String(dish.id), 10),
            name: name,
            adds: dish.adds != null ? parseInt(String(dish.adds), 10) : 0,
            restaurant_id: dish.restaurant_id ? parseInt(String(dish.restaurant_id), 10) : null,
            tags: tagsArray,
            created_at: createdAtString,
            restaurant_name: restaurant_name,
            city: city_name || null,
            neighborhood: neighborhood_name || null,
            city_name: city_name,
            neighborhood_name: neighborhood_name,
        };
    } catch(e) {
        console.error(`[RestaurantModel Format Error] Failed to format dish row (for restaurant detail):`, dish, e);
        return null;
    }
};

// --- Model Functions ---

export const findRestaurantByIdWithDetails = async (id) => {
    // ... (implementation remains the same) ...
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId) || numericId <= 0) { return null; }
    const restaurantQuery = `
      SELECT r.*,
             COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}'::text[]) as tags
      FROM restaurants r
      LEFT JOIN restauranthashtags rh ON r.id = rh.restaurant_id
      LEFT JOIN hashtags h ON rh.hashtag_id = h.id
      WHERE r.id = $1
      GROUP BY r.id;
    `;
    const dishQuery = `
      SELECT d.*,
             COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}'::text[]) as tags
      FROM dishes d
      LEFT JOIN dishhashtags dh ON d.id = dh.dish_id
      LEFT JOIN hashtags h ON dh.hashtag_id = h.id
      WHERE d.restaurant_id = $1
      GROUP BY d.id
      ORDER BY d.adds DESC NULLS LAST, d.name ASC;
    `;
    try {
        const [restaurantResult, dishResult] = await Promise.all([
            db.query(restaurantQuery, [numericId]),
            db.query(dishQuery, [numericId])
        ]);
        if (restaurantResult.rows.length === 0) return null;

        const restaurant = formatRestaurantForResponse(restaurantResult.rows[0]);
        if (!restaurant) {
            console.error(`[RestaurantModel] Failed to format base restaurant data for ID: ${numericId}`);
            return null;
        }

        const dishes = (dishResult.rows || [])
            .map(formatDishForRestaurantDetail) // Use dish formatter
            .filter((dish) => dish !== null); // Filter out nulls

        const restaurantDetail = {
            ...restaurant,
            dishes: dishes,
        };
        return restaurantDetail;
    } catch (error) {
        console.error(`[RestaurantModel findRestaurantByIdWithDetails] Error fetching details for ID ${numericId}:`, error);
        throw error;
    }
};

export const findRestaurantById = async (id) => {
    // ... (implementation remains the same) ...
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId) || numericId <= 0) { return null; }
    const query = `
        SELECT r.*,
               COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}'::text[]) as tags
        FROM restaurants r
        LEFT JOIN restauranthashtags rh ON r.id = rh.restaurant_id
        LEFT JOIN hashtags h ON rh.hashtag_id = h.id
        WHERE r.id = $1
        GROUP BY r.id;
    `;
    try {
        const result = await db.query(query, [numericId]);
        return formatRestaurantForResponse(result.rows[0]); // Format the result
    } catch (error) {
        console.error(`[RestaurantModel findRestaurantById] Error fetching basic info for ID ${numericId}:`, error);
        throw error;
    }
};

export const createRestaurant = async (restaurantData) => {
    // *** ADDED LOGGING ***
    console.log('[RestaurantModel createRestaurant] Received Data:', JSON.stringify(restaurantData, null, 2));
    // *********************

    // Destructure and validate required fields first
    const { name, city_id } = restaurantData;
    if (!name) throw new Error("Restaurant name is required for creation.");
    // Allow city_id to be null for restaurants (if schema allows), but check if provided
    if (city_id !== null && (isNaN(Number(city_id)) || Number(city_id) <= 0)) {
        throw new Error("If city_id is provided, it must be a positive integer.");
    }

    // *** ADDED LOGGING: Log extracted/defaulted values ***
    const neighborhood_id = restaurantData.neighborhood_id ?? null;
    const city_name = restaurantData.city_name ?? null;
    const neighborhood_name = restaurantData.neighborhood_name ?? null;
    const address = restaurantData.address ?? null;
    const google_place_id = restaurantData.google_place_id ?? null;
    const latitude = restaurantData.latitude ?? null;
    const longitude = restaurantData.longitude ?? null;
    const phone_number = restaurantData.phone_number ?? null;
    const website = restaurantData.website ?? null;
    const instagram_handle = restaurantData.instagram_handle ?? null;
    const photo_url = restaurantData.photo_url ?? null;

    console.log('[RestaurantModel createRestaurant] Values Prepared for Insert:');
    console.log(`  name: ${name}`);
    console.log(`  city_id: ${city_id ?? 'NULL'}`); // Use null if not provided
    console.log(`  neighborhood_id: ${neighborhood_id ?? 'NULL'}`);
    console.log(`  city_name: ${city_name ?? 'NULL'}`);
    console.log(`  neighborhood_name: ${neighborhood_name ?? 'NULL'}`);
    console.log(`  address: ${address ?? 'NULL'}`);
    console.log(`  google_place_id: ${google_place_id ?? 'NULL'}`);
    console.log(`  latitude: ${latitude ?? 'NULL'}`);
    console.log(`  longitude: ${longitude ?? 'NULL'}`);
    console.log(`  phone_number: ${phone_number ?? 'NULL'}`);
    console.log(`  website: ${website ?? 'NULL'}`);
    console.log(`  instagram_handle: ${instagram_handle ?? 'NULL'}`);
    console.log(`  photo_url: ${photo_url ?? 'NULL'}`);
    // ****************************************************

    // Use lowercase 'restaurants'
    const query = `
        INSERT INTO restaurants (name, city_id, neighborhood_id, city_name, neighborhood_name, address, google_place_id, latitude, longitude, adds, created_at, updated_at, phone_number, website, instagram_handle, photo_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, NOW(), NOW(), $10, $11, $12, $13)
        ON CONFLICT (name, city_id) DO NOTHING
        RETURNING *;
     `;
     // Ensure all params match placeholders and use processed values
    const params = [
        name, city_id ?? null, neighborhood_id, city_name, neighborhood_name,
        address, google_place_id, latitude, longitude,
        phone_number, website, instagram_handle, photo_url
    ];
    try {
        const result = await db.query(query, params);
        if (result.rows.length === 0) {
            // Handle conflict or fetch existing
            console.warn(`[RestaurantModel createRestaurant] ON CONFLICT triggered for name "${name}", city_id ${city_id}. Fetching existing.`);
            const existingQuery = `
                SELECT r.*, COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}'::text[]) as tags
                FROM restaurants r
                LEFT JOIN restauranthashtags rh ON r.id = rh.restaurant_id
                LEFT JOIN hashtags h ON rh.hashtag_id = h.id
                WHERE r.name = $1 AND ${city_id ? 'r.city_id = $2' : 'r.city_id IS NULL'}
                GROUP BY r.id;
            `; // Use lowercase table names
            const existingParams = city_id ? [name, city_id] : [name];
            const existingResult = await db.query(existingQuery, existingParams);
            return formatRestaurantForResponse(existingResult.rows[0]); // Format result
        }
        const createdRestaurant = formatRestaurantForResponse(result.rows[0]); // Format result
        // Ensure tags array exists even if empty
        if (createdRestaurant && !createdRestaurant.tags) createdRestaurant.tags = [];
        return createdRestaurant;
    } catch (error) {
        console.error(`[RestaurantModel createRestaurant] Error creating restaurant "${name}":`, error);
        throw error;
    }
};

export const updateRestaurant = async (id, restaurantData) => {
    // ... (implementation remains the same) ...
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId) || numericId <= 0) {
        console.warn(`[RestaurantModel Update] Invalid ID: ${id}`);
        return null;
    }

    const fieldsToSet = [];
    const values = [];
    let paramIndex = 1;

    const addField = (dbField, value) => {
        if (value !== undefined) {
            fieldsToSet.push(`"${dbField}" = $${paramIndex++}`); // Keep column names quoted
            let finalValue = value;
            if (dbField === 'city_id' || dbField === 'neighborhood_id') {
                 finalValue = (value === '' || value === null) ? null : Number(value);
                 if (finalValue !== null && isNaN(finalValue)) throw new Error(`Invalid numeric value for ${dbField}.`);
            } else if (dbField === 'latitude' || dbField === 'longitude') {
                 finalValue = (value === '' || value === null) ? null : Number(value);
                 if (finalValue !== null && isNaN(finalValue)) throw new Error(`Invalid numeric value for ${dbField}.`);
            } else if (typeof value === 'string') {
                finalValue = value.trim() || null;
            }
            values.push(finalValue);
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
    addField('phone_number', restaurantData.phone_number);
    addField('website', restaurantData.website);
    addField('instagram_handle', restaurantData.instagram_handle);
    addField('photo_url', restaurantData.photo_url);

    if (fieldsToSet.length === 0) {
        console.warn(`[RestaurantModel Update] No changed fields provided for update on restaurant ${numericId}.`);
        return findRestaurantById(numericId);
    }

    fieldsToSet.push(`"updated_at" = NOW()`);
    const setClause = fieldsToSet.join(', ');
    const query = `UPDATE restaurants SET ${setClause} WHERE id = $${paramIndex} RETURNING id;`;
    values.push(numericId);

    console.log(`[RestaurantModel Update] Executing SQL for ID ${numericId}:`);
    console.log("   QUERY:", query);
    console.log("   PARAMS:", values);

    try {
        const result = await db.query(query, values);
        if (result.rowCount === 0) {
            console.warn(`[RestaurantModel Update] Restaurant with ID ${numericId} not found or no rows updated.`);
            const exists = await findRestaurantById(numericId);
            return exists ?? null;
        }
        console.log(`[RestaurantModel Update] Successfully updated ID ${numericId}. Refetching...`);
        return findRestaurantById(result.rows[0].id);
    } catch (error) {
        console.error(`[RestaurantModel updateRestaurant] Error updating restaurant ${numericId}:`, error);
        if (error?.code === '23505') { throw new Error(`Update failed: Value conflicts with an existing record.`); }
        if (error?.code === '23503') { throw new Error('Update failed: Invalid City or Neighborhood ID provided.'); }
        throw error;
    }
};

export const deleteRestaurant = async (id) => {
    // ... (implementation remains the same) ...
     const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
     if (isNaN(numericId) || numericId <= 0) { return false; }
    const query = 'DELETE FROM restaurants WHERE id = $1 RETURNING id';
    try {
        const result = await db.query(query, [numericId]);
        return (result.rowCount ?? 0) > 0;
    } catch (error) {
        console.error(`[RestaurantModel deleteRestaurant] Error deleting restaurant ${numericId}:`, error);
        if (error?.code === '23503') {
            throw new Error(`Cannot delete restaurant: It is referenced by other items (e.g., dishes).`);
        }
        throw error;
    }
};