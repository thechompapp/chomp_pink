// src/doof-backend/routes/trending.js
const express = require('express');
const db = require('../db'); // Ensure db is imported if not using req.app.get('db') consistently
const router = express.Router();

router.get('/restaurants', async (req, res, next) => { // Added next
  // Removed console log
  try {
    const query = `
      SELECT r.id, r.name, r.city_name, r.neighborhood_name, r.adds, r.city_id, r.neighborhood_id,
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
    // Removed console log
    const result = await (req.app.get('db') || db).query(query); // Use db fallback if req.app.get('db') isn't set
    // Removed console log
    res.json(result.rows);
  } catch (err) {
    console.error('[TRENDING GET /restaurants] Error:', err);
    next(err); // Pass error to central handler
  }
});

router.get('/dishes', async (req, res, next) => { // Added next
  // Removed console log
  try {
    const query = `
      SELECT d.id, d.name, d.adds, r.name as restaurant, r.city_name, r.city_id, r.neighborhood_id,
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
    // Removed console log
    const result = await (req.app.get('db') || db).query(query); // Use db fallback
    // Removed console log
    res.json(result.rows);
  } catch (err) {
    console.error('[TRENDING GET /dishes] Error:', err);
    next(err); // Pass error to central handler
  }
});

router.get('/lists', async (req, res, next) => { // Added next
  // Removed console log
  try {
    const query = `
      SELECT l.id, l.name, l.description, l.saved_count, l.city_name, l.tags, l.is_public,
             l.creator_handle, l.created_at, l.updated_at, l.user_id,
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
    // Removed console log
    const result = await (req.app.get('db') || db).query(query); // Use db fallback
    // Removed console log
    res.json(result.rows);
  } catch (err) {
    console.error('[TRENDING GET /lists] Error:', err);
    next(err); // Pass error to central handler
  }
});

module.exports = router;