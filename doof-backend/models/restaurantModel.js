/* main/doof-backend/models/restaurantModel.js */
// Patch: Remove non-existent 'photo_url' field from all parts of the model.

import db from '../db/index.js';

// Define similarity threshold constants
const SIMILARITY_THRESHOLD = 0.2; // Adjust as needed
const SINGLE_MATCH_THRESHOLD = 0.9; // Confidence score above which a single result is 'found'

// Helper function to format restaurant data
// REMOVED: photo_url from formatting
const formatRestaurant = (restaurant) => {
    if (!restaurant) return null;
    return {
        ...restaurant,
        id: Number(restaurant.id),
        city_id: restaurant.city_id ? Number(restaurant.city_id) : null,
        neighborhood_id: restaurant.neighborhood_id ? Number(restaurant.neighborhood_id) : null,
        chain_id: restaurant.chain_id ? Number(restaurant.chain_id) : null,
        latitude: restaurant.latitude ? parseFloat(restaurant.latitude) : null,
        longitude: restaurant.longitude ? parseFloat(restaurant.longitude) : null,
        rating: restaurant.rating ? parseFloat(restaurant.rating) : null,
        the_take_reviewer_verified: Boolean(restaurant.the_take_reviewer_verified),
        tags: Array.isArray(restaurant.tags) ? restaurant.tags : [],
        featured_on_lists: Array.isArray(restaurant.featured_on_lists) ? restaurant.featured_on_lists : [],
        similar_places: Array.isArray(restaurant.similar_places) ? restaurant.similar_places : [],
        hours: restaurant.hours || null,
        adds: restaurant.adds ? parseInt(restaurant.adds, 10) : 0,
        saved_count: restaurant.saved_count ? parseInt(restaurant.saved_count, 10) : 0,
        // photo_url: restaurant.photo_url, // REMOVED
        // Ensure other relevant fields are present or defaulted
        zip_code: restaurant.zip_code || null,
        phone: restaurant.phone || null,
        website: restaurant.website || null,
        google_place_id: restaurant.google_place_id || null,
        address: restaurant.address || null,
        name: restaurant.name || 'Unnamed Restaurant',
        city_name: restaurant.city_name || null,
        neighborhood_name: restaurant.neighborhood_name || null,
    };
};


/**
 * Finds restaurants by name using approximate string matching (similarity).
 * Can optionally filter by cityId. Returns results ordered by similarity score.
 * Includes city_name when cityId is not provided.
 * @param {string} name - The restaurant name to search for.
 * @param {number | string | null} [cityId=null] - Optional city ID to filter by.
 * @param {number} [limit=5] - Max number of results to return.
 * @returns {Promise<Array<object>>} - Array of restaurant objects with added 'score' and potentially 'city_name'.
 */
export const findRestaurantsApproximate = async (name, cityId = null, limit = 5) => {
    if (!name || String(name).trim() === '') {
        return [];
    }

    const searchTerm = String(name).trim();
    const numericCityId = Number(cityId);

    let queryParams = [searchTerm];
    let cityFilterClause = '';
    // *** UPDATED: Removed r.photo_url from SELECT list ***
    let selectFields = `
        r.id, r.name, r.address, r.google_place_id, r.zip_code, r.phone, r.website,
        r.city_id, c.name as city_name, r.neighborhood_id, n.name as neighborhood_name,
        similarity(r.name, $1) as score
    `;
    let joins = `
        LEFT JOIN cities c ON r.city_id = c.id
        LEFT JOIN neighborhoods n ON r.neighborhood_id = n.id
    `;
    const similarityFunction = `similarity(r.name, $1)`;
    let whereClause = `WHERE ${similarityFunction} > ${SIMILARITY_THRESHOLD}`;

    if (!isNaN(numericCityId) && numericCityId > 0) {
        queryParams.push(numericCityId);
        cityFilterClause = `AND r.city_id = $${queryParams.length}`;
        whereClause += ` ${cityFilterClause}`;
    }

    queryParams.push(limit);
    const limitClause = `LIMIT $${queryParams.length}`;

    const query = `
        SELECT ${selectFields}
        FROM restaurants r
        ${joins}
        ${whereClause}
        ORDER BY score DESC
        ${limitClause};
    `;

    try {
        // console.log(`[findRestaurantsApproximate] QUERY: ${query.replace(/\s+/g, ' ')}`);
        // console.log(`[findRestaurantsApproximate] PARAMS: ${JSON.stringify(queryParams)}`);
        const result = await db.query(query, queryParams);
        // Map results, ensuring correct types
        return result.rows.map(row => ({
            ...row, // Spread base row data
            id: Number(row.id),
            city_id: row.city_id ? Number(row.city_id) : null,
            neighborhood_id: row.neighborhood_id ? Number(row.neighborhood_id) : null, // Add neighborhood_id
            score: parseFloat(row.score)
        }));
    } catch (error) {
        console.error(`[RestaurantModel findRestaurantsApproximate] Error searching for "${name}" (CityID: ${cityId}):`, error);
        throw error;
    }
};


