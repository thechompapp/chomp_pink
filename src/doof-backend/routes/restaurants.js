// src/doof-backend/routes/restaurants.js
const express = require('express');
const db = require('../db');
const { param, validationResult } = require('express-validator');

const router = express.Router();

router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { id } = req.params;
  try {
    const restaurantQuery = `
      SELECT r.id, r.name, r.city_id, r.neighborhood_id, r.city_name, r.neighborhood_name, r.adds,
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

    const dishQuery = `
      SELECT d.id, d.name, d.description, d.adds, d.price, d.created_at,
             COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}') as tags
      FROM Dishes d
      LEFT JOIN DishHashtags dh ON d.id = dh.dish_id
      LEFT JOIN Hashtags h ON dh.hashtag_id = h.id
      WHERE d.restaurant_id = $1
      GROUP BY d.id;
    `;
    const dishResult = await db.query(dishQuery, [id]);

    const restaurant = {
      ...restaurantResult.rows[0],
      dishes: dishResult.rows,
    };

    res.json(restaurant);
  } catch (err) {
    console.error('Error fetching restaurant:', err);
    res.status(500).json({ error: 'Error fetching restaurant' });
  }
});

module.exports = router;