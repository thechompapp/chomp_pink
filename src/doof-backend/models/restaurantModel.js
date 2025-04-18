/* src/doof-backend/models/restaurantModel.js */
import db from '../db/index.js';

// Formatter: Ensure NO HTML encoding happens here.
export const formatRestaurantForResponse = (restaurant) => {
    if (!restaurant) return null;
    try {
        const tagsArray = Array.isArray(restaurant.tags)
            ? restaurant.tags.filter((tag) => typeof tag === 'string' && tag.length > 0)
            : [];
        // Extract only fields defined in schema.sql for restaurants table
        const name = restaurant.name || "Unknown Restaurant";
        const address = restaurant.address || null;
        const google_place_id = restaurant.google_place_id || null;
        const city_name = restaurant.city_name || null; // From DB, not the input object directly if possible
        const neighborhood_name = restaurant.neighborhood_name || null; // From DB, not the input object directly if possible

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
            // Remove fields not in schema: phone_number, website, instagram_handle, photo_url
        };
    } catch (e) {
        console.error(`[RestaurantModel Format Error] Failed to format restaurant row:`, restaurant, e);
        return null;
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
    // Ensure query selects columns that exist in the table + aggregated tags
    const restaurantQuery = `
      SELECT r.id, r.name, r.city_id, r.neighborhood_id, r.address, r.google_place_id,
             r.latitude, r.longitude, r.adds, r.created_at, r.updated_at, r.city_name, r.neighborhood_name,
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
    // Ensure query selects columns that exist in the table + aggregated tags
    const query = `
        SELECT r.id, r.name, r.city_id, r.neighborhood_id, r.address, r.google_place_id,
               r.latitude, r.longitude, r.adds, r.created_at, r.updated_at, r.city_name, r.neighborhood_name,
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
    console.log('[RestaurantModel createRestaurant] Received Data:', JSON.stringify(restaurantData, null, 2));

    const { name, city_id } = restaurantData;

    if (!name) throw new Error("Restaurant name is required for creation.");
    if (city_id === null || city_id === undefined || isNaN(Number(city_id)) || Number(city_id) <= 0) {
        throw new Error("A valid positive integer City ID is required for restaurant creation.");
    }

    // Extract only fields present in schema.sql restaurants table
    const neighborhood_id = restaurantData.neighborhood_id ?? null;
    const city_name = restaurantData.city_name ?? null;
    const neighborhood_name = restaurantData.neighborhood_name ?? null;
    const address = restaurantData.address ?? null;
    const google_place_id = restaurantData.google_place_id ?? null;
    const latitude = restaurantData.latitude ?? null;
    const longitude = restaurantData.longitude ?? null;
    // Removed: phone_number, website, instagram_handle, photo_url

    console.log('[RestaurantModel createRestaurant] Values Prepared for Insert:');
    console.log(`  name: ${name}`);
    console.log(`  city_id: ${city_id}`);
    console.log(`  neighborhood_id: ${neighborhood_id ?? 'NULL'}`);
    console.log(`  city_name: ${city_name ?? 'NULL'}`);
    console.log(`  neighborhood_name: ${neighborhood_name ?? 'NULL'}`);
    console.log(`  address: ${address ?? 'NULL'}`);
    console.log(`  google_place_id: ${google_place_id ?? 'NULL'}`);
    console.log(`  latitude: ${latitude ?? 'NULL'}`);
    console.log(`  longitude: ${longitude ?? 'NULL'}`);
    // Removed logs for missing fields

    // *** FIXED INSERT QUERY to match schema.sql ***
    const query = `
        INSERT INTO restaurants (name, city_id, neighborhood_id, city_name, neighborhood_name, address, google_place_id, latitude, longitude, adds, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, NOW(), NOW())
        ON CONFLICT (name, city_id) DO NOTHING
        RETURNING *;
     `;
    // *** FIXED PARAMS ARRAY to match query ***
    const params = [
        name, city_id, neighborhood_id, city_name, neighborhood_name,
        address, google_place_id, latitude, longitude
    ];

    try {
        const result = await db.query(query, params);
        if (result.rows.length === 0) {
            console.warn(`[RestaurantModel createRestaurant] ON CONFLICT triggered for name "${name}", city_id ${city_id}. Fetching existing.`);
             // Ensure existing query only selects valid columns
            const existingQuery = `
                SELECT r.id, r.name, r.city_id, r.neighborhood_id, r.address, r.google_place_id,
                       r.latitude, r.longitude, r.adds, r.created_at, r.updated_at, r.city_name, r.neighborhood_name,
                       COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}'::text[]) as tags
                FROM restaurants r
                LEFT JOIN restauranthashtags rh ON r.id = rh.restaurant_id
                LEFT JOIN hashtags h ON rh.hashtag_id = h.id
                WHERE r.name = $1 AND r.city_id = $2
                GROUP BY r.id;
            `;
            const existingParams = [name, city_id];
            const existingResult = await db.query(existingQuery, existingParams);
            return formatRestaurantForResponse(existingResult.rows[0]);
        }
        const createdRestaurant = formatRestaurantForResponse(result.rows[0]);
        if (createdRestaurant && !createdRestaurant.tags) createdRestaurant.tags = [];
        return createdRestaurant;
    } catch (dbError) { // Renamed variable for clarity
        console.error(`[RestaurantModel createRestaurant] Error creating restaurant "${name}":`, dbError);
         // Log the DB error details
         console.error('[DB Query Error]', {
             text: query, // Log the query text
             params: params, // Log the params used
             error: dbError.message, // Log the error message
             code: dbError.code, // Log the error code
             detail: dbError.detail // Log detail if available
         });
        throw dbError; // Re-throw the original database error
    }
};


