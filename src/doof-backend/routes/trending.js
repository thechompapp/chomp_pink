const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/trending/restaurants
router.get('/restaurants', async (req, res) => {
  console.log('[TRENDING GET /restaurants] Handler entered.');
  try {
    const query = `
      SELECT r.id, r.name, r.city_name, r.neighborhood_name, r.adds,
             COALESCE((
               SELECT ARRAY_AGG(h.name)
               FROM RestaurantHashtags rh
               JOIN Hashtags h ON rh.hashtag_id = h.id
               WHERE rh.restaurant_id = r.id
             ), ARRAY[]::TEXT[]) as tags
      FROM Restaurants r
      ORDER BY r.adds DESC
      LIMIT 10
    `;
    console.log('[TRENDING GET /restaurants] Executing query:', query);
    const result = await db.query(query);
    console.log(`[TRENDING GET /restaurants] Found ${result.rows.length} restaurants:`, result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('[TRENDING GET /restaurants] Error:', err);
    res.status(500).json({ error: 'Workspace failed for restaurants', details: err.message || 'Unknown database error' });
  }
});

// GET /api/trending/dishes
router.get('/dishes', async (req, res) => {
  console.log('[TRENDING GET /dishes] Handler entered.');
  try {
    const query = `
      SELECT d.id, d.name, d.adds, r.name as restaurant, r.city_name,
             COALESCE((
               SELECT ARRAY_AGG(h.name)
               FROM DishHashtags dh
               JOIN Hashtags h ON dh.hashtag_id = h.id
               WHERE dh.dish_id = d.id
             ), ARRAY[]::TEXT[]) as tags
      FROM Dishes d
      JOIN Restaurants r ON d.restaurant_id = r.id
      ORDER BY d.adds DESC
      LIMIT 10
    `;
    console.log('[TRENDING GET /dishes] Executing query:', query);
    const result = await db.query(query);
    console.log(`[TRENDING GET /dishes] Found ${result.rows.length} dishes:`, result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('[TRENDING GET /dishes] Error:', err);
    res.status(500).json({ error: 'Workspace failed for dishes', details: err.message || 'Unknown database error' });
  }
});

// GET /api/trending/lists
router.get('/lists', async (req, res) => {
  console.log('[TRENDING GET /lists] Handler entered.');
  try {
    const query = `
      SELECT l.id, l.name, l.description, l.saved_count, l.city_name, l.tags, l.is_public,
             l.creator_handle, l.created_at, l.updated_at,
             COALESCE((
               SELECT COUNT(*)
               FROM ListItems li
               WHERE li.list_id = l.id
             ), 0)::INTEGER as item_count
      FROM Lists l
      WHERE l.is_public = TRUE
      ORDER BY l.saved_count DESC
      LIMIT 10
    `;
    console.log('[TRENDING GET /lists] Executing query:', query);
    const result = await db.query(query);
    console.log(`[TRENDING GET /lists] Found ${result.rows.length} lists:`, result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('[TRENDING GET /lists] Error:', err);
    res.status(500).json({ error: 'Workspace failed for lists', details: err.message || 'Unknown database error' });
  }
});

module.exports = router;