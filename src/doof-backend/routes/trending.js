// src/doof-backend/routes/trending.js
const express = require('express');
const db = require('../db');

const router = express.Router();

// === Trending Data ===
router.get("/dishes", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         d.id, d.name, d.description, d.adds, d.created_at,
         r.id as restaurant_id, r.name as restaurant_name, r.neighborhood, r.city,
         COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}') as tags
       FROM Dishes d
       LEFT JOIN Restaurants r ON d.restaurant_id = r.id
       LEFT JOIN DishHashtags dh ON d.id = dh.dish_id
       LEFT JOIN Hashtags h ON dh.hashtag_id = h.id
       GROUP BY d.id, r.id
       ORDER BY d.adds DESC, d.created_at DESC
       LIMIT 15`
    );
    res.json(result.rows || []);
  } catch (err) {
    console.error("/api/trending/dishes error:", err);
    res.status(500).json({ error: "Error fetching trending dishes" });
  }
});

router.get("/restaurants", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.*, COUNT(d.id) AS dish_count
       FROM Restaurants r
       LEFT JOIN Dishes d ON d.restaurant_id = r.id
       GROUP BY r.id
       ORDER BY r.adds DESC, r.created_at DESC
       LIMIT 15`
    );
    res.json(result.rows || []);
  } catch (err) {
    console.error("/api/trending/restaurants error:", err);
    res.status(500).json({ error: "Error fetching trending restaurants" });
  }
});

router.get("/lists", async (req, res) => { // Renamed from /popular/lists for consistency
  try {
    const result = await db.query(
      `SELECT id, name, item_count, saved_count, city, tags, is_public, created_by_user, creator_handle, is_following, created_at
       FROM Lists
       WHERE is_public = TRUE
       ORDER BY saved_count DESC, created_at DESC
       LIMIT 15`
    );
    const lists = (result.rows || []).map(list => ({
        ...list,
        is_following: list.is_following ?? false
    }));
    res.json(lists);
  } catch (err) {
    console.error("/api/trending/lists error:", err); // Updated log message
    res.status(500).json({ error: "Error fetching popular lists" });
  }
});


module.exports = router;