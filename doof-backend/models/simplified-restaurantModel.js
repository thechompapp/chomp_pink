/**
 * Simplified Restaurant Model
 * 
 * This is a simplified version of the restaurant model that works with
 * our database schema for E2E testing.
 */

import db from '../db/index.js';

/**
 * Format a restaurant object for API response
 * @param {Object} restaurant - Restaurant data from database
 * @returns {Object} Formatted restaurant object
 */
const formatRestaurant = (restaurant) => {
  if (!restaurant) return null;
  
  return {
    id: restaurant.id,
    name: restaurant.name || 'Unnamed Restaurant',
    description: restaurant.description || '',
    address: restaurant.address || '',
    cuisine: restaurant.cuisine || '',
    price_range: restaurant.price_range || '',
    created_by: restaurant.created_by || null,
    created_at: restaurant.created_at || null,
    updated_at: restaurant.updated_at || null
  };
};

/**
 * Find all restaurants with optional filtering and pagination
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Restaurants and total count
 */
export const findAllRestaurants = async (options = {}) => {
  const {
    page = 1,
    limit = 20,
    sort = 'created_at',
    order = 'desc',
    search = null
  } = options;

  try {
    const offset = (page - 1) * limit;
    let queryParams = [];
    let paramIndex = 1;
    
    // Base query
    let query = 'SELECT * FROM restaurants';
    
    // Add search condition if provided
    if (search) {
      query += ` WHERE name ILIKE $${paramIndex}`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    // Add sorting
    const validSortColumns = ['id', 'name', 'created_at', 'updated_at'];
    const sortColumn = validSortColumns.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    query += ` ORDER BY ${sortColumn} ${sortOrder}`;
    
    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);
    
    // Execute query
    const result = await db.query(query, queryParams);
    
    // Count total restaurants
    let countQuery = 'SELECT COUNT(*) FROM restaurants';
    if (search) {
      countQuery += ` WHERE name ILIKE $1`;
    }
    
    const countParams = search ? [`%${search}%`] : [];
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count, 10);
    
    // Format restaurants
    const restaurants = result.rows.map(row => formatRestaurant(row));
    
    return {
      restaurants,
      total
    };
  } catch (error) {
    console.error('Error in findAllRestaurants:', error);
    throw new Error('Database error fetching restaurants.');
  }
};

/**
 * Find a restaurant by ID
 * @param {number} id - Restaurant ID
 * @returns {Promise<Object>} Restaurant data
 */
export const findRestaurantById = async (id) => {
  try {
    const query = 'SELECT * FROM restaurants WHERE id = $1';
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new Error(`Restaurant with ID ${id} not found.`);
    }
    
    return formatRestaurant(result.rows[0]);
  } catch (error) {
    console.error(`Error finding restaurant with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new restaurant
 * @param {Object} restaurantData - Restaurant data
 * @returns {Promise<Object>} Created restaurant
 */
export const createRestaurant = async (restaurantData) => {
  try {
    const { name, description, address, cuisine, price_range, created_by } = restaurantData;
    
    const query = `
      INSERT INTO restaurants (name, description, address, cuisine, price_range, created_by, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;
    
    const result = await db.query(query, [
      name,
      description || '',
      address || '',
      cuisine || '',
      price_range || '',
      created_by || null
    ]);
    
    return formatRestaurant(result.rows[0]);
  } catch (error) {
    console.error('Error creating restaurant:', error);
    throw error;
  }
};

/**
 * Update a restaurant
 * @param {number} id - Restaurant ID
 * @param {Object} updateData - Updated restaurant data
 * @returns {Promise<Object>} Updated restaurant
 */
export const updateRestaurant = async (id, updateData) => {
  try {
    // Check if restaurant exists
    const checkQuery = 'SELECT * FROM restaurants WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      throw new Error(`Restaurant with ID ${id} not found.`);
    }
    
    // Build update query
    const { name, description, address, cuisine, price_range } = updateData;
    
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
    
    if (address !== undefined) {
      updateFields.push(`address = $${paramIndex++}`);
      queryParams.push(address);
    }
    
    if (cuisine !== undefined) {
      updateFields.push(`cuisine = $${paramIndex++}`);
      queryParams.push(cuisine);
    }
    
    if (price_range !== undefined) {
      updateFields.push(`price_range = $${paramIndex++}`);
      queryParams.push(price_range);
    }
    
    // Add updated_at timestamp
    updateFields.push(`updated_at = NOW()`);
    
    // If no fields to update, return the existing restaurant
    if (updateFields.length === 1) {
      return formatRestaurant(checkResult.rows[0]);
    }
    
    // Add restaurant ID to params
    queryParams.push(id);
    
    const query = `
      UPDATE restaurants
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await db.query(query, queryParams);
    
    return formatRestaurant(result.rows[0]);
  } catch (error) {
    console.error(`Error updating restaurant with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a restaurant
 * @param {number} id - Restaurant ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteRestaurant = async (id) => {
  try {
    // Check if restaurant exists
    const checkQuery = 'SELECT * FROM restaurants WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      throw new Error(`Restaurant with ID ${id} not found.`);
    }
    
    // Delete restaurant
    const query = 'DELETE FROM restaurants WHERE id = $1';
    await db.query(query, [id]);
    
    return true;
  } catch (error) {
    console.error(`Error deleting restaurant with ID ${id}:`, error);
    throw error;
  }
};

// Export all functions
export default {
  findAllRestaurants,
  findRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant
};
