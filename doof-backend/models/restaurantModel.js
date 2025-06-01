// Filename: /doof-backend/models/restaurantModel.js
import db from '../db/index.js';
import { formatRestaurant } from '../utils/formatters.js';
import * as DishModel from './dishModel.js';
import * as HashtagModel from './hashtagModel.js';
import format from 'pg-format';
import { logError, logWarn, logInfo } from '../utils/logger.js';

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

// Helper function to extract zip code from address
const extractZipCodeFromAddress = (address) => {
  if (!address) return null;
  const zipMatch = address.match(/\b(\d{5}(?:-\d{4})?)\b/);
  return zipMatch ? zipMatch[1] : null;
};

// Helper function to find neighborhood by zip code
const findNeighborhoodByZipCode = async (zipCode) => {
  if (!zipCode || !/^\d{5}$/.test(zipCode)) {
    return null;
  }
  
  try {
    console.log(`[RestaurantModel] Looking up neighborhood for zip code: ${zipCode}`);
    
    const query = `
      SELECT id, name, city_id 
      FROM neighborhoods 
      WHERE $1 = ANY(zipcode_ranges) 
      ORDER BY name ASC 
      LIMIT 1
    `;
    
    const result = await db.query(query, [zipCode]);
    
    if (result.rows.length > 0) {
      const neighborhood = result.rows[0];
      console.log(`[RestaurantModel] Found neighborhood for zip ${zipCode}: ${neighborhood.name} (ID: ${neighborhood.id})`);
      return neighborhood;
    } else {
      console.log(`[RestaurantModel] No neighborhood found for zip code: ${zipCode}`);
      return null;
    }
  } catch (error) {
    console.error(`[RestaurantModel] Error looking up neighborhood for zip ${zipCode}:`, error);
    return null;
  }
};

// Helper function to auto-assign neighborhood and city based on address
const autoAssignLocationData = async (restaurantData) => {
  // Don't override if neighborhood_id is already provided
  if (restaurantData.neighborhood_id) {
    return restaurantData;
  }

  // Try to extract zip code from address
  const zipCode = extractZipCodeFromAddress(restaurantData.address);
  if (!zipCode) {
    return restaurantData;
  }

  // Look up neighborhood by zip code
  const neighborhood = await findNeighborhoodByZipCode(zipCode);
  if (neighborhood) {
    return {
      ...restaurantData,
      neighborhood_id: neighborhood.id,
      city_id: neighborhood.city_id // Also auto-assign city if not provided
    };
  }

  return restaurantData;
};

/**
 * Enhanced restaurant search with filters and pagination
 * @param {Object} options - Search options
 * @param {string} options.query - Search query for restaurant names
 * @param {number} options.page - Page number for pagination
 * @param {number} options.limit - Number of results per page
 * @param {string} options.sort - Sort field
 * @param {string} options.order - Sort order ('asc' or 'desc')
 * @param {string} options.cuisine - Filter by cuisine type
 * @param {number} options.cityId - Filter by city ID
 * @param {number} options.neighborhoodId - Filter by neighborhood ID
 * @returns {Promise<Object>} Paginated search results
 */
