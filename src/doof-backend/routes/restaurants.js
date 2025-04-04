// src/doof-backend/routes/restaurants.js
const express = require('express');
const db = require('../db');
const { param, validationResult } = require('express-validator');

const router = express.Router();

router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
], async (req, res, next) => { // Added next for error handling
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { id } = req.params;
  try {
    // Fetch restaurant details (query remains the same)
    const restaurantQuery = `
      SELECT r.id, r.name, r.city_id, r.neighborhood_id, r.city_name, r.neighborhood_name, r.adds,
             r.google_place_id, -- Include place_id if needed by frontend
             -- Fetch address, phone, website if they exist in your schema (assuming they don't for now based on setup.sql)
             -- r.address, r.phone, r.website,
             COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}') as tags
      FROM Restaurants r
      LEFT JOIN RestaurantHashtags rh ON r.id = rh.restaurant_id
      LEFT JOIN Hashtags h ON rh.hashtag_id = h.id
      WHERE r.id = $1
      GROUP BY r.id;
    `;
    const restaurantResult = await db.query(restaurantQuery, [id]);

    if (restaurantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Fetch associated dishes (Corrected Query: removed d.description, d.price)
    const dishQuery = `
      SELECT d.id, d.name, d.adds, d.created_at,
             -- Removed d.description, d.price as they don't exist in Dishes table
             COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}') as tags
      FROM Dishes d
      LEFT JOIN DishHashtags dh ON d.id = dh.dish_id
      LEFT JOIN Hashtags h ON dh.hashtag_id = h.id
      WHERE d.restaurant_id = $1
      GROUP BY d.id -- Group by dish id
      ORDER BY d.adds DESC NULLS LAST, d.name ASC; -- Example ordering
    `;
    const dishResult = await db.query(dishQuery, [id]);

    const restaurant = {
      ...restaurantResult.rows[0],
      // Ensure dishes is always an array
      dishes: Array.isArray(dishResult.rows) ? dishResult.rows : [],
    };

    res.json(restaurant);
  } catch (err) {
    console.error(`Error fetching restaurant ${id}:`, err);
    // Pass error to the centralized error handler in server.js
    next(err);
  }
});

module.exports = router;