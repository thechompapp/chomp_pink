// src/doof-backend/routes/restaurants.js
import express from 'express';
import { param, validationResult } from 'express-validator';
// Corrected imports:
import db from '../db/index.js';

const router = express.Router();

// Validation middleware
const validateIdParam = [
  param('id').isInt({ min: 1 }).withMessage('Restaurant ID must be a positive integer'),
];
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Provide specific validation error message
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

router.get('/:id', validateIdParam, handleValidationErrors, async (req, res, next) => {
  const { id } = req.params;
  const currentDb = req.app?.get('db') || db; // Access db instance

  try {
    // Fetch restaurant details including tags
    const restaurantQuery = `
      SELECT r.id, r.name, r.city_id, r.neighborhood_id, r.city_name, r.neighborhood_name, r.adds,
             r.google_place_id, -- Include Google Place ID
             -- Aggregate tags safely, default to empty array if none
             COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}'::text[]) as tags
      FROM Restaurants r
      LEFT JOIN RestaurantHashtags rh ON r.id = rh.restaurant_id
      LEFT JOIN Hashtags h ON rh.hashtag_id = h.id
      WHERE r.id = $1
      GROUP BY r.id; -- Group by restaurant ID to aggregate tags
    `;
    const restaurantResult = await currentDb.query(restaurantQuery, [id]);

    if (restaurantResult.rows.length === 0) {
      // Restaurant not found
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Fetch associated dishes including their tags
    const dishQuery = `
      SELECT d.id, d.name, d.adds, d.created_at,
             -- Aggregate dish tags safely, default to empty array
             COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}'::text[]) as tags
      FROM Dishes d
      LEFT JOIN DishHashtags dh ON d.id = dh.dish_id
      LEFT JOIN Hashtags h ON dh.hashtag_id = h.id
      WHERE d.restaurant_id = $1
      GROUP BY d.id -- Group by dish ID to aggregate tags
      ORDER BY d.adds DESC NULLS LAST, d.name ASC; -- Order dishes (e.g., by adds, then name)
    `;
    const dishResult = await currentDb.query(dishQuery, [id]);

    // Combine restaurant details with its dishes
    const restaurant = {
      ...restaurantResult.rows[0],
      // Ensure 'tags' on the main restaurant object is an array
      tags: Array.isArray(restaurantResult.rows[0].tags) ? restaurantResult.rows[0].tags : [],
      // Ensure 'dishes' is always an array, and map tags within each dish
      dishes: (dishResult.rows || []).map(dish => ({
          ...dish,
          tags: Array.isArray(dish.tags) ? dish.tags : [] // Ensure dish tags are arrays
      })),
    };

    res.json(restaurant);
  } catch (err) {
    console.error(`[Restaurants GET /:id] Error fetching restaurant ${id}:`, err);
    next(err); // Pass error to the centralized error handler
  }
});

// Corrected export
export default router;