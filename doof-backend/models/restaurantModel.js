// Filename: /doof-backend/models/restaurantModel.js
import db from '../db/index.js';
import { formatRestaurant } from '../utils/formatters.js';
import * as DishModel from './dishModel.js';
import * as HashtagModel from './hashtagModel.js';
import format from 'pg-format';

// Default values for optional fields
const DEFAULT_RESTAURANT = {
  description: '',
  cuisine: 'other',
  price_range: '$$$$',
  adds: 0,
  is_active: true
};

export const SIMILARITY_THRESHOLD = 0.2;
export const SINGLE_MATCH_THRESHOLD = 0.9;

/**
 * Find all restaurants with pagination and filtering
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20)
 * @param {string} options.sort - Field to sort by (default: 'created_at')
 * @param {string} options.order - Sort order ('asc' or 'desc', default: 'desc')
 * @param {string} options.search - Search term for restaurant name
 * @param {number} options.userId - Filter by user ID
 * @param {string} options.cuisine - Filter by cuisine type
 * @param {string} options.priceRange - Filter by price range
 * @returns {Promise<Object>} Paginated list of restaurants
 */
export const findAllRestaurants = async (options = {}) => {
  const {
    page = 1,
    limit = 20,
    sort = 'created_at',
    order = 'desc',
    search,
    userId,
    cuisine,
    priceRange
  } = options;

  const offset = (page - 1) * limit;
  const queryParams = [];
  let paramIndex = 0;

  // Build the base query with proper table aliases
  let query = `
    SELECT 
      r.*,
      c.name AS city_name,
      n.name AS neighborhood_name,
      COALESCE(
        (SELECT ARRAY_AGG(DISTINCT h.name ORDER BY h.name)
         FROM hashtags h
         JOIN restaurant_hashtags rh ON h.id = rh.hashtag_id
         WHERE rh.restaurant_id = r.id),
        '{}'::TEXT[]
      ) AS tags
    FROM restaurants r
    LEFT JOIN cities c ON r.city_id = c.id
    LEFT JOIN neighborhoods n ON r.neighborhood_id = n.id
  `;
  
  let countQuery = 'SELECT COUNT(*) FROM restaurants r';
  
  let whereClauses = [];
  
  if (search) {
    whereClauses.push(`r.name ILIKE $${++paramIndex}`);
    queryParams.push(`%${search}%`);
  }

  if (cuisine) {
    whereClauses.push(`r.cuisine = $${++paramIndex}`);
    queryParams.push(cuisine);
  }

  if (priceRange) {
    whereClauses.push(`r.price_range = $${++paramIndex}`);
    queryParams.push(priceRange);
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(' AND ')}`;
    countQuery += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  // Add sorting and pagination
  const validSortColumns = ['name', 'created_at', 'updated_at', 'adds'];
  const sortColumn = validSortColumns.includes(sort) ? 
    (sort === 'name' ? 'r.name' : `r.${sort}`) : 'r.created_at';
  const sortDirection = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  query += ` ORDER BY ${sortColumn} ${sortDirection} 
             LIMIT ${limit} OFFSET ${offset}`;

  try {
    console.log("[RestaurantModel findAllRestaurants] Query:", query, queryParams);
    console.log("[RestaurantModel findAllRestaurants] Count Query:", countQuery, queryParams);

    // Execute both queries in parallel
    const [results, countResult] = await Promise.all([
      db.query(query, queryParams).catch(err => {
        console.error('Error in main query:', err);
        throw err;
      }),
      db.query(countQuery, queryParams).catch(err => {
        console.error('Error in count query:', err);
        throw err;
      })
    ]);

    const total = parseInt(countResult.rows[0]?.count || 0, 10);

    // Map results to the expected format
    return {
      data: results.rows.map(row => ({
        id: Number(row.id),
        name: row.name || 'Unnamed Restaurant',
        description: row.description || null,
        cuisine: row.cuisine || null,
        price_range: row.price_range || null,
        city_name: row.city_name || null,
        neighborhood_name: row.neighborhood_name || null,
        tags: row.tags || [],  // Use tags from query if available
        adds: Number(row.adds || 0),
        address: row.address || null,
        google_place_id: row.google_place_id || null,
        latitude: row.latitude ? Number(row.latitude) : null,
        longitude: row.longitude ? Number(row.longitude) : null,
        city_id: row.city_id ? Number(row.city_id) : null,
        neighborhood_id: row.neighborhood_id ? Number(row.neighborhood_id) : null,
        created_by: row.created_by ? Number(row.created_by) : null,
        created_at: row.created_at || null,
        updated_at: row.updated_at || null
      })),
      total,
    };
  } catch (error) {
    console.error('Error in findAllRestaurants model:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      position: error.position,
      stack: error.stack
    });
    throw new Error(`Database error fetching restaurants: ${error.message}`);
  }
};

export const findRestaurantById = async (id, userId = null, options = {}) => {
  const { includeDishes = false } = options;
  let dishData = [];

  // Selects city_name and neighborhood_name via JOIN. photo_url is removed.
  const query = `
    SELECT r.*,
           c.name AS city_name,
           n.name AS neighborhood_name,
           COALESCE(
               (SELECT ARRAY_AGG(DISTINCT h.name ORDER BY h.name)
                FROM hashtags h
                JOIN restauranthashtags rh ON h.id = rh.hashtag_id
                WHERE rh.restaurant_id = r.id),
               '{}'::TEXT[]
           ) AS tags,
           EXISTS (
              SELECT 1 FROM listitems li_fav -- Corrected from list_items
              JOIN lists l_fav ON li_fav.list_id = l_fav.id
              WHERE li_fav.item_id = r.id AND li_fav.item_type = 'restaurant'
              AND l_fav.user_id = $2
            ) AS is_favorited_by_user
    FROM restaurants r
    LEFT JOIN cities c ON r.city_id = c.id
    LEFT JOIN neighborhoods n ON r.neighborhood_id = n.id
    WHERE r.id = $1
    GROUP BY r.id, c.name, n.name;
  `;
  try {
    const result = await db.query(query, [id, userId]);
    if (result.rows.length === 0) {
      return null;
    }
    let restaurant = result.rows[0];

    if (includeDishes) {
      dishData = await DishModel.findDishesByRestaurantId(id, { userId });
      restaurant.dishes = dishData;
    }
    return formatRestaurant(restaurant);
  } catch (error) {
    console.error(`Error in findRestaurantById model for ID ${id}:`, error);
    throw error;
  }
};

export const createRestaurant = async (restaurantData, client = db) => {
  const {
    name, address, city_id, neighborhood_id, zip_code, phone,
    website, instagram_handle, google_place_id, latitude, longitude,
    chain_id,
    tags = [] // Tags to be processed after restaurant creation
  } = restaurantData;

  // Columns that exist in schema_dump.sql for restaurants table
  const columnsToInsert = ['name', 'city_id']; // Required fields based on schema (city_id NOT NULL)
  const valuesToInsert = [name, city_id];
  const placeholders = ['$1', '$2'];
  let paramIndex = 2;

  const optionalFields = { address, neighborhood_id, zip_code, phone, website, instagram_handle, google_place_id, latitude, longitude, chain_id };

  for (const col in optionalFields) {
    if (optionalFields[col] !== undefined && optionalFields[col] !== null) {
      columnsToInsert.push(format('%I', col));
      valuesToInsert.push(optionalFields[col]);
      placeholders.push(`$${++paramIndex}`);
    }
  }

  const queryText = `
      INSERT INTO restaurants (${columnsToInsert.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *;
    `;

  const useSeparateClient = client === db; // Check if we need to manage the client
  const dbClient = useSeparateClient ? await db.getClient() : client;

  try {
    if (useSeparateClient) await dbClient.query('BEGIN');

    const newRestaurantResult = await dbClient.query(queryText, valuesToInsert);
    const newRestaurant = newRestaurantResult.rows[0];

    if (tags && tags.length > 0) {
      const tagIds = await HashtagModel.findOrCreateHashtags(tags, dbClient);
      await HashtagModel.linkTagsToRestaurant(newRestaurant.id, tagIds, dbClient);
    }

    if (useSeparateClient) await dbClient.query('COMMIT');
    return findRestaurantById(newRestaurant.id, null);
  } catch (error) {
    if (useSeparateClient) await dbClient.query('ROLLBACK');
    console.error('Error in createRestaurant model:', error);
    throw error;
  } finally {
    if (useSeparateClient) dbClient.release();
  }
};

export const updateRestaurant = async (id, updateData) => {
  const { tags, ...restaurantFields } = updateData;
  const validColumns = ['name', 'address', 'city_id', 'neighborhood_id', 'zip_code', 'phone', 'website', 'instagram_handle', 'google_place_id', 'latitude', 'longitude', 'adds', 'chain_id'];
  const client = await db.getClient();

  try {
    await client.query('BEGIN');
    const setClauses = [];
    const queryValues = [];
    let paramIndex = 1;

    validColumns.forEach(col => {
        if (restaurantFields.hasOwnProperty(col) && restaurantFields[col] !== undefined) {
            setClauses.push(format('%I = $%s', col, paramIndex++));
            queryValues.push(restaurantFields[col]);
        }
    });

    if (setClauses.length > 0) {
      setClauses.push(format('%I = CURRENT_TIMESTAMP', 'updated_at')); // Always update 'updated_at'
      queryValues.push(id);
      const restaurantUpdateQuery = `UPDATE restaurants SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *;`;
      await client.query(restaurantUpdateQuery, queryValues);
    }

    if (tags !== undefined) {
      await client.query('DELETE FROM restauranthashtags WHERE restaurant_id = $1', [id]);
      if (tags.length > 0) {
        const tagIds = await HashtagModel.findOrCreateHashtags(tags, client);
        await HashtagModel.linkTagsToRestaurant(id, tagIds, client);
      }
    }

    await client.query('COMMIT');
    return findRestaurantById(id, null);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error in updateRestaurant model for ID ${id}:`, error);
    throw error;
  } finally {
    client.release();
  }
};

