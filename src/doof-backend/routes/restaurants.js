// src/doof-backend/routes/restaurants.js
const express = require('express');
const db = require('../db');

const router = express.Router();

// === Restaurant Detail ===
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const restaurantResult = await db.query("SELECT * FROM Restaurants WHERE id = $1", [id]);
    if (restaurantResult.rows.length === 0) {
      return res.status(404).json({ error: "Restaurant not found" });
    }
    const restaurant = restaurantResult.rows[0];
    const dishesResult = await db.query(
       `SELECT
            d.id, d.name, d.description, d.adds, d.created_at,
            COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}') as tags
        FROM Dishes d
        LEFT JOIN DishHashtags dh ON d.id = dh.dish_id
        LEFT JOIN Hashtags h ON dh.hashtag_id = h.id
        WHERE d.restaurant_id = $1
        GROUP BY d.id
        ORDER BY d.adds DESC, d.name ASC`,
        [id]
    );
    res.json({ ...restaurant, dishes: dishesResult.rows || [] });
  } catch (err) {
    console.error(`/api/restaurants/${id} error:`, err);
    res.status(500).json({ error: "Error loading restaurant details" });
  }
});

// Add other restaurant-specific routes here if needed (e.g., POST to create)

module.exports = router;