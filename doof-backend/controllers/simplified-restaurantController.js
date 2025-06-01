import db from '../db/index.js';
import { getDishesByRestaurant } from '../models/dishModel.js';

/**
 * Get all restaurants (simplified for testing)
 */
export const getAllRestaurants = async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, address FROM restaurants LIMIT 10');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getting restaurants:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch restaurants' });
  }
};

/**
 * Get restaurant by ID (simplified for testing)
 */
export const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT id, name, address FROM restaurants WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error getting restaurant:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch restaurant' });
  }
};

/**
 * Create a new restaurant (simplified for testing)
 */
export const createRestaurant = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const { name, address } = req.body;
    
    if (!name || !address) {
      console.error('Missing required fields:', { name, address });
      return res.status(400).json({ 
        success: false, 
        error: 'Name and address are required',
        received: { name, address }
      });
    }
    
    const query = 'INSERT INTO restaurants (name, address) VALUES ($1, $2) RETURNING id, name, address';
    console.log('Executing query:', query, 'with params:', [name, address]);
    
    const result = await db.query(query, [name, address]);
    
    if (!result.rows || result.rows.length === 0) {
      console.error('No data returned from insert');
      return res.status(500).json({ 
        success: false, 
        error: 'No data returned after insert' 
      });
    }
    
    console.log('Successfully created restaurant:', result.rows[0]);
    res.status(201).json({ 
      success: true, 
      data: result.rows[0] 
    });
    
  } catch (error) {
    console.error('Error creating restaurant:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      detail: error.detail,
      table: error.table,
      constraint: error.constraint,
      query: error.query,
      parameters: error.parameters
    });
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create restaurant',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update a restaurant (simplified for testing)
 */
export const updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address } = req.body;
    
    const result = await db.query(
      'UPDATE restaurants SET name = $1, address = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, address',
      [name, address, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({ success: false, error: 'Failed to update restaurant' });
  }
};

/**
 * Delete a restaurant (simplified for testing)
 */
export const deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM restaurants WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }
    
    res.json({ success: true, message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    res.status(500).json({ success: false, error: 'Failed to delete restaurant' });
  }
};

/**
 * Get dishes by restaurant ID (simplified for testing)
 */
export const getRestaurantDishes = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First verify the restaurant exists
    const restaurantResult = await db.query('SELECT id FROM restaurants WHERE id = $1', [id]);
    if (restaurantResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }
    
    // Get dishes for the restaurant using the model function
    const dishes = await getDishesByRestaurant(id);
    
    res.json({ 
      success: true, 
      data: dishes,
      pagination: {
        totalItems: dishes.length,
        currentPage: 1,
        itemsPerPage: dishes.length,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Error getting restaurant dishes:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch restaurant dishes' });
  }
};
