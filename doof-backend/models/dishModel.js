// Filename: /doof-backend/models/dishModel.js
import db from '../db/index.js';
import { formatDish } from '../utils/formatters.js';
import format from 'pg-format';

// Default values for optional fields
const DEFAULT_DISH = {
  description: '',
  price: '0.00',
  category: 'main',
  is_common: false,
  adds: 0
};

/**
 * Find all dishes with pagination and filtering
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 20)
 * @param {string} options.sort - Field to sort by (default: 'name')
 * @param {string} options.order - Sort order ('asc' or 'desc', default: 'asc')
 * @param {string} options.search - Search term for dish name
 * @param {Object} options.filters - Additional filters
 * @param {number} options.filters.restaurantId - Filter by restaurant ID
 * @param {string} options.filters.category - Filter by category
 * @returns {Promise<Object>} Paginated list of dishes
 */
export const findAllDishes = async (options = {}) => {
  const {
    page = 1,
    limit = 20,
    sort = 'name',
    order = 'asc',
    search = '',
    filters = {}
  } = options;
  
  const offset = (page - 1) * limit;

  const whereClauses = [];
  const queryParams = [];
  let paramIndex = 1;

  // Build the base query with proper table aliases
  let query = `
    SELECT 
      d.*,
      r.name AS restaurant_name,
      r.address AS restaurant_address,
      c.name AS city_name,
      n.name AS neighborhood_name,
      COALESCE(
        (SELECT ARRAY_AGG(DISTINCT h.name ORDER BY h.name)
         FROM hashtags h
         JOIN dishhashtags dh ON h.id = dh.hashtag_id
         WHERE dh.dish_id = d.id),
        '{}'::TEXT[]
      ) AS tags
    FROM dishes d
    JOIN restaurants r ON d.restaurant_id = r.id
    LEFT JOIN cities c ON r.city_id = c.id
    LEFT JOIN neighborhoods n ON r.neighborhood_id = n.id
  `;
  
  let countQuery = 'SELECT COUNT(*) FROM dishes d';
  
  // Apply search filter
  if (search) {
    whereClauses.push(`d.name ILIKE $${paramIndex++}`);
    queryParams.push(`%${search}%`);
  }

  // Apply restaurant filter
  if (filters.restaurantId) {
    whereClauses.push(`d.restaurant_id = $${paramIndex++}`);
    queryParams.push(filters.restaurantId);
  }
  
  // Apply category filter
  if (filters.category) {
    whereClauses.push(`d.category = $${paramIndex++}`);
    queryParams.push(filters.category);
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(' AND ')}`;
    countQuery += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  // Add sorting and pagination
  const validSortColumns = ['name', 'price', 'created_at', 'updated_at', 'adds'];
  const sortColumn = validSortColumns.includes(sort) ? 
    (sort === 'name' ? 'd.name' : `d.${sort}`) : 'd.name';
  const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  query += ` ORDER BY ${sortColumn} ${sortOrder} 
             LIMIT ${limit} OFFSET ${offset}`;

  try {
    console.log("[DishModel findAllDishes] Query:", query, queryParams);
    console.log("[DishModel findAllDishes] Count Query:", countQuery, queryParams);

    const results = await db.query(query, queryParams);
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0]?.count || 0, 10);

    // Format the results
    return {
      data: results.rows.map(row => ({
        id: Number(row.id),
        name: row.name || 'Unnamed Dish',
        description: row.description || '',
        price: _formatPrice(row.price),
        category: row.category || 'main',
        isCommon: Boolean(row.is_common),
        adds: Number(row.adds || 0),
        restaurant: {
          id: Number(row.restaurant_id),
          name: row.restaurant_name,
          address: row.restaurant_address,
          city: row.city_name,
          neighborhood: row.neighborhood_name
        },
        tags: row.tags || [],
        createdBy: row.created_by ? Number(row.created_by) : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      })),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Error in findAllDishes model:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      position: error.position,
      stack: error.stack
    });
    throw new Error(`Database error fetching dishes: ${error.message}`);
  }
};

/**
 * Format price consistently
 * @private
 * @param {string|number} price - Price to format
 * @returns {string} Formatted price with 2 decimal places
 */
function _formatPrice(price) {
  if (price === null || price === undefined || price === '') {
    return '0.00';
  }
  
  // Convert to number and format with 2 decimal places
  const num = typeof price === 'number' ? price : parseFloat(price);
  return isNaN(num) ? '0.00' : num.toFixed(2);
}

export { _formatPrice };
/**
 * Find all dishes for a specific restaurant
 * @param {number} restaurantId - The ID of the restaurant
 * @param {Object} options - Query options
 * @param {number} options.limit - Maximum number of dishes to return
 * @param {number} options.offset - Number of dishes to skip
 * @returns {Promise<Array>} Array of dish objects
 */
export const findDishesByRestaurantId = async (restaurantId, options = {}) => {
  try {
    const { limit = 100, offset = 0 } = options;
    
    const query = `
      SELECT d.*, r.name as restaurant_name
      FROM dishes d
      LEFT JOIN restaurants r ON d.restaurant_id = r.id
      WHERE d.restaurant_id = $1
      ORDER BY d.name
      LIMIT $2 OFFSET $3`;
      
    const result = await db.query(query, [restaurantId, limit, offset]);
    
    return result.rows.map(row => ({
      id: Number(row.id),
      name: row.name || 'Unnamed Dish',
      restaurant_id: row.restaurant_id ? Number(row.restaurant_id) : null,
      restaurant_name: row.restaurant_name || null,
      description: row.description || null,
      price: row.price ? Number(row.price) : null,
      category: row.category || 'main',
      is_common: Boolean(row.is_common),
      adds: Number(row.adds || 0),
      created_by: row.created_by ? Number(row.created_by) : null,
      created_at: row.created_at || null,
      updated_at: row.updated_at || null
    }));
  } catch (error) {
    console.error('Error in findDishesByRestaurantId:', error);
    throw new Error(`Failed to fetch dishes for restaurant ${restaurantId}`);
  }
};
export const findDishById = async (id) => {
  try {
    const query = 'SELECT * FROM dishes WHERE id = $1';
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: Number(row.id),
      name: row.name || 'Unnamed Dish',
      restaurant_id: row.restaurant_id ? Number(row.restaurant_id) : null,
      description: row.description || null,
      price: row.price ? Number(row.price) : null,
      category: row.category || null,
      tags: [],  // Simplified - not fetching tags
      adds: Number(row.adds || 0),
      created_by: row.created_by ? Number(row.created_by) : null,
      created_at: row.created_at || null,
      updated_at: row.updated_at || null
    };
  } catch (error) {
    console.error('Error in findDishById model:', error);
    throw new Error(`Database error fetching dish with ID ${id}.`);
  }
};
export const createDish = async (dishData) => { /* ... implementation ... */ };
export const updateDish = async (id, dishData) => { /* ... implementation ... */ };
export const deleteDish = async (id) => { /* ... implementation ... */ };
export const addTagToDish = async (dishId, hashtagId) => { /* ... implementation ... */ };
export const removeTagFromDish = async (dishId, hashtagId) => { /* ... implementation ... */ };
export const checkDishExistence = async (name, restaurantId) => { /* ... implementation ... */ };
// Export findDishesByName if it exists and is used
export const findDishesByName = async (name, limit = 20, offset = 0) => { /* ... implementation from fetched file ... */ };


// Export default object if needed (optional)
// const DishModel = { ... };
// export default DishModel;