// Create Restaurant function
// REMOVED: photo_url from insertion
export const createRestaurant = async (restaurantData) => {
    const {
        name, city_id, neighborhood_id = null, chain_id = null,
        address = null, google_place_id = null,
        latitude = null, longitude = null, zip_code = null, phone = null, website = null,
        // Other potential fields from frontend bulk add: borough, city_name, neighborhood_name?
        // Let's only insert fields that are direct columns in the 'restaurants' table based on schema.sql
    } = restaurantData;

    if (!name || !city_id || isNaN(Number(city_id)) || Number(city_id) <= 0) {
        console.error("[createRestaurant] Invalid input: Name and valid City ID required.", restaurantData);
        throw new Error("Restaurant name and a valid city ID are required."); // Throw error for clarity
    }

    // REMOVED: photo_url from INSERT statement and params
    const query = `
        INSERT INTO restaurants
            (name, address, city_id, neighborhood_id, google_place_id, latitude, longitude, zip_code, phone, website, chain_id, updated_at, created_at)
        VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        ON CONFLICT (name, city_id) DO NOTHING -- Assumes uq_restaurant_name_city constraint
        RETURNING *;
    `;
    const params = [
        name, address, Number(city_id),
        neighborhood_id ? Number(neighborhood_id) : null,
        google_place_id,
        latitude != null ? parseFloat(latitude) : null, // Ensure null if not provided
        longitude != null ? parseFloat(longitude) : null, // Ensure null if not provided
        zip_code, phone, website,
        chain_id ? Number(chain_id) : null
    ];

    try {
        const result = await db.query(query, params);
        if (result.rowCount === 0) {
            console.warn(`[createRestaurant] Restaurant possibly already exists (conflict): Name='${name}', CityID=${city_id}`);
            // Optionally fetch the existing one to return consistent object
            const existing = await db.query('SELECT * FROM restaurants WHERE name = $1 AND city_id = $2', [name, Number(city_id)]);
            if (existing.rowCount > 0) {
                 return formatRestaurant(existing.rows[0]); // Format existing
            }
            return null; // Return null if conflict occurred but couldn't fetch existing
        }
        // Refetch with joins to include city/neighborhood names for consistent return format
        return findRestaurantById(result.rows[0].id);
    } catch (error) {
        console.error(`[RestaurantModel createRestaurant] Error creating restaurant "${name}":`, error);
        if (error.code === '23503') { // Foreign key violation
            console.error(`[createRestaurant] FK Violation Detail:`, error.constraint);
            let userMessage = 'Create failed due to an invalid reference.';
            if (error.constraint === 'fk_restaurant_city') userMessage = `Create failed: Invalid City ID provided (${city_id}).`;
            if (error.constraint === 'fk_restaurant_neighborhood') userMessage = `Create failed: Invalid Neighborhood ID provided (${neighborhood_id}).`;
            // Add check for chain FK if exists
            throw new Error(userMessage);
        }
        throw error; // Re-throw other errors
    }
};

