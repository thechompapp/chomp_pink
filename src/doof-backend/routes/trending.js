// src/doof-backend/routes/trending.js (FINAL FINAL FINAL v2 - Checkpoint: 2025-04-01 PM)
const express = require('express');
const db = require('../db');

const router = express.Router();

// === Trending Data ===
router.get("/dishes", async (req, res) => {
  console.log(">>> [TRENDING DISHES v2] Handler entered.");
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
       WHERE r.id IS NOT NULL GROUP BY d.id, r.id ORDER BY d.adds DESC, d.created_at DESC LIMIT 15`;
    const result = await db.query(query);
    console.log(">>> [TRENDING DISHES v2] Query successful.");
    res.json(result.rows || []);
  } catch (err) {
    console.error(">>> [TRENDING DISHES v2] Error:", err);
    res.status(500).json({ error: "Error fetching trending dishes" });
  }
});

router.get("/restaurants", async (req, res) => {
   console.log(">>> [TRENDING RESTAURANTS v2] Handler entered.");
  try {
     // *** Explicitly defining query string again ***
     const query = `
       SELECT
             r.id, r.name, r.address, r.neighborhood_name as neighborhood, r.city_name as city,
             r.zip_code, r.borough, r.phone, r.website, r.google_place_id, r.latitude, r.longitude,
             r.adds, r.created_at, r.updated_at, COUNT(DISTINCT d.id) AS dish_count,
             COALESCE(array_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '{}') as tags
        FROM Restaurants r
        LEFT JOIN Dishes d ON d.restaurant_id = r.id
        LEFT JOIN RestaurantHashtags rh ON r.id = rh.restaurant_id
        LEFT JOIN Hashtags h ON rh.hashtag_id = h.id
        GROUP BY r.id ORDER BY r.adds DESC, r.created_at DESC LIMIT 15`;

     console.log(">>> [TRENDING RESTAURANTS v2] Type of query variable:", typeof query); // Check type
     console.log(">>> [TRENDING RESTAURANTS v2] Query variable defined:", query !== undefined && query !== null); // Check defined

     if (!query || typeof query !== 'string') { // Extra safety check
         console.error(">>> [TRENDING RESTAURANTS v2] FATAL: query variable is invalid!");
         throw new Error("Internal Server Error: Query definition invalid for trending restaurants.");
     }

     const result = await db.query(query); // Execute the query

     console.log(">>> [TRENDING RESTAURANTS v2] Query successful.");
     res.json(result.rows || []);
   } catch (err) {
     console.error(">>> [TRENDING RESTAURANTS v2] Error:", err); // Log the FULL error
     res.status(500).json({ error: "Error fetching trending restaurants" });
   }
 });

router.get("/lists", async (req, res) => {
   console.log(">>> [TRENDING LISTS v2] Handler entered.");
  try {
    // Corrected query selecting city_name & calculated item_count
    const query = `
      SELECT l.id, l.name, l.saved_count, l.city_name, l.tags, l.is_public, l.created_by_user, l.creator_handle, l.is_following, l.created_at,
             COALESCE(lc.count, 0)::integer as item_count
       FROM Lists l
       LEFT JOIN (SELECT list_id, COUNT(*) as count FROM ListItems GROUP BY list_id) lc ON l.id = lc.list_id
       WHERE l.is_public = TRUE ORDER BY l.saved_count DESC, l.created_at DESC LIMIT 15`;
    const result = await db.query(query);
    console.log(">>> [TRENDING LISTS v2] Query successful.");
    const lists = (result.rows || []).map(list => ({ ...list, city: list.city_name, is_following: list.is_following ?? false }));
    res.json(lists);
  } catch (err) {
    console.error(">>> [TRENDING LISTS v2] Error:", err); // Log the FULL error
    res.status(500).json({ error: "Error fetching popular lists" });
  }
});

module.exports = router;