// Filename: /doof-backend/models/dishModel.js
import { logError, logWarn, logInfo } from '../utils/logger.js';
import db from '../db/index.js';
import { formatDish } from '../utils/formatters.js';
import format from 'pg-format';

// Default dish model
const defaultDish = {
  name: '',
  description: '',
  restaurant_id: null,
  adds: 0,
  is_common: false
};

/**
 * Get all dishes with optional pagination and filtering
 */
export const getAllDishes = async ({ page = 1, limit = 50, search = null, restaurantId = null, sort = 'name', order = 'asc' } = {}) => {
  try {
    let baseQuery = `
      SELECT 
        d.id,
        d.name,
        d.description,
        d.restaurant_id,
        d.adds,
        d.created_at,
        d.updated_at,
        d.is_common,
        r.name as restaurant_name
      FROM dishes d
      LEFT JOIN restaurants r ON d.restaurant_id = r.id
    `;
    
    const conditions = [];
    const queryParams = [];
    let paramIndex = 1;
    
    // Add search filter
    if (search) {
      conditions.push(`(
        LOWER(d.name) LIKE LOWER($${paramIndex}) OR 
        LOWER(d.description) LIKE LOWER($${paramIndex})
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    // Add restaurant filter
    if (restaurantId) {
      conditions.push(`d.restaurant_id = $${paramIndex}`);
      queryParams.push(restaurantId);
      paramIndex++;
    }
    
    // Build WHERE clause
    if (conditions.length > 0) {
      baseQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // Add sorting
    const validSortColumns = ['name', 'created_at', 'updated_at', 'adds'];
    const sortColumn = validSortColumns.includes(sort) ? sort : 'name';
    const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    baseQuery += ` ORDER BY d.${sortColumn} ${sortOrder}`;
    
    // Add pagination
    const offset = (page - 1) * limit;
    baseQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);
    
    const result = await db.query(baseQuery, queryParams);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM dishes d';
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    const countResult = await db.query(countQuery, queryParams.slice(0, -2)); // Remove LIMIT and OFFSET params
    const totalCount = parseInt(countResult.rows[0].count);
    
    return {
      dishes: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        restaurant_id: row.restaurant_id,
        restaurant_name: row.restaurant_name,
        adds: row.adds || 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
        is_common: row.is_common || false
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    logError('Error in getAllDishes:', error);
    throw new Error('Failed to fetch dishes');
  }
};

/**
 * Get a single dish by ID
 */
export const getDishById = async (id) => {
  try {
    const query = `
      SELECT 
        d.id,
        d.name,
        d.description,
        d.restaurant_id,
        d.adds,
        d.created_at,
        d.updated_at,
        d.is_common,
        r.name as restaurant_name
      FROM dishes d
      LEFT JOIN restaurants r ON d.restaurant_id = r.id
      WHERE d.id = $1
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
      restaurant_id: row.restaurant_id,
      restaurant_name: row.restaurant_name,
      adds: row.adds || 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_common: row.is_common || false
    };
  } catch (error) {
    logError('Error in getDishById:', error);
    throw new Error('Failed to fetch dish');
  }
};

/**
 * Create a new dish
 */
export const createDish = async (dishData) => {
  try {
    const { name, description, restaurant_id } = dishData;
    
    const query = `
      INSERT INTO dishes (name, description, restaurant_id, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `;
    
    const result = await db.query(query, [name, description, restaurant_id]);
    
    if (result.rows.length === 0) {
      throw new Error('Failed to create dish');
    }
    
    return result.rows[0];
  } catch (error) {
    logError('Error in createDish:', error);
    throw new Error('Failed to create dish');
  }
};

/**
 * Update a dish
 */
export const updateDish = async (id, updateData) => {
  try {
    const { name, description, restaurant_id } = updateData;
    
    const query = `
      UPDATE dishes 
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          restaurant_id = COALESCE($3, restaurant_id),
          updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await db.query(query, [name, description, restaurant_id, id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    logError('Error in updateDish:', error);
    throw new Error('Failed to update dish');
  }
};

/**
 * Delete a dish
 */
export const deleteDish = async (id) => {
  try {
    const result = await db.query('DELETE FROM dishes WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    logError('Error in deleteDish:', error);
    throw new Error('Failed to delete dish');
  }
};

/**
 * Get dishes by restaurant
 */
export const getDishesByRestaurant = async (restaurantId, { page = 1, limit = 20 } = {}) => {
  try {
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT 
        id,
        name,
        description,
        restaurant_id,
        adds,
        created_at,
        updated_at,
        is_common
      FROM dishes
      WHERE restaurant_id = $1
      ORDER BY name ASC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await db.query(query, [restaurantId, limit, offset]);
    
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      restaurant_id: row.restaurant_id,
      adds: row.adds || 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_common: row.is_common || false
    }));
  } catch (error) {
    logError('Error in getDishesByRestaurant:', error);
    throw new Error('Failed to fetch dishes by restaurant');
  }
};

export default {
  getAllDishes,
  getDishById,
  createDish,
  updateDish,
  deleteDish,
  getDishesByRestaurant
};