// Update Restaurant function
// REMOVED: photo_url from allowedFields
export const updateRestaurant = async (id, updateData) => {
    const numericId = Number(id);
    if (isNaN(numericId) || numericId <= 0) {
        console.warn(`[updateRestaurant] Invalid ID: ${id}`);
        return null;
    }

    // REMOVED: photo_url from allowedFields
    const allowedFields = [
        'name', 'address', 'city_id', 'neighborhood_id', 'google_place_id',
        'latitude', 'longitude', 'zip_code', 'phone', 'website', 'chain_id'
        // Add other updatable fields from schema if necessary (e.g., borough?)
    ];
    const fieldsToSet = [];
    const values = [];
    let paramIndex = 1;

    allowedFields.forEach(field => {
        // Check if the field is explicitly provided in updateData (even if null/empty string)
        if (updateData.hasOwnProperty(field)) {
            fieldsToSet.push(`"${field}" = $${paramIndex++}`);
            let value = updateData[field];

            // Handle type conversions and empty strings -> null
            if (value === '' || value === undefined) {
                value = null;
            } else if (['city_id', 'neighborhood_id', 'chain_id'].includes(field)) {
                const numValue = Number(value);
                value = !isNaN(numValue) && numValue > 0 ? numValue : null; // Ensure positive integer or null
            } else if (['latitude', 'longitude'].includes(field)) {
                 const floatValue = parseFloat(value);
                 value = !isNaN(floatValue) ? floatValue : null; // Ensure float or null
            }
            // For string fields, trim if not null
            else if (typeof value === 'string') {
                 value = value.trim();
            }

            values.push(value);
        }
    });

    if (fieldsToSet.length === 0) {
        console.warn(`[updateRestaurant] No valid fields provided for update ID ${id}. Fetching current.`);
        // Fetch and return the current state if no changes are requested
        return findRestaurantById(numericId);
    }

    fieldsToSet.push(`"updated_at" = NOW()`);
    values.push(numericId); // Add ID for the WHERE clause
    const idParamIndex = paramIndex;
    const setClause = fieldsToSet.join(', ');

    const query = `UPDATE restaurants SET ${setClause} WHERE id = $${idParamIndex} RETURNING id;`; // Only return ID

    try {
        const result = await db.query(query, values);
        if (result.rowCount === 0) {
            console.warn(`[updateRestaurant] Restaurant ID ${id} not found or no changes applied.`);
             // Check if it actually exists
             const exists = await findRestaurantById(numericId);
             return exists ?? null; // Return current if exists, null if not found
        }
        // Refetch the full updated record with joins
        return findRestaurantById(numericId);
    } catch (error) {
        console.error(`[RestaurantModel updateRestaurant] Error updating restaurant ID ${id}:`, error);
        if (error.code === '23505') { // Unique constraint (name/city usually)
            throw new Error(`Update failed: The new name conflicts with an existing restaurant in the same city.`);
        } else if (error.code === '23503') { // Foreign key violation
            let userMessage = 'Update failed: Invalid reference provided.';
            if (error.constraint === 'fk_restaurant_city') userMessage = `Update failed: Invalid City ID provided.`;
            if (error.constraint === 'fk_restaurant_neighborhood') userMessage = `Update failed: Invalid Neighborhood ID provided.`;
            // Add chain FK check if exists
            throw new Error(userMessage);
        }
        throw error; // Re-throw other errors
    }
};

// Find Restaurant by ID
// No changes needed, already includes city/neighborhood names
export const findRestaurantById = async (id) => {
     if (!id || isNaN(Number(id))) return null;
     const numericId = Number(id);
     // REMOVED: photo_url was never selected here
     const query = `
          SELECT r.*, c.name as city_name, n.name as neighborhood_name
          FROM restaurants r
          LEFT JOIN cities c ON r.city_id = c.id
          LEFT JOIN neighborhoods n ON r.neighborhood_id = n.id
          WHERE r.id = $1
     `;
     try {
          const result = await db.query(query, [numericId]);
          return formatRestaurant(result.rows[0]); // Use formatter
     } catch (error) {
          console.error(`[RestaurantModel findRestaurantById] Error fetching restaurant ID ${numericId}:`, error);
          throw error;
     }
};

// Find Restaurants by Chain ID
// No changes needed, already includes city/neighborhood names
export const findRestaurantsByChainId = async (chainId) => {
    if (!chainId || isNaN(Number(chainId))) return [];
    const numericId = Number(chainId);
    // REMOVED: photo_url was never selected here
     const query = `
          SELECT r.*, c.name as city_name, n.name as neighborhood_name
          FROM restaurants r
          LEFT JOIN cities c ON r.city_id = c.id
          LEFT JOIN neighborhoods n ON r.neighborhood_id = n.id
          WHERE r.chain_id = $1
          ORDER BY c.name, r.name;
     `;
     try {
          const result = await db.query(query, [numericId]);
          return result.rows.map(formatRestaurant); // Use formatter
     } catch (error) {
          console.error(`[RestaurantModel findRestaurantsByChainId] Error fetching for chain ID ${numericId}:`, error);
          throw error;
     }
};

// Export the threshold constant
export { SINGLE_MATCH_THRESHOLD };

// Add other necessary functions if any...