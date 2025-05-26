import db from '../db/index.js';

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
    const { name, address } = req.body;
    const result = await db.query(
      'INSERT INTO restaurants (name, address) VALUES ($1, $2) RETURNING id, name, address',
      [name, address]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({ success: false, error: 'Failed to create restaurant' });
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
