import db from '../db/index.js';

/**
 * Get all dishes (simplified for testing)
 */
export const getAllDishes = async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, description, price FROM dishes LIMIT 10');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getting dishes:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dishes' });
  }
};

/**
 * Get dish by ID (simplified for testing)
 */
export const getDishById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT id, name, description, price FROM dishes WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Dish not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error getting dish:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dish' });
  }
};

/**
 * Create a new dish (simplified for testing)
 */
export const createDish = async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const result = await db.query(
      'INSERT INTO dishes (name, description, price) VALUES ($1, $2, $3) RETURNING id, name, description, price',
      [name, description, price]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error creating dish:', error);
    res.status(500).json({ success: false, error: 'Failed to create dish' });
  }
};

/**
 * Update a dish (simplified for testing)
 */
export const updateDish = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price } = req.body;
    
    const result = await db.query(
      'UPDATE dishes SET name = $1, description = $2, price = $3, updated_at = NOW() WHERE id = $4 RETURNING id, name, description, price',
      [name, description, price, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Dish not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating dish:', error);
    res.status(500).json({ success: false, error: 'Failed to update dish' });
  }
};

/**
 * Delete a dish (simplified for testing)
 */
export const deleteDish = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM dishes WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Dish not found' });
    }
    
    res.json({ success: true, message: 'Dish deleted successfully' });
  } catch (error) {
    console.error('Error deleting dish:', error);
    res.status(500).json({ success: false, error: 'Failed to delete dish' });
  }
};