export const updateRestaurant = async (id, restaurantData) => {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (isNaN(numericId) || numericId <= 0) {
        console.warn(`[RestaurantModel Update] Invalid ID: ${id}`);
        return null;
    }

    const fieldsToSet = [];
    const values = [];
    let paramIndex = 1;

    const addField = (dbField, value) => {
        // *** List of allowed fields based on schema.sql ***
        const allowedFields = [
            'name', 'city_id', 'neighborhood_id', 'city_name', 'neighborhood_name',
            'address', 'google_place_id', 'latitude', 'longitude'
            // Removed: 'phone_number', 'website', 'instagram_handle', 'photo_url'
        ];
        if (!allowedFields.includes(dbField)) {
             console.warn(`[RestaurantModel Update addField] Attempted to update non-existent field '${dbField}'. Ignoring.`);
             return; // Skip fields not in schema
        }

        // Process only if the field is actually provided in updateData
        if (value !== undefined) {
            fieldsToSet.push(`"${dbField}" = $${paramIndex++}`);
            let finalValue = value;
            // Specific type handling
            if (dbField === 'city_id' || dbField === 'neighborhood_id') {
                 finalValue = (value === '' || value === null) ? null : Number(value);
                 if (dbField === 'city_id' && finalValue !== null && (isNaN(finalValue) || finalValue <= 0)) throw new Error(`Invalid numeric value for ${dbField}. City ID must be a positive integer.`);
                 if (dbField === 'neighborhood_id' && finalValue !== null && isNaN(finalValue)) throw new Error(`Invalid numeric value for ${dbField}.`);
            } else if (dbField === 'latitude' || dbField === 'longitude') {
                 finalValue = (value === '' || value === null) ? null : Number(value);
                 if (finalValue !== null && isNaN(finalValue)) throw new Error(`Invalid numeric value for ${dbField}.`);
            } else if (typeof value === 'string') {
                finalValue = value.trim() || null;
            }
            values.push(finalValue);
        }
    };

    // Call addField only for fields present in schema.sql
    addField('name', restaurantData.name);
    addField('city_id', restaurantData.city_id);
    addField('neighborhood_id', restaurantData.neighborhood_id);
    addField('city_name', restaurantData.city_name);
    addField('neighborhood_name', restaurantData.neighborhood_name);
    addField('address', restaurantData.address);
    addField('google_place_id', restaurantData.google_place_id);
    addField('latitude', restaurantData.latitude);
    addField('longitude', restaurantData.longitude);
    // Removed calls for: phone_number, website, instagram_handle, photo_url

    if (fieldsToSet.length === 0) {
        console.warn(`[RestaurantModel Update] No changed & valid fields provided for update on restaurant ${numericId}.`);
        return findRestaurantById(numericId); // Return current data if no valid changes
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
        return findRestaurantById(result.rows[0].id); // Refetch to get latest data including tags
    } catch (error) {
        console.error(`[RestaurantModel updateRestaurant] Error updating restaurant ${numericId}:`, error);
        if (error?.code === '23505') { throw new Error(`Update failed: Value conflicts with an existing record.`); }
        if (error?.code === '23502' && error.column === 'city_id') { throw new Error('Update failed: City ID cannot be set to null.'); }
        if (error?.code === '23503') { throw new Error('Update failed: Invalid City or Neighborhood ID provided.'); }
        // Handle undefined column error during update as well
        if (error?.code === '42703') {
             console.error(`[RestaurantModel Update] Undefined column error. Query: ${query} Params: ${values}`);
             throw new Error(`Update failed: Column mismatch. Details: ${error.message}`);
        }
        throw error;
    }
};


export const deleteRestaurant = async (id) => {
    // ... (implementation remains the same) ...
     const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
     if (isNaN(numericId) || numericId <= 0) { return false; }
     // Use lowercase 'restaurants'
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