/**
 * Simplified Dish Model
 * 
 * This is a simplified version of the dish model that works with
 * our database schema for E2E testing.
 */

import db from '../db/index.js';

/**
 * Format a dish object for API response
 * @param {Object} dish - Dish data from database
 * @returns {Object} Formatted dish object
 */
const formatDish = (dish) => {
  if (!dish) return null;
  
  return {
    id: dish.id,
    name: dish.name || 'Unnamed Dish',
    description: dish.description || '',
    price: parseFloat(dish.price) || 0,
    category: dish.category || '',
    restaurant_id: dish.restaurant_id || null,
    created_by: dish.created_by || null,
    created_at: dish.created_at || null,
    updated_at: dish.updated_at || null
  };
};

/**
 * Find all dishes with optional filtering and pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Dishes and total count
 */
export const findAllDishes = async (options = {}) => {
  const {
    page = 1,
    limit = 20,
    sort = 'created_at',
    order = 'desc',
    search = null,
    restaurant_id = null
  } = options;

  try {
    const offset = (page - 1) * limit;
    let queryParams = [];
    let paramIndex = 1;
    
    // Base query
    let query = 'SELECT d.*, r.name as restaurant_name FROM dishes d LEFT JOIN restaurants r ON d.restaurant_id = r.id';
    
    // Add conditions
    const conditions = [];
    
    if (search) {
      conditions.push(`d.name ILIKE $${paramIndex}`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    if (restaurant_id) {
      conditions.push(`d.restaurant_id = $${paramIndex}`);
      queryParams.push(restaurant_id);
      paramIndex++;
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // Add sorting
    const validSortColumns = ['id', 'name', 'price', 'created_at', 'updated_at'];
    const sortColumn = validSortColumns.includes(sort) ? `d.${sort}` : 'd.created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY ${sortColumn} ${sortOrder}`;
    
    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);
    
    // Execute query
    const result = await db.query(query, queryParams);
    
    // Count total dishes
    let countQuery = 'SELECT COUNT(*) FROM dishes d';
    
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    const countResult = await db.query(countQuery, queryParams.slice(0, conditions.length));
    const total = parseInt(countResult.rows[0].count, 10);
    
    // Format dishes
    const dishes = result.rows.map(row => formatDish(row));
    
    return {
      dishes,
      total
    };
  } catch (error) {
    console.error('Error in findAllDishes:', error);
    throw new Error('Database error fetching dishes.');
  }
};

/**
 * Find a dish by ID
 * @param {number} id - Dish ID
 * @returns {Promise<Object>} Dish data
 */
export const findDishById = async (id) => {
  try {
    const query = `
      SELECT d.*, r.name as restaurant_name 
      FROM dishes d 
      LEFT JOIN restaurants r ON d.restaurant_id = r.id 
      WHERE d.id = $1
    `;
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new Error(`Dish with ID ${id} not found.`);
    }
    
    return formatDish(result.rows[0]);
  } catch (error) {
    console.error(`Error finding dish with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new dish
 * @param {Object} dishData - Dish data
 * @returns {Promise<Object>} Created dish
 */
export const createDish = async (dishData) => {
  try {
    const { name, description, price, category, restaurant_id, created_by } = dishData;
    
    // Check if restaurant exists
    if (restaurant_id) {
      const restaurantCheck = await db.query('SELECT id FROM restaurants WHERE id = $1', [restaurant_id]);
      if (restaurantCheck.rows.length === 0) {
        throw new Error(`Restaurant with ID ${restaurant_id} not found.`);
      }
    }
    
    const query = `
      INSERT INTO dishes (name, description, price, category, restaurant_id, created_by, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;
    
    const result = await db.query(query, [
      name,
      description || '',
      price || 0,
      category || '',
      restaurant_id || null,
      created_by || null
    ]);
    
    return formatDish(result.rows[0]);
  } catch (error) {
    console.error('Error creating dish:', error);
    throw error;
  }
};

/**
 * Update a dish
 * @param {number} id - Dish ID
 * @param {Object} updateData - Updated dish data
 * @returns {Promise<Object>} Updated dish
 */
export const updateDish = async (id, updateData) => {
  try {
    // Check if dish exists
    const checkQuery = 'SELECT * FROM dishes WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      throw new Error(`Dish with ID ${id} not found.`);
    }
    
    // Build update query
    const { name, description, price, category, restaurant_id } = updateData;
    
    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;
    
    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      queryParams.push(name);
    }
    
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      queryParams.push(description);
    }
    
    if (price !== undefined) {
      updateFields.push(`price = $${paramIndex++}`);
      queryParams.push(price);
    }
    
    if (category !== undefined) {
      updateFields.push(`category = $${paramIndex++}`);
      queryParams.push(category);
    }
    
    if (restaurant_id !== undefined) {
      // Check if restaurant exists
      const restaurantCheck = await db.query('SELECT id FROM restaurants WHERE id = $1', [restaurant_id]);
      if (restaurantCheck.rows.length === 0) {
        throw new Error(`Restaurant with ID ${restaurant_id} not found.`);
      }
      
      updateFields.push(`restaurant_id = $${paramIndex++}`);
      queryParams.push(restaurant_id);
    }
    
    // Add updated_at timestamp
    updateFields.push(`updated_at = NOW()`);
    
    // If no fields to update, return the existing dish
    if (updateFields.length === 1) {
      return formatDish(checkResult.rows[0]);
    }
    
    // Add dish ID to params
    queryParams.push(id);
    
    const query = `
      UPDATE dishes
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await db.query(query, queryParams);
    
    return formatDish(result.rows[0]);
  } catch (error) {
    console.error(`Error updating dish with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a dish
 * @param {number} id - Dish ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteDish = async (id) => {
  try {
    // Check if dish exists
    const checkQuery = 'SELECT * FROM dishes WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      throw new Error(`Dish with ID ${id} not found.`);
    }
    
    // Delete dish
    const query = 'DELETE FROM dishes WHERE id = $1';
    await db.query(query, [id]);
    
    return true;
  } catch (error) {
    console.error(`Error deleting dish with ID ${id}:`, error);
    throw error;
  }
};

// Export all functions
export default {
  findAllDishes,
  findDishById,
  createDish,
  updateDish,
  deleteDish
};