export const searchRestaurants = async (options = {}) => {
  const {
    query = '',
    page = 1,
    limit = 20,
    sort = 'name',
    order = 'asc',
    cuisine,
    cityId,
    neighborhoodId
  } = options;

  try {
    let baseQuery = `
      SELECT 
        r.id,
        r.name,
        r.description,
        r.address,
        r.cuisine,
        r.website,
        r.phone,
        r.city_id,
        r.neighborhood_id,
        r.created_at,
        r.updated_at,
        c.name as city_name,
        n.name as neighborhood_name
      FROM restaurants r
      LEFT JOIN cities c ON r.city_id = c.id
      LEFT JOIN neighborhoods n ON r.neighborhood_id = n.id
    `;

    const whereClauses = [];
    const queryParams = [];
    let paramIndex = 1;

    // Add search query
    if (query) {
      whereClauses.push(`(
        LOWER(r.name) LIKE LOWER($${paramIndex}) OR 
        LOWER(r.description) LIKE LOWER($${paramIndex}) OR
        LOWER(r.cuisine) LIKE LOWER($${paramIndex})
      )`);
      queryParams.push(`%${query}%`);
      paramIndex++;
    }

    // Add cuisine filter
    if (cuisine) {
      whereClauses.push(`LOWER(r.cuisine) = LOWER($${paramIndex})`);
      queryParams.push(cuisine);
      paramIndex++;
    }

    // Add city filter
    if (cityId) {
      whereClauses.push(`r.city_id = $${paramIndex}`);
      queryParams.push(cityId);
      paramIndex++;
    }

    // Add neighborhood filter
    if (neighborhoodId) {
      whereClauses.push(`r.neighborhood_id = $${paramIndex}`);
      queryParams.push(neighborhoodId);
      paramIndex++;
    }

    // Build WHERE clause
    if (whereClauses.length > 0) {
      baseQuery += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    // Add sorting
    const validSortColumns = ['name', 'cuisine', 'created_at', 'updated_at'];
    const sortColumn = validSortColumns.includes(sort) ? sort : 'name';
    const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    baseQuery += ` ORDER BY r.${sortColumn} ${sortOrder}`;

    // Add pagination
    const offset = (page - 1) * limit;
    baseQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await db.query(baseQuery, queryParams);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM restaurants r';
    if (whereClauses.length > 0) {
      countQuery += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    const countResult = await db.query(countQuery, queryParams.slice(0, -2));
    const totalCount = parseInt(countResult.rows[0].count);

    return {
      restaurants: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        address: row.address,
        cuisine: row.cuisine,
        website: row.website,
        phone: row.phone,
        city_id: row.city_id,
        neighborhood_id: row.neighborhood_id,
        city_name: row.city_name,
        neighborhood_name: row.neighborhood_name,
        created_at: row.created_at,
        updated_at: row.updated_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    logError('Error in searchRestaurants:', error);
    throw new Error('Failed to search restaurants');
  }
};

/**
 * Get all restaurants with optional pagination and filtering
 */
export const getAllRestaurants = async ({ page = 1, limit = 50, search = null, cityId = null, cuisine = null, sort = 'name', order = 'asc' } = {}) => {
  try {
    let baseQuery = `
      SELECT 
        r.id,
        r.name,
        r.description,
        r.address,
        r.cuisine,
        r.website,
        r.phone,
        r.city_id,
        r.neighborhood_id,
        r.created_at,
        r.updated_at,
        c.name as city_name,
        n.name as neighborhood_name
      FROM restaurants r
      LEFT JOIN cities c ON r.city_id = c.id
      LEFT JOIN neighborhoods n ON r.neighborhood_id = n.id
    `;
    
    const conditions = [];
    const queryParams = [];
    let paramIndex = 1;
    
    // Add search filter
    if (search) {
      conditions.push(`(
        LOWER(r.name) LIKE LOWER($${paramIndex}) OR 
        LOWER(r.description) LIKE LOWER($${paramIndex}) OR
        LOWER(r.address) LIKE LOWER($${paramIndex})
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    // Add city filter
    if (cityId) {
      conditions.push(`r.city_id = $${paramIndex}`);
      queryParams.push(cityId);
      paramIndex++;
    }
    
    // Add cuisine filter
    if (cuisine) {
      conditions.push(`LOWER(r.cuisine) = LOWER($${paramIndex})`);
      queryParams.push(cuisine);
      paramIndex++;
    }
    
    // Build WHERE clause
    if (conditions.length > 0) {
      baseQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // Add sorting
    const validSortColumns = ['name', 'cuisine', 'created_at', 'updated_at'];
    const sortColumn = validSortColumns.includes(sort) ? sort : 'name';
    const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    baseQuery += ` ORDER BY r.${sortColumn} ${sortOrder}`;
    
    // Add pagination
    const offset = (page - 1) * limit;
    baseQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);
    
    const result = await db.query(baseQuery, queryParams);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM restaurants r';
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    const countResult = await db.query(countQuery, queryParams.slice(0, -2));
    const totalCount = parseInt(countResult.rows[0].count);
    
    return {
      restaurants: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        address: row.address,
        cuisine: row.cuisine,
        website: row.website,
        phone: row.phone,
        city_id: row.city_id,
        neighborhood_id: row.neighborhood_id,
        city_name: row.city_name,
        neighborhood_name: row.neighborhood_name,
        created_at: row.created_at,
        updated_at: row.updated_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    logError('Error in getAllRestaurants:', error);
    throw new Error('Failed to fetch restaurants');
  }
};

/**
 * Get a single restaurant by ID
 */
export const getRestaurantById = async (id) => {
  try {
    const query = `
      SELECT 
        r.id,
        r.name,
        r.description,
        r.address,
        r.cuisine,
        r.website,
        r.phone,
        r.city_id,
        r.neighborhood_id,
        r.created_at,
        r.updated_at,
        c.name as city_name,
        n.name as neighborhood_name
      FROM restaurants r
      LEFT JOIN cities c ON r.city_id = c.id
      LEFT JOIN neighborhoods n ON r.neighborhood_id = n.id
      WHERE r.id = $1
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      address: row.address,
      cuisine: row.cuisine,
      website: row.website,
      phone: row.phone,
      city_id: row.city_id,
      neighborhood_id: row.neighborhood_id,
      city_name: row.city_name,
      neighborhood_name: row.neighborhood_name,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  } catch (error) {
    logError('Error in getRestaurantById:', error);
    throw new Error('Failed to fetch restaurant');
  }
};

/**
 * Create a new restaurant
 */
export const createRestaurant = async (restaurantData) => {
  try {
    const { name, description, address, cuisine, website, phone, city_id, neighborhood_id, created_by } = restaurantData;
    
    const query = `
      INSERT INTO restaurants (name, description, address, cuisine, website, phone, city_id, neighborhood_id, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `;
    
    const result = await db.query(query, [name, description, address, cuisine, website, phone, city_id, neighborhood_id, created_by]);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to create restaurant');
    }
    
    return result.rows[0];
  } catch (error) {
    logError('Error in createRestaurant:', error);
    throw new Error('Failed to create restaurant');
  }
};

/**
 * Update a restaurant
 */
export const updateRestaurant = async (id, updateData) => {
  try {
    const { name, description, address, cuisine, website, phone, city_id, neighborhood_id } = updateData;
    
    const query = `
      UPDATE restaurants 
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          address = COALESCE($3, address),
          cuisine = COALESCE($4, cuisine),
          website = COALESCE($5, website),
          phone = COALESCE($6, phone),
          city_id = COALESCE($7, city_id),
          neighborhood_id = COALESCE($8, neighborhood_id),
          updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `;
    
    const result = await db.query(query, [name, description, address, cuisine, website, phone, city_id, neighborhood_id, id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    logError('Error in updateRestaurant:', error);
    throw new Error('Failed to update restaurant');
  }
};

/**
 * Delete a restaurant
 */
export const deleteRestaurant = async (id) => {
  try {
    const result = await db.query('DELETE FROM restaurants WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    logError('Error in deleteRestaurant:', error);
    throw new Error('Failed to delete restaurant');
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