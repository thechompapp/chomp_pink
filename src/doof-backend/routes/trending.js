// src/doof-backend/routes/trending.js
const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/trending/dishes (Keep Original Complex Query)
router.get("/dishes", async (req, res) => {
  console.log(">>> [TRENDING DISHES - Original Query] Handler entered.");
  try {
    const query = `
      SELECT
         d.id, d.name, d.description, d.adds, d.price, d.created_at,
         r.id as restaurant_id, r.name as restaurant_name,
         r.neighborhood_name as neighborhood, r.city_name as city,
         COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}') as tags
       FROM Dishes d
       LEFT JOIN Restaurants r ON d.restaurant_id = r.id
       LEFT JOIN DishHashtags dh ON d.id = dh.dish_id
       LEFT JOIN Hashtags h ON dh.hashtag_id = h.id
       WHERE r.id IS NOT NULL
       GROUP BY d.id, r.id
       ORDER BY d.adds DESC, d.created_at DESC
       LIMIT 15;
    `;
    const result = await db.query(query);
    console.log(`>>> [TRENDING DISHES - Original Query] Found ${result.rows.length} dishes.`);
    res.json(result.rows || []);
  } catch (err) {
    console.error(">>> [TRENDING DISHES - Original Query] Error:", err);
    res.status(500).json({ error: "Error fetching trending dishes (Original Query)" });
  }
});

// GET /api/trending/restaurants (Updated to include city_id, neighborhood_id, and tags)
router.get("/restaurants", async (req, res) => {
  console.log(">>> [TRENDING RESTAURANTS - Updated Query] Handler entered.");
  try {
    const query = `
      SELECT
        r.id, r.name, r.adds,
        r.city_id, r.neighborhood_id,
        r.city_name, r.neighborhood_name,
        COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}') as tags
      FROM Restaurants r
      LEFT JOIN RestaurantHashtags rh ON r.id = rh.restaurant_id
      LEFT JOIN Hashtags h ON rh.hashtag_id = h.id
      GROUP BY r.id
      ORDER BY r.adds DESC NULLS LAST
      LIMIT 3;
    `;
    const result = await db.query(query);
    console.log(`>>> [TRENDING RESTAURANTS - Updated Query] Found ${result.rowCount} rows.`);
    res.json(result.rows || []);
  } catch (err) {
    console.error(">>> [TRENDING RESTAURANTS - Updated Query] Error:", err);
    res.status(500).json({ error: "Error fetching trending restaurants (Updated Query)" });
  }
});

// GET /api/trending/lists (Keep Original Complex Query)
router.get("/lists", async (req, res) => {
  console.log(">>> [TRENDING LISTS - Original Query] Handler entered.");
  try {
    const query = `
      SELECT
          l.id, l.name, l.description, l.saved_count, l.city_name, l.tags, l.is_public,
          l.created_by_user, l.creator_handle, l.is_following, l.created_at, l.updated_at,
          COALESCE(lc.count, 0)::integer as item_count
       FROM Lists l
       LEFT JOIN ( SELECT list_id, COUNT(*) as count FROM ListItems GROUP BY list_id ) lc ON l.id = lc.list_id
       WHERE l.is_public = TRUE
       ORDER BY l.saved_count DESC, l.created_at DESC
       LIMIT 15;
    `;
    const result = await db.query(query);
    console.log(`>>> [TRENDING LISTS - Original Query] Found ${result.rows.length} lists.`);
    const lists = (result.rows || []).map(list => ({ ...list, city: list.city_name, is_following: list.is_following ?? false }));
    res.json(lists);
  } catch (err) {
    console.error(">>> [TRENDING LISTS - Original Query] Error:", err);
    res.status(500).json({ error: "Error fetching popular lists (Original Query)" });
  }
});

module.exports = router;