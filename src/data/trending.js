// src/doof-backend/routes/trending.js (DEBUGGING /dishes query)
const express = require('express');
const db = require('../db');

const router = express.Router();

// === Trending Data ===
router.get("/dishes", async (req, res) => {
  try {
    // *** DEBUGGING: Highly simplified query - Select only ID from Dishes ***
    console.log("Executing DEBUG query for /trending/dishes");
    const result = await db.query(
      `SELECT id FROM Dishes ORDER BY adds DESC, created_at DESC LIMIT 15`
    );
    // We need to return data that matches what the frontend expects, even if simplified
    // Map the IDs to a minimal structure expected by the frontend card
    const simplifiedDishes = result.rows.map(row => ({
        id: row.id,
        name: `Dish ID ${row.id} (Debug)`, // Placeholder name
        restaurant: 'Debug Rest.', // Placeholder restaurant
        restaurant_id: null,
        neighborhood: 'Debug Hood',
        city: 'Debug City',
        tags: ['debug'] // Placeholder tags
    }));
    console.log("DEBUG query for /trending/dishes successful.");
    res.json(simplifiedDishes);
  } catch (err) {
    console.error("/api/trending/dishes error (DEBUG query):", err); // Log the specific error
    res.status(500).json({ error: "Error fetching trending dishes (Debug)" });
  }
});

// --- /restaurants and /lists routes remain the same as the last correct version ---
router.get("/restaurants", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
            r.id, r.name, r.address, r.neighborhood_name as neighborhood, r.city_name as city,
            r.zip_code, r.borough, r.phone, r.website, r.google_place_id, r.latitude, r.longitude,
            r.adds, r.created_at, r.updated_at, COUNT(DISTINCT d.id) AS dish_count,
            COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}') as tags
       FROM Restaurants r
       LEFT JOIN Dishes d ON d.restaurant_id = r.id
       LEFT JOIN RestaurantHashtags rh ON r.id = rh.restaurant_id
       LEFT JOIN Hashtags h ON rh.hashtag_id = h.id
       GROUP BY r.id ORDER BY r.adds DESC, r.created_at DESC LIMIT 15`
    );
    res.json(result.rows || []);
  } catch (err) {
    console.error("/api/trending/restaurants error:", err);
    res.status(500).json({ error: "Error fetching trending restaurants" });
  }
});

router.get("/lists", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, item_count, saved_count, city_name, tags, is_public, created_by_user, creator_handle, is_following, created_at
       FROM Lists WHERE is_public = TRUE ORDER BY saved_count DESC, created_at DESC LIMIT 15`
    );
    const lists = (result.rows || []).map(list => ({ ...list, city: list.city_name, is_following: list.is_following ?? false }));
    res.json(lists);
  } catch (err) {
    console.error("/api/trending/lists error:", err);
    res.status(500).json({ error: "Error fetching popular lists" });
  }
});

module.exports = router;