// src/doof-backend/routes/trending.js
const express = require('express');
const db = require('../db'); // Ensure db/index.js is correctly set up

const router = express.Router();

// GET /api/trending/dishes
// Fetches top 15 dishes ordered by adds, including restaurant info and tags
router.get("/dishes", async (req, res) => {
  console.log(">>> [TRENDING DISHES] Handler entered.");
  try {
    const query = `
      SELECT
         d.id, d.name, d.description, d.adds, d.price, d.created_at, d.is_common,
         r.id as restaurant_id, r.name as restaurant_name,
         r.neighborhood_name as neighborhood, r.city_name as city,
         -- Pre-aggregate tags for performance
         COALESCE(dt.tags, '{}') as tags
       FROM Dishes d
       JOIN Restaurants r ON d.restaurant_id = r.id
       LEFT JOIN (
           SELECT dh.dish_id, array_agg(h.name ORDER BY h.name) as tags -- Order tags alphabetically
           FROM DishHashtags dh JOIN Hashtags h ON dh.hashtag_id = h.id
           GROUP BY dh.dish_id
       ) dt ON d.id = dt.dish_id
       ORDER BY d.adds DESC NULLS LAST, d.created_at DESC -- Order by adds, then creation date
       LIMIT 15;
       `;
    const result = await db.query(query);
    console.log(`>>> [TRENDING DISHES] Found ${result.rows.length} dishes.`);
    // Ensure tags is always an array
    const dishes = (result.rows || []).map(d => ({
        ...d,
        tags: Array.isArray(d.tags) ? d.tags : []
    }));
    res.json(dishes);
  } catch (err) {
    console.error(">>> [TRENDING DISHES] Error:", err);
    res.status(500).json({ error: "Error fetching trending dishes", details: err.message });
  }
});

// GET /api/trending/restaurants
// Fetches top 15 restaurants ordered by adds, including location, tags, and dish count
router.get("/restaurants", async (req, res) => {
   console.log(">>> [TRENDING RESTAURANTS] Handler entered.");
  try {
     const query = `
       SELECT
             r.id, r.name, r.address, r.neighborhood_name as neighborhood, r.city_name as city,
             r.zip_code, r.borough, r.phone, r.website, r.google_place_id, r.latitude, r.longitude,
             r.adds, r.created_at, r.updated_at,
             -- Pre-aggregate tags and dish count for performance
             COALESCE(rt.tags, '{}') as tags,
             COALESCE(dc.dish_count, 0)::integer as dish_count
        FROM Restaurants r
        LEFT JOIN (
            SELECT rh.restaurant_id, array_agg(h.name ORDER BY h.name) as tags -- Order tags alphabetically
            FROM RestaurantHashtags rh JOIN Hashtags h ON rh.hashtag_id = h.id
            GROUP BY rh.restaurant_id
        ) rt ON r.id = rt.restaurant_id
        LEFT JOIN (
            SELECT restaurant_id, COUNT(*) as dish_count
            FROM Dishes
            GROUP BY restaurant_id
        ) dc ON r.id = dc.restaurant_id
        ORDER BY r.adds DESC NULLS LAST, r.created_at DESC -- Order by adds, then creation date
        LIMIT 15;
        `;
     const result = await db.query(query);
     console.log(`>>> [TRENDING RESTAURANTS] Found ${result.rows.length} restaurants.`);
     // Ensure tags is always an array
     const restaurants = (result.rows || []).map(r => ({
         ...r,
         tags: Array.isArray(r.tags) ? r.tags : []
     }));
     res.json(restaurants);
   } catch (err) {
     console.error(">>> [TRENDING RESTAURANTS] Error:", err);
     res.status(500).json({ error: "Error fetching trending restaurants", details: err.message });
   }
 });

// GET /api/trending/lists
// Fetches top 15 public lists ordered by saved_count, including item_count
router.get("/lists", async (req, res) => {
   console.log(">>> [TRENDING LISTS] Handler entered.");
  try {
    // Corrected query: Removed direct reference to l.is_following
    const query = `
      SELECT
          l.id, l.name, l.description, l.saved_count, l.city_name as city, l.tags, l.is_public,
          l.created_by_user, l.creator_handle, l.created_at, l.updated_at,
          -- Pre-calculate item_count
          COALESCE(lc.count, 0)::integer as item_count
       FROM Lists l
       LEFT JOIN (
            SELECT list_id, COUNT(*) as count
            FROM ListItems
            GROUP BY list_id
       ) lc ON l.id = lc.list_id
       WHERE l.is_public = TRUE -- Only show public lists in trending
       ORDER BY l.saved_count DESC NULLS LAST, l.created_at DESC -- Order by saves, then creation date
       LIMIT 15;
       `;
    const result = await db.query(query);
    console.log(`>>> [TRENDING LISTS] Found ${result.rows.length} lists.`);
    // Map result and provide default is_following: false for trending context
    const lists = (result.rows || []).map(l => ({
        ...l,
        item_count: l.item_count || 0, // Ensure item_count exists and is a number
        tags: Array.isArray(l.tags) ? l.tags : [], // Ensure tags is array
        is_following: false // Default to false for generic trending context
    }));
    res.json(lists);
  } catch (err) {
    console.error(">>> [TRENDING LISTS] Error:", err);
    res.status(500).json({ error: "Error fetching popular lists", details: err.message });
  }
});

module.exports = router;