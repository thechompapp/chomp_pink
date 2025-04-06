// src/doof-backend/routes/search.js
import express from 'express';
// Corrected import:
import db from '../db/index.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  const { q } = req.query;
  // Use db instance from app context if available, otherwise use direct import
  const currentDb = req.app?.get('db') || db;
  if (!q) {
    // Return empty results for an empty query
    return res.json({ restaurants: [], dishes: [], lists: [] });
  }
  try {
    // Restaurant Query
    const restaurantsQuery = `
      SELECT r.id, r.name, r.city_name, r.neighborhood_name, r.adds, r.city_id, r.neighborhood_id,
             COALESCE((
               SELECT ARRAY_AGG(h.name)
               FROM RestaurantHashtags rh
               JOIN Hashtags h ON rh.hashtag_id = h.id
               WHERE rh.restaurant_id = r.id
             ), ARRAY[]::TEXT[]) as tags
      FROM Restaurants r
      WHERE r.name ILIKE $1
      ORDER BY r.adds DESC
      LIMIT 10
    `;
    // Dish Query
    const dishesQuery = `
      SELECT d.id, d.name, d.adds, r.name as restaurant_name, -- Alias r.name to restaurant_name
             r.city_name, r.city_id, r.neighborhood_id, r.neighborhood_name, -- Include neighborhood_name
             COALESCE((
               SELECT ARRAY_AGG(h.name)
               FROM DishHashtags dh
               JOIN Hashtags h ON dh.hashtag_id = h.id
               WHERE dh.dish_id = d.id
             ), ARRAY[]::TEXT[]) as tags
      FROM Dishes d
      JOIN Restaurants r ON d.restaurant_id = r.id
      WHERE d.name ILIKE $1
      ORDER BY d.adds DESC
      LIMIT 10
    `;
    // List Query
    const listsQuery = `
        SELECT l.id, l.name, l.description, l.saved_count, l.city_name, l.tags, l.is_public,
               l.creator_handle, l.user_id,
               COALESCE((SELECT COUNT(*) FROM ListItems li WHERE li.list_id = l.id), 0)::INTEGER as item_count
        FROM Lists l
        WHERE l.name ILIKE $1 AND l.is_public = TRUE -- Only search public lists by name
        ORDER BY l.saved_count DESC
        LIMIT 10
    `;

    // Execute queries concurrently
    const [restaurantsResult, dishesResult, listsResult] = await Promise.all([
      currentDb.query(restaurantsQuery, [`%${q}%`]),
      currentDb.query(dishesQuery, [`%${q}%`]),
      currentDb.query(listsQuery, [`%${q}%`]),
    ]);

    // Return combined results
    res.json({
      restaurants: restaurantsResult.rows || [],
      // Map dish results to ensure consistency with other parts of the app if needed
      dishes: (dishesResult.rows || []).map(dish => ({
          ...dish,
          restaurant: dish.restaurant_name // Ensure frontend consistently uses 'restaurant' key
      })),
      lists: listsResult.rows || [],
    });
  } catch (error) {
    console.error('[Search] Error:', error);
    next(error); // Pass error to central handler
  }
});

// Corrected export statement
export default router;