export const deleteRestaurant = async (id) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM restauranthashtags WHERE restaurant_id = $1', [id]);
    await client.query('DELETE FROM listitems WHERE item_id = $1 AND item_type = \'restaurant\'', [id]); // Use 'listitems'
    const result = await client.query('DELETE FROM restaurants WHERE id = $1 RETURNING *', [id]);
    await client.query('COMMIT');
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error in deleteRestaurant model for ID ${id}:`, error);
    throw error;
  } finally {
    client.release();
  }
};

export const addTagToRestaurant = async (restaurantId, hashtagId) => {
  try {
    const query = `
      INSERT INTO restauranthashtags (restaurant_id, hashtag_id)
      VALUES ($1, $2)
      ON CONFLICT (restaurant_id, hashtag_id) DO NOTHING
      RETURNING *;
    `;
    const result = await db.query(query, [restaurantId, hashtagId]);
    return result.rows[0];
  } catch (error) {
    console.error(`Error adding tag ${hashtagId} to restaurant ${restaurantId}:`, error);
    throw error;
  }
};

export const removeTagFromRestaurant = async (restaurantId, hashtagId) => {
  try {
    const query = `
      DELETE FROM restauranthashtags
      WHERE restaurant_id = $1 AND hashtag_id = $2
      RETURNING *;
    `;
    const result = await db.query(query, [restaurantId, hashtagId]);
    return result.rows.length > 0;
  } catch (error) {
    console.error(`Error removing tag ${hashtagId} from restaurant ${restaurantId}:`, error);
    throw error;
  }
};

export const findRestaurantsApproximate = async (name, cityId = null, limit = 5) => {
    if (!name || name.trim() === '') {
        return [];
    }
    try {
        let query = `
            SELECT r.id, r.name, r.address, r.city_id,
                   c.name AS city_name,
                   similarity(r.name, $1) AS name_similarity
            FROM restaurants r
            LEFT JOIN cities c ON r.city_id = c.id
        `;
        const params = [name];
        let whereClauses = [];
        let paramCount = 1;

        whereClauses.push(`r.name % $${paramCount}`);

        if (cityId) {
            params.push(cityId);
            whereClauses.push(`r.city_id = $${++paramCount}`);
        }

        if (whereClauses.length > 0) {
            query += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        params.push(limit);
        query += `
            ORDER BY name_similarity DESC
            LIMIT $${++paramCount};
        `;

        const { rows } = await db.query(query, params);
        return rows.map(row => formatRestaurant(row));
    } catch (error) {
        console.error('Error in findRestaurantsApproximate:', error);
        throw error;
    